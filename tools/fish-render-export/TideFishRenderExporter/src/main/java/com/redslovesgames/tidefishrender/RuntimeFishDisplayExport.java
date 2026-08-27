package com.redslovesgames.tidefishrender;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.li64.tide.client.FishDisplayRenderer;
import com.li64.tide.data.fishing.FishData;
import com.li64.tide.data.item.TideItemData;
import com.li64.tide.registries.blocks.entities.FishDisplayBlockEntity;
import com.mojang.blaze3d.systems.RenderSystem;
import com.mojang.blaze3d.systems.VertexSorter;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gl.SimpleFramebuffer;
import net.minecraft.client.render.LightmapTextureManager;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.texture.NativeImage;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.entity.Entity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.BlockPos;
import org.joml.Matrix4f;
import org.joml.Matrix4fStack;
import org.lwjgl.opengl.GL11;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

final class RuntimeFishDisplayExport {
    private static final int REPORT_SCHEMA_VERSION = 2;
    private static final int SOURCE_SIZE = 1024;
    private static final int PADDING = 48;
    private static final int EDGE_MARGIN = 18;
    private static final double TARGET_OCCUPANCY = 0.72;

    record Result(Path reportPath, Path failuresPath, int fishCount, int jobs, int successful, int failed, int cacheHits) {}

    private final MinecraftClient client;
    private final Path root;
    private final Path renders;
    private final Path generated;

    RuntimeFishDisplayExport(MinecraftClient client, Path root) throws IOException {
        this.client = client;
        this.root = root;
        this.renders = root.resolve("renders");
        this.generated = root.resolve("generated");
        Files.createDirectories(renders);
        Files.createDirectories(generated);
    }

    Result exportAll(List<RuntimeFishCatalog.Entry> entries) throws IOException {
        List<String> variants = visualVariants();
        JsonArray successes = new JsonArray();
        JsonArray failures = new JsonArray();
        int successful = 0;
        int cacheHits = 0;
        int jobs = entries.size() * variants.size();

        for (RuntimeFishCatalog.Entry entry : entries) {
            for (String variant : variants) {
                JsonObject row = baseRow(entry, variant);
                Path output = renderPath(entry, variant);
                try {
                    if (Files.isRegularFile(output) && Files.size(output) > 0) {
                        row.addProperty("png", "renders/" + output.getFileName());
                        row.addProperty("png_sha256", RuntimeEnvironment.sha256(output));
                        row.addProperty("cache_hit", true);
                        row.addProperty("source_authentic", true);
                        row.addProperty("render_mode", "tide_fish_display_cache");
                        successes.add(row);
                        successful++;
                        cacheHits++;
                        continue;
                    }

                    RenderResult result = renderOne(entry, variant, output);
                    row.addProperty("png", "renders/" + output.getFileName());
                    row.addProperty("png_sha256", RuntimeEnvironment.sha256(output));
                    row.addProperty("cache_hit", false);
                    row.addProperty("source_authentic", true);
                    row.addProperty("length_cm", result.lengthCm());
                    row.addProperty("resolved_entity_id", result.entityId().toString());
                    row.addProperty("entity_renderer", result.rendererClass());
                    row.addProperty("silhouette_width", result.bounds().width());
                    row.addProperty("silhouette_height", result.bounds().height());
                    row.addProperty("source_resolution", SOURCE_SIZE);
                    row.addProperty("render_mode", "tide_fish_display");
                    successes.add(row);
                    successful++;
                } catch (Exception ex) {
                    String failureCode = classify(ex);
                    row.addProperty("failure_code", failureCode);
                    row.addProperty("error", ex.getClass().getName() + ": " + String.valueOf(ex.getMessage()));
                    failures.add(row);
                }
            }
        }

        JsonObject report = new JsonObject();
        report.addProperty("schema_version", REPORT_SCHEMA_VERSION);
        report.addProperty("generated_at", Instant.now().toString());
        report.addProperty("renderer", "TideFishRuntimeExporter");
        report.addProperty("source", "runtime:TideData.FISH");
        report.addProperty("fish_count", entries.size());
        report.addProperty("variant_count", variants.size());
        report.addProperty("jobs", jobs);
        report.addProperty("successful", successful);
        report.addProperty("failed", jobs - successful);
        report.addProperty("cache_hits", cacheHits);
        report.add("variants", strings(variants));
        report.add("non_visual_variants_not_rendered", strings(List.of("perfect_specimen")));
        report.add("render_contract", renderContract());
        report.add("successes", successes);
        report.add("failures", failures);

        Path reportPath = generated.resolve("render-report.json");
        Files.writeString(reportPath, pretty(report), StandardCharsets.UTF_8);

        JsonObject failureReport = new JsonObject();
        failureReport.addProperty("schema_version", REPORT_SCHEMA_VERSION);
        failureReport.addProperty("generated_at", Instant.now().toString());
        failureReport.addProperty("failed", failures.size());
        failureReport.add("failures", failures);
        Path failuresPath = generated.resolve("failures.json");
        Files.writeString(failuresPath, pretty(failureReport), StandardCharsets.UTF_8);

        return new Result(reportPath, failuresPath, entries.size(), jobs, successful, jobs - successful, cacheHits);
    }

    private List<String> visualVariants() {
        if (!TideborneVariantSupport.isLoaded()) return List.of("default");
        List<String> variants = new ArrayList<>();
        for (String variant : TideborneVariantSupport.REQUESTABLE_VARIANTS) {
            if (!"perfect_specimen".equals(variant)) variants.add(variant);
        }
        return List.copyOf(variants);
    }

    private RenderResult renderOne(RuntimeFishCatalog.Entry entry, String variant, Path output) throws Exception {
        Identifier itemId = Identifier.of(entry.itemId());
        if (!Registries.ITEM.containsId(itemId)) {
            throw new RenderFailureException(RenderFailureCode.MISSING_ITEM, "Runtime fish item is missing: " + itemId);
        }

        Item item = Registries.ITEM.get(itemId);
        ItemStack stack = new ItemStack(item);
        TideborneVariantSupport.VariantSpec variantSpec = TideborneVariantSupport.apply(stack, variant, entry);
        TideItemData.FISH_LENGTH.set(stack, variantSpec.lengthCm());

        FishData data = FishData.getExact(stack).orElseThrow(() -> new RenderFailureException(
                RenderFailureCode.FISH_DATA_CONTRACT,
                "Tide FishData is not registered for runtime stack " + itemId
        ));
        if (data.display().isEmpty()) {
            throw new RenderFailureException(
                    RenderFailureCode.FISH_DATA_CONTRACT,
                    "Tide FishData has no DisplayData for runtime stack " + itemId
            );
        }

        Identifier displayBlockId = Identifier.of("tide:fish_display");
        if (!Registries.BLOCK.containsId(displayBlockId)) {
            throw new RenderFailureException(RenderFailureCode.MISSING_DISPLAY_BLOCK, "Tide fish display block is not registered");
        }
        Block block = Registries.BLOCK.get(displayBlockId);
        BlockState state = block.getDefaultState();
        FishDisplayBlockEntity display = new FishDisplayBlockEntity(BlockPos.ORIGIN, state);
        if (!display.setDisplayStack(stack)) {
            throw new RenderFailureException(RenderFailureCode.FISH_DISPLAY_REJECTED, "Tide Fish Display rejected runtime stack " + itemId);
        }

        NativeImage image = null;
        try {
            ImageOps.Bounds bounds = null;
            Identifier resolvedEntityId = null;
            String rendererClass = null;
            float scale = 0.75f;
            for (int pass = 0; pass < 7; pass++) {
                if (image != null) {
                    image.close();
                    image = null;
                }
                FrameResult frame = renderDisplayFramebuffer(display, scale);
                image = frame.image();
                resolvedEntityId = frame.entityId();
                rendererClass = frame.rendererClass();
                bounds = ImageOps.alphaBounds(image);
                if (bounds == null) {
                    throw new RenderFailureException(RenderFailureCode.EMPTY_FRAMEBUFFER, "Tide Fish Display produced zero alpha pixels");
                }
                if (bounds.touches(image.getWidth(), image.getHeight(), EDGE_MARGIN)) {
                    scale *= 0.72f;
                    continue;
                }
                double occupancy = bounds.occupancy(image.getWidth(), image.getHeight());
                if (occupancy < 0.46 && pass < 5) {
                    scale *= (float) Math.min(1.85, TARGET_OCCUPANCY / Math.max(occupancy, 0.05));
                    continue;
                }
                break;
            }

            if (image == null || bounds == null || resolvedEntityId == null || rendererClass == null) {
                throw new RenderFailureException(RenderFailureCode.EMPTY_FRAMEBUFFER, "Tide Fish Display produced no usable rendered silhouette");
            }

            try (NativeImage cropped = ImageOps.cropWithPadding(image, bounds, PADDING)) {
                ImageOps.write(cropped, output);
            }
            return new RenderResult(bounds, variantSpec.lengthCm(), resolvedEntityId, rendererClass);
        } finally {
            if (image != null) image.close();
        }
    }

    private FrameResult renderDisplayFramebuffer(FishDisplayBlockEntity display, float scale) throws IOException {
        FrameContext context = beginFrame(scale);
        VertexConsumerProvider.Immediate consumers = client.getBufferBuilders().getEntityVertexConsumers();
        client.getEntityRenderDispatcher().setRenderShadows(false);
        try {
            MatrixStack matrices = new MatrixStack();
            matrices.translate(-0.5, -0.5, -0.5);
            FishDisplayRenderer renderer = new FishDisplayRenderer(client.getEntityRenderDispatcher());
            renderer.render(
                    display,
                    0f,
                    matrices,
                    consumers,
                    LightmapTextureManager.MAX_LIGHT_COORDINATE,
                    OverlayTexture.DEFAULT_UV
            );
            Entity renderedEntity = display.getRenderedEntity();
            if (renderedEntity == null) {
                throw new RenderFailureException(
                        RenderFailureCode.FISH_DISPLAY_RENDER_FAILURE,
                        "Tide Fish Display did not create an entity for " + display.getDisplayStack().getItem()
                );
            }
            Identifier entityId = Registries.ENTITY_TYPE.getId(renderedEntity.getType());
            if (entityId == null) {
                throw new RenderFailureException(RenderFailureCode.ENTITY_CONTRACT, "Rendered entity has no runtime registry ID");
            }
            String rendererClass = client.getEntityRenderDispatcher().getRenderer(renderedEntity).getClass().getName();
            consumers.draw();
            return new FrameResult(readFrame(context.framebuffer()), entityId, rendererClass);
        } finally {
            endFrame(context);
        }
    }

    private FrameContext beginFrame(float scale) {
        Matrix4f previousProjection = new Matrix4f(RenderSystem.getProjectionMatrix());
        VertexSorter previousVertexSorting = RenderSystem.getVertexSorting();
        Matrix4fStack modelView = RenderSystem.getModelViewStack();
        int previousWidth = client.getFramebuffer().textureWidth;
        int previousHeight = client.getFramebuffer().textureHeight;

        SimpleFramebuffer framebuffer = new SimpleFramebuffer(SOURCE_SIZE, SOURCE_SIZE, true, true);
        framebuffer.setClearColor(0f, 0f, 0f, 0f);
        framebuffer.setTexFilter(GL11.GL_NEAREST);
        RenderSystem.enableBlend();
        framebuffer.clear(MinecraftClient.IS_SYSTEM_MAC);
        framebuffer.beginWrite(true);
        RenderSystem.viewport(0, 0, SOURCE_SIZE, SOURCE_SIZE);
        RenderSystem.setProjectionMatrix(
                new Matrix4f().setOrtho(-1.0f, 1.0f, -1.0f, 1.0f, -1000.0f, 3000.0f),
                VertexSorter.BY_DISTANCE
        );
        modelView.pushMatrix();
        modelView.identity();
        modelView.scale(scale, scale, scale);
        RenderSystem.applyModelViewMatrix();
        RenderSystem.enableDepthTest();
        RenderSystem.depthMask(true);
        return new FrameContext(framebuffer, previousProjection, previousVertexSorting, modelView, previousWidth, previousHeight);
    }

    private NativeImage readFrame(SimpleFramebuffer framebuffer) {
        NativeImage image = new NativeImage(framebuffer.textureWidth, framebuffer.textureHeight, false);
        framebuffer.beginRead();
        try {
            image.loadFromTextureImage(0, false);
            image.mirrorVertically();
            return image;
        } catch (RuntimeException | Error failure) {
            image.close();
            throw failure;
        } finally {
            framebuffer.endRead();
        }
    }

    private void endFrame(FrameContext context) {
        client.getEntityRenderDispatcher().setRenderShadows(true);
        context.framebuffer().endWrite();
        context.framebuffer().delete();
        context.modelView().popMatrix();
        RenderSystem.applyModelViewMatrix();
        RenderSystem.setProjectionMatrix(context.previousProjection(), context.previousVertexSorting());
        RenderSystem.viewport(0, 0, context.previousWidth(), context.previousHeight());
        client.getFramebuffer().beginWrite(true);
    }

    private Path renderPath(RuntimeFishCatalog.Entry entry, String variant) {
        String id = entry.fishId();
        int colon = id.indexOf(':');
        String namespace = colon < 0 ? "minecraft" : id.substring(0, colon);
        String path = colon < 0 ? id : id.substring(colon + 1);
        String base = namespace + "__" + path.replace('/', '_').replace(':', '_');
        String suffix = "default".equals(variant) ? "" : "__" + variant;
        return renders.resolve(base + suffix + ".png");
    }

    private JsonObject baseRow(RuntimeFishCatalog.Entry entry, String variant) {
        JsonObject row = new JsonObject();
        row.addProperty("data_key", entry.dataKey());
        row.addProperty("fish_id", entry.fishId());
        row.addProperty("item_id", entry.itemId());
        if (entry.entityId() != null) row.addProperty("declared_entity_id", entry.entityId());
        row.addProperty("source_mod", entry.sourceMod());
        row.addProperty("variant", variant);
        return row;
    }

    private JsonObject renderContract() {
        JsonObject contract = new JsonObject();
        contract.addProperty("discovery", "com.li64.tide.data.TideData.FISH");
        contract.addProperty("display_block_entity", "com.li64.tide.registries.blocks.entities.FishDisplayBlockEntity");
        contract.addProperty("renderer", "com.li64.tide.client.FishDisplayRenderer");
        contract.addProperty("direct_entity_fallback", false);
        contract.addProperty("transparent_framebuffer", true);
        contract.addProperty("source_resolution", SOURCE_SIZE);
        contract.addProperty("cache_keyed_by_runtime", true);
        return contract;
    }

    private static String classify(Exception exception) {
        if (exception instanceof RenderFailureException failure) return failure.code().wireName();
        return RenderFailureCode.UNEXPECTED_EXCEPTION.wireName();
    }

    private static JsonArray strings(List<String> values) {
        JsonArray out = new JsonArray();
        values.forEach(out::add);
        return out;
    }

    private static String pretty(JsonObject object) {
        return new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(object);
    }

    private record RenderResult(ImageOps.Bounds bounds, double lengthCm, Identifier entityId, String rendererClass) {}
    private record FrameResult(NativeImage image, Identifier entityId, String rendererClass) {}
    private record FrameContext(SimpleFramebuffer framebuffer, Matrix4f previousProjection, VertexSorter previousVertexSorting,
                                Matrix4fStack modelView, int previousWidth, int previousHeight) {}
}
