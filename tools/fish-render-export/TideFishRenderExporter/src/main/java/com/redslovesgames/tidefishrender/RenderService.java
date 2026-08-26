package com.redslovesgames.tidefishrender;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.li64.tide.client.FishDisplayRenderer;
import com.li64.tide.data.item.TideItemData;
import com.li64.tide.registries.blocks.entities.FishDisplayBlockEntity;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gl.SimpleFramebuffer;
import net.minecraft.client.render.LightmapTextureManager;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.texture.NativeImage;
import net.minecraft.client.util.BufferAllocator;
import net.minecraft.client.util.ScreenshotRecorder;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.BlockPos;
import org.lwjgl.opengl.GL11;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

final class RenderService {
    private static final int SOURCE_SIZE = 1024;
    private static final int PADDING = 48;
    private static final int EDGE_MARGIN = 18;
    private static final double TARGET_OCCUPANCY = 0.72;
    private final MinecraftClient client;
    private final List<RegistryLoader.Entry> entries;
    private final Path root;
    private final Path renders;
    private final Path generated;

    private RenderService(MinecraftClient client, List<RegistryLoader.Entry> entries) {
        this.client = client;
        this.entries = entries;
        this.root = client.runDirectory.toPath().resolve("fishrender-output");
        this.renders = root.resolve("fish/assets/renders");
        this.generated = root.resolve("generated");
    }

    static RenderService create() throws IOException {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.world == null) throw new IOException("Open a single-player world or connected world first. Tide's Fish Display renderer needs a live ClientWorld.");
        return new RenderService(client, RegistryLoader.load());
    }

    RenderReport verifyAll() throws IOException { return process(entries.stream().map(e -> new Job(e, "default")).toList(), "verify", false); }
    RenderReport exportAll(String variant) throws IOException { return process(expand(entries, variant), "export:" + variant, true); }
    RenderReport exportNamespace(String namespace, String variant) throws IOException { return process(expand(entries.stream().filter(e -> namespace(e.fishId()).equals(namespace)).toList(), variant), "export:" + namespace + ":" + variant, true); }
    RenderReport exportFish(String id, String variant) throws IOException {
        String canonical = id.contains(":") ? id : id.replaceFirst("__", ":");
        RegistryLoader.Entry entry = entries.stream().filter(e -> e.fishId().equals(canonical)).findFirst().orElseThrow(() -> new IOException("Fish not in registry: " + canonical));
        return process(expand(List.of(entry), variant), "export:" + canonical + ":" + variant, true);
    }

    private List<Job> expand(List<RegistryLoader.Entry> base, String requested) {
        if ("all_variants".equalsIgnoreCase(requested)) {
            List<Job> jobs = new ArrayList<>();
            for (RegistryLoader.Entry entry : base) for (String variant : TideborneVariantSupport.REQUESTABLE_VARIANTS) jobs.add(new Job(entry, variant));
            return jobs;
        }
        return base.stream().map(entry -> new Job(entry, requested == null ? "default" : requested)).toList();
    }

    private RenderReport process(List<Job> jobs, String mode, boolean writePng) throws IOException {
        JsonArray failures = new JsonArray(), successes = new JsonArray();
        int successful = 0, variants = 0;
        for (Job job : jobs) {
            JsonObject row = baseRow(job);
            try {
                RenderResult result = renderOne(job, writePng);
                if (result.png() != null) row.addProperty("png", root.relativize(result.png()).toString().replace('\\', '/'));
                row.addProperty("length_cm", result.lengthCm());
                row.addProperty("silhouette_width", result.bounds().width());
                row.addProperty("silhouette_height", result.bounds().height());
                row.addProperty("source_resolution", SOURCE_SIZE);
                successes.add(row);
                successful++;
                if (!job.variant().equals("default")) variants++;
            } catch (Exception ex) {
                row.addProperty("error", ex.getClass().getName() + ": " + String.valueOf(ex.getMessage()));
                row.addProperty("failure_class", classify(ex));
                failures.add(row);
            }
        }
        Files.createDirectories(generated);
        JsonObject report = new JsonObject();
        report.addProperty("generated_at", Instant.now().toString());
        report.addProperty("mode", mode);
        report.addProperty("total_fish", new HashSet<>(jobs.stream().map(j -> j.entry().fishId()).toList()).size());
        report.addProperty("jobs", jobs.size());
        report.addProperty("successful", successful);
        report.addProperty("failed", jobs.size() - successful);
        report.addProperty("variant_renders", variants);
        report.add("successes", successes);
        report.add("exceptions", failures);
        Path reportPath = generated.resolve("render-report.json");
        Files.writeString(reportPath, new GsonBuilder().setPrettyPrinting().create().toJson(report), StandardCharsets.UTF_8);
        JsonObject missing = new JsonObject();
        missing.addProperty("generated_at", Instant.now().toString());
        missing.addProperty("failed", failures.size());
        missing.add("missing", failures);
        Files.writeString(generated.resolve("missing-renders.json"), new GsonBuilder().setPrettyPrinting().create().toJson(missing), StandardCharsets.UTF_8);
        return new RenderReport(report.get("total_fish").getAsInt(), successful, jobs.size() - successful, variants, reportPath);
    }

    private RenderResult renderOne(Job job, boolean writePng) throws Exception {
        Identifier itemId = Identifier.of(job.entry().itemId());
        if (!Registries.ITEM.containsId(itemId)) throw new IllegalStateException("Missing ItemStack item: " + itemId);
        Item item = Registries.ITEM.get(itemId);
        ItemStack stack = new ItemStack(item);
        TideborneVariantSupport.VariantSpec spec = TideborneVariantSupport.apply(stack, job.variant(), job.entry());
        TideItemData.FISH_LENGTH.set(stack, spec.lengthCm());

        Identifier displayBlockId = Identifier.of("tide:fish_display");
        if (!Registries.BLOCK.containsId(displayBlockId)) throw new IllegalStateException("Tide fish display block is not registered");
        Block block = Registries.BLOCK.get(displayBlockId);
        BlockState state = block.getDefaultState();
        FishDisplayBlockEntity display = new FishDisplayBlockEntity(BlockPos.ORIGIN, state);
        if (!display.setDisplayStack(stack)) throw new IllegalStateException("Fish Display rejected stack: " + itemId);
        if (display.getDisplayData() == null) throw new IllegalStateException("No DisplayData for " + job.entry().fishId());
        if (display.getDisplayData().entityType() == null) throw new IllegalStateException("DisplayData has no entity type for " + job.entry().fishId());

        NativeImage image = null;
        ImageOps.Bounds bounds = null;
        float scale = 1.25f;
        for (int pass = 0; pass < 7; pass++) {
            if (image != null) image.close();
            image = renderFramebuffer(display, scale);
            bounds = ImageOps.alphaBounds(image);
            if (bounds == null) throw new IllegalStateException("Framebuffer produced zero alpha pixels");
            if (bounds.touches(image.getWidth(), image.getHeight(), EDGE_MARGIN)) { scale *= 0.72f; continue; }
            double occupancy = bounds.occupancy(image.getWidth(), image.getHeight());
            if (occupancy < 0.46 && pass < 5) { scale *= (float) Math.min(1.85, TARGET_OCCUPANCY / Math.max(occupancy, 0.05)); continue; }
            break;
        }
        if (bounds == null || image == null) throw new IllegalStateException("No rendered silhouette");
        Path output = renderPath(job);
        if (writePng) try (NativeImage cropped = ImageOps.cropWithPadding(image, bounds, PADDING)) { ImageOps.write(cropped, output); }
        image.close();
        return new RenderResult(writePng ? output : null, bounds, spec.lengthCm());
    }

    private NativeImage renderFramebuffer(FishDisplayBlockEntity display, float scale) {
        SimpleFramebuffer framebuffer = new SimpleFramebuffer(SOURCE_SIZE, SOURCE_SIZE, true, true);
        framebuffer.setClearColor(0f, 0f, 0f, 0f);
        framebuffer.setTexFilter(GL11.GL_NEAREST);
        framebuffer.beginWrite(true);
        framebuffer.clear(MinecraftClient.IS_SYSTEM_MAC);
        MatrixStack matrices = new MatrixStack();
        matrices.translate(0.0, -0.15, -3.2);
        matrices.scale(scale, scale, scale);
        BufferAllocator allocator = new BufferAllocator(2_097_152);
        VertexConsumerProvider.Immediate consumers = VertexConsumerProvider.immediate(allocator);
        try {
            FishDisplayRenderer renderer = new FishDisplayRenderer(client.getEntityRenderDispatcher());
            renderer.render(display, 0f, matrices, consumers, LightmapTextureManager.MAX_LIGHT_COORDINATE, OverlayTexture.DEFAULT_UV);
            consumers.draw();
            return ScreenshotRecorder.takeScreenshot(framebuffer);
        } finally {
            framebuffer.endWrite();
            framebuffer.delete();
            allocator.close();
            client.getFramebuffer().beginWrite(true);
        }
    }

    private JsonObject baseRow(Job job) {
        JsonObject row = new JsonObject();
        row.addProperty("fish_id", job.entry().fishId());
        row.addProperty("source_mod", job.entry().sourceMod());
        row.addProperty("entity_id", job.entry().entityId());
        row.addProperty("variant", job.variant());
        return row;
    }

    private static String classify(Exception exception) {
        String message = String.valueOf(exception.getMessage()).toLowerCase();
        if (message.contains("item")) return "missing_item";
        if (message.contains("entity type") || message.contains("entity")) return "missing_entity_or_renderer";
        if (message.contains("alpha") || message.contains("silhouette")) return "empty_framebuffer";
        if (message.contains("tideborne") || message.contains("component")) return "variant_setup";
        return "exception";
    }

    private Path renderPath(Job job) {
        String id = job.entry().fishId();
        int colon = id.indexOf(':');
        String namespace = colon < 0 ? "minecraft" : id.substring(0, colon);
        String path = colon < 0 ? id : id.substring(colon + 1);
        String base = namespace + "__" + path.replace('/', '_').replace(':', '_');
        String suffix = job.variant().equals("default") ? "" : "__" + job.variant();
        return renders.resolve(base + suffix + ".png");
    }

    private static String namespace(String id) { int i = id.indexOf(':'); return i < 0 ? "minecraft" : id.substring(0, i); }
    private record Job(RegistryLoader.Entry entry, String variant) {}
    private record RenderResult(Path png, ImageOps.Bounds bounds, double lengthCm) {}
}
