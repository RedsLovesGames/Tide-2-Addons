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
import net.minecraft.entity.EntityType;
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
import java.util.HashSet;
import java.util.List;

final class RenderService {
    private static final int REPORT_SCHEMA_VERSION = 2;
    private static final int SOURCE_SIZE = 1024;
    private static final int PADDING = 48;
    private static final int EDGE_MARGIN = 18;
    private static final double TARGET_OCCUPANCY = 0.72;

    // GeckoLib Hybrid Aquatic fish need the complete pose rotated 90 degrees while
    // EntityRenderDispatcher yaw stays at zero. This is the validated side-profile
    // orientation and is committed here so CI never rewrites Java source before build.
    private static final float DIRECT_ENTITY_MATRIX_YAW = 90.0f;
    private static final float DIRECT_ENTITY_DISPATCHER_YAW = 0.0f;

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
        return create(false);
    }

    static RenderService create(boolean modpackScope) throws IOException {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.world == null) {
            throw new IOException("Open a single-player world or connected world first. Fish rendering needs a live ClientWorld.");
        }
        return new RenderService(client, modpackScope ? RegistryLoader.loadModpackScope() : RegistryLoader.load());
    }

    RenderReport verifyAll() throws IOException {
        return process(entries.stream().map(e -> new Job(e, "default")).toList(), "verify", false);
    }

    RenderReport exportAll(String variant) throws IOException {
        return process(expand(entries, variant), "export:" + variant, true);
    }

    RenderReport exportModpackScope() throws IOException {
        return process(entries.stream().map(e -> new Job(e, "default")).toList(), "export:scope:default", true);
    }

    RenderReport exportNamespace(String namespace, String variant) throws IOException {
        return process(
                expand(entries.stream().filter(e -> namespace(e.fishId()).equals(namespace)).toList(), variant),
                "export:" + namespace + ":" + variant,
                true
        );
    }

    RenderReport exportFish(String id, String variant) throws IOException {
        String canonical = id.contains(":") ? id : id.replaceFirst("__", ":");
        RegistryLoader.Entry entry = entries.stream()
                .filter(e -> e.fishId().equals(canonical))
                .findFirst()
                .orElseThrow(() -> new IOException("Fish not in registry: " + canonical));
        return process(expand(List.of(entry), variant), "export:" + canonical + ":" + variant, true);
    }

    private List<Job> expand(List<RegistryLoader.Entry> base, String requested) {
        if ("all_variants".equalsIgnoreCase(requested)) {
            List<Job> jobs = new ArrayList<>();
            for (RegistryLoader.Entry entry : base) {
                for (String variant : TideborneVariantSupport.REQUESTABLE_VARIANTS) {
                    jobs.add(new Job(entry, variant));
                }
            }
            return jobs;
        }
        return base.stream().map(entry -> new Job(entry, requested == null ? "default" : requested)).toList();
    }

    private RenderReport process(List<Job> jobs, String mode, boolean writePng) throws IOException {
        JsonArray failures = new JsonArray();
        JsonArray successes = new JsonArray();
        int successful = 0;
        int variants = 0;

        for (Job job : jobs) {
            JsonObject row = baseRow(job);
            try {
                RenderResult result = renderOne(job, writePng);
                if (result.png() != null) {
                    row.addProperty("png", root.relativize(result.png()).toString().replace('\\', '/'));
                }
                row.addProperty("length_cm", result.lengthCm());
                row.addProperty("resolved_entity_id", result.entityId().toString());
                row.addProperty("silhouette_width", result.bounds().width());
                row.addProperty("silhouette_height", result.bounds().height());
                row.addProperty("source_resolution", SOURCE_SIZE);
                row.addProperty("render_mode", result.renderMode());
                successes.add(row);
                successful++;
                if (!job.variant().equals("default")) {
                    variants++;
                }
            } catch (Exception ex) {
                String failureCode = classify(ex);
                row.addProperty("error", ex.getClass().getName() + ": " + String.valueOf(ex.getMessage()));
                row.addProperty("failure_code", failureCode);
                row.addProperty("failure_class", failureCode);
                failures.add(row);
            }
        }

        Files.createDirectories(generated);
        JsonObject report = new JsonObject();
        report.addProperty("schema_version", REPORT_SCHEMA_VERSION);
        report.addProperty("generated_at", Instant.now().toString());
        report.addProperty("renderer", "TideFishRenderExporter");
        report.addProperty("minecraft_version", "1.21.1");
        report.addProperty("mode", mode);
        report.addProperty("source_resolution", SOURCE_SIZE);
        report.addProperty("total_fish", new HashSet<>(jobs.stream().map(j -> j.entry().fishId()).toList()).size());
        report.addProperty("jobs", jobs.size());
        report.addProperty("successful", successful);
        report.addProperty("failed", jobs.size() - successful);
        report.addProperty("variant_renders", variants);
        report.add("render_contract", renderContract());
        report.add("successes", successes);
        report.add("exceptions", failures);

        Path reportPath = generated.resolve("render-report.json");
        Files.writeString(
                reportPath,
                new GsonBuilder().setPrettyPrinting().create().toJson(report),
                StandardCharsets.UTF_8
        );

        JsonObject missing = new JsonObject();
        missing.addProperty("schema_version", REPORT_SCHEMA_VERSION);
        missing.addProperty("generated_at", Instant.now().toString());
        missing.addProperty("renderer", "TideFishRenderExporter");
        missing.addProperty("mode", mode);
        missing.addProperty("failed", failures.size());
        missing.add("missing", failures);
        Files.writeString(
                generated.resolve("missing-renders.json"),
                new GsonBuilder().setPrettyPrinting().create().toJson(missing),
                StandardCharsets.UTF_8
        );

        return new RenderReport(
                report.get("total_fish").getAsInt(),
                successful,
                jobs.size() - successful,
                variants,
                reportPath
        );
    }

    private JsonObject renderContract() {
        JsonObject contract = new JsonObject();
        contract.addProperty("tide_display_renderer", "com.li64.tide.client.FishDisplayRenderer");
        contract.addProperty("direct_entity_renderer", "net.minecraft.client.render.entity.EntityRenderDispatcher");
        contract.addProperty("direct_entity_matrix_yaw", DIRECT_ENTITY_MATRIX_YAW);
        contract.addProperty("direct_entity_dispatcher_yaw", DIRECT_ENTITY_DISPATCHER_YAW);
        contract.addProperty("transparent_framebuffer", true);
        contract.addProperty("framebuffer_reuse", false);
        return contract;
    }

    private RenderResult renderOne(Job job, boolean writePng) throws Exception {
        String ns = namespace(job.entry().fishId());
        if ("hybrid_aquatic".equals(ns) || "crittersandcompanions".equals(ns)) {
            if (!"default".equalsIgnoreCase(job.variant())) {
                throw new RenderFailureException(
                        RenderFailureCode.UNSUPPORTED_VARIANT,
                        "Direct entity renderer only supports source-authentic default state for " + job.entry().fishId()
                );
            }
            try {
                return renderDirectEntity(job, writePng);
            } catch (RenderFailureException failure) {
                throw failure;
            } catch (Exception failure) {
                throw new RenderFailureException(
                        RenderFailureCode.DIRECT_ENTITY_RENDER_FAILURE,
                        "Direct entity render failed for " + job.entry().fishId(),
                        failure
                );
            }
        }
        try {
            return renderFishDisplay(job, writePng);
        } catch (RenderFailureException failure) {
            throw failure;
        } catch (Exception failure) {
            throw new RenderFailureException(
                    RenderFailureCode.FISH_DISPLAY_RENDER_FAILURE,
                    "Tide Fish Display render failed for " + job.entry().fishId(),
                    failure
            );
        }
    }

    private RenderResult renderFishDisplay(Job job, boolean writePng) throws Exception {
        Identifier itemId = Identifier.of(job.entry().itemId());
        if (!Registries.ITEM.containsId(itemId)) {
            throw new RenderFailureException(RenderFailureCode.MISSING_ITEM, "Missing ItemStack item: " + itemId);
        }
        Item item = Registries.ITEM.get(itemId);
        ItemStack stack = new ItemStack(item);
        TideborneVariantSupport.VariantSpec spec = TideborneVariantSupport.apply(stack, job.variant(), job.entry());
        TideItemData.FISH_LENGTH.set(stack, spec.lengthCm());
        FishData data = FishData.getExact(stack)
                .orElseThrow(() -> new RenderFailureException(
                        RenderFailureCode.FISH_DATA_CONTRACT,
                        "Tide FishData is not registered for " + itemId
                ));
        if (data.display().isEmpty()) {
            throw new RenderFailureException(RenderFailureCode.FISH_DATA_CONTRACT, "Tide FishData has no DisplayData for " + itemId);
        }

        Identifier displayBlockId = Identifier.of("tide:fish_display");
        if (!Registries.BLOCK.containsId(displayBlockId)) {
            throw new RenderFailureException(RenderFailureCode.MISSING_DISPLAY_BLOCK, "Tide fish display block is not registered");
        }
        Block block = Registries.BLOCK.get(displayBlockId);
        BlockState state = block.getDefaultState();
        FishDisplayBlockEntity display = new FishDisplayBlockEntity(BlockPos.ORIGIN, state);
        if (!display.setDisplayStack(stack)) {
            throw new RenderFailureException(RenderFailureCode.FISH_DISPLAY_REJECTED, "Fish Display rejected stack: " + itemId);
        }
        if (display.getDisplayData() == null) {
            throw new RenderFailureException(RenderFailureCode.FISH_DATA_CONTRACT, "No DisplayData for " + job.entry().fishId());
        }
        if (display.getDisplayData().entityType() == null) {
            throw new RenderFailureException(RenderFailureCode.FISH_DATA_CONTRACT, "DisplayData has no entity type for " + job.entry().fishId());
        }

        NativeImage image = null;
        try {
            ImageOps.Bounds bounds = null;
            Identifier resolvedEntityId = null;
            float scale = 0.75f;
            for (int pass = 0; pass < 7; pass++) {
                if (image != null) {
                    image.close();
                    image = null;
                }
                FrameResult frame = renderDisplayFramebuffer(display, scale);
                image = frame.image();
                resolvedEntityId = frame.entityId();
                bounds = ImageOps.alphaBounds(image);
                if (bounds == null) {
                    throw new RenderFailureException(RenderFailureCode.EMPTY_FRAMEBUFFER, "Framebuffer produced zero alpha pixels");
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

            if (bounds == null || image == null || resolvedEntityId == null) {
                throw new RenderFailureException(RenderFailureCode.EMPTY_FRAMEBUFFER, "No rendered silhouette");
            }
            Path output = renderPath(job);
            if (writePng) {
                try (NativeImage cropped = ImageOps.cropWithPadding(image, bounds, PADDING)) {
                    ImageOps.write(cropped, output);
                }
            }
            return new RenderResult(
                    writePng ? output : null,
                    bounds,
                    spec.lengthCm(),
                    resolvedEntityId,
                    "tide_fish_display"
            );
        } finally {
            if (image != null) {
                image.close();
            }
        }
    }

    private RenderResult renderDirectEntity(Job job, boolean writePng) throws Exception {
        String rawEntityId = job.entry().entityId();
        Identifier expectedId = Identifier.of(
                rawEntityId == null || rawEntityId.isBlank() ? job.entry().fishId() : rawEntityId
        );
        if (!Registries.ENTITY_TYPE.containsId(expectedId)) {
            throw new RenderFailureException(RenderFailureCode.ENTITY_CONTRACT, "Missing entity type: " + expectedId);
        }
        EntityType<?> type = Registries.ENTITY_TYPE.get(expectedId);
        Entity entity = type.create(client.world);
        if (entity == null) {
            throw new RenderFailureException(RenderFailureCode.ENTITY_CONTRACT, "Entity type could not create client entity: " + expectedId);
        }

        Identifier resolved = Registries.ENTITY_TYPE.getId(entity.getType());
        if (!expectedId.equals(resolved)) {
            throw new RenderFailureException(
                    RenderFailureCode.ENTITY_CONTRACT,
                    "Entity type resolved mismatch: expected=" + expectedId + " actual=" + resolved
            );
        }
        String rendererClass = client.getEntityRenderDispatcher().getRenderer(entity).getClass().getName();
        System.out.println(
                "FISHRENDER_ENTITY_DIRECT fish=" + job.entry().fishId()
                        + " entity=" + resolved
                        + " renderer=" + rendererClass
                        + " projection=ortho yaw=" + DIRECT_ENTITY_DISPATCHER_YAW
                        + " matrix_y=" + DIRECT_ENTITY_MATRIX_YAW
        );

        NativeImage image = null;
        try {
            ImageOps.Bounds bounds = null;
            float scale = 0.72f;
            for (int pass = 0; pass < 8; pass++) {
                if (image != null) {
                    image.close();
                    image = null;
                }
                FrameResult frame = renderEntityFramebuffer(entity, scale);
                image = frame.image();
                bounds = ImageOps.alphaBounds(image);
                if (bounds == null) {
                    throw new RenderFailureException(
                            RenderFailureCode.EMPTY_FRAMEBUFFER,
                            "Direct entity framebuffer produced zero alpha pixels: " + expectedId
                    );
                }
                if (bounds.touches(image.getWidth(), image.getHeight(), EDGE_MARGIN)) {
                    scale *= 0.70f;
                    continue;
                }
                double occupancy = bounds.occupancy(image.getWidth(), image.getHeight());
                if (occupancy < 0.46 && pass < 6) {
                    scale *= (float) Math.min(1.80, TARGET_OCCUPANCY / Math.max(occupancy, 0.05));
                    continue;
                }
                break;
            }

            if (bounds == null || image == null) {
                throw new RenderFailureException(RenderFailureCode.EMPTY_FRAMEBUFFER, "No rendered silhouette for direct entity: " + expectedId);
            }
            Path output = renderPath(job);
            if (writePng) {
                try (NativeImage cropped = ImageOps.cropWithPadding(image, bounds, PADDING)) {
                    ImageOps.write(cropped, output);
                }
            }
            return new RenderResult(
                    writePng ? output : null,
                    bounds,
                    job.entry().representativeLengthCm(),
                    resolved,
                    "minecraft_entity_dispatcher"
            );
        } finally {
            if (image != null) {
                image.close();
            }
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
                        "Tide Fish Display did not create a rendered entity"
                );
            }
            Identifier entityId = Registries.ENTITY_TYPE.getId(renderedEntity.getType());
            if (entityId == null || !RegistryLoader.isScopedNamespace(entityId.getNamespace())) {
                throw new RenderFailureException(
                        RenderFailureCode.ENTITY_CONTRACT,
                        "Tide FishData resolved an out-of-scope entity: " + entityId
                );
            }
            System.out.println(
                    "FISHRENDER_ENTITY fish=" + display.getDisplayStack().getItem()
                            + " entity=" + renderedEntity.getType()
                            + " renderer=" + client.getEntityRenderDispatcher().getRenderer(renderedEntity).getClass().getName()
                            + " projection=ortho"
            );
            consumers.draw();
            return new FrameResult(readFrame(context.framebuffer()), entityId);
        } finally {
            endFrame(context);
        }
    }

    private FrameResult renderEntityFramebuffer(Entity entity, float scale) throws IOException {
        FrameContext context = beginFrame(scale);
        VertexConsumerProvider.Immediate consumers = client.getBufferBuilders().getEntityVertexConsumers();
        client.getEntityRenderDispatcher().setRenderShadows(false);
        try {
            MatrixStack matrices = new MatrixStack();
            matrices.multiply(
                    net.minecraft.util.math.RotationAxis.POSITIVE_Y.rotationDegrees(DIRECT_ENTITY_MATRIX_YAW)
            );
            double y = -Math.max(0.05, entity.getHeight()) * 0.5;
            client.getEntityRenderDispatcher().render(
                    entity,
                    0.0,
                    y,
                    0.0,
                    DIRECT_ENTITY_DISPATCHER_YAW,
                    0.0f,
                    matrices,
                    consumers,
                    LightmapTextureManager.MAX_LIGHT_COORDINATE
            );
            consumers.draw();
            Identifier entityId = Registries.ENTITY_TYPE.getId(entity.getType());
            return new FrameResult(readFrame(context.framebuffer()), entityId);
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
        return new FrameContext(
                framebuffer,
                previousProjection,
                previousVertexSorting,
                modelView,
                previousWidth,
                previousHeight
        );
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

    private JsonObject baseRow(Job job) {
        JsonObject row = new JsonObject();
        row.addProperty("fish_id", job.entry().fishId());
        row.addProperty("source_mod", job.entry().sourceMod());
        row.addProperty("entity_id", job.entry().entityId());
        row.addProperty("variant", job.variant());
        return row;
    }

    private static String classify(Exception exception) {
        if (exception instanceof RenderFailureException failure) {
            return failure.code().wireName();
        }
        return RenderFailureCode.UNEXPECTED_EXCEPTION.wireName();
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

    private static String namespace(String id) {
        int i = id.indexOf(':');
        return i < 0 ? "minecraft" : id.substring(0, i);
    }

    private record Job(RegistryLoader.Entry entry, String variant) {}

    private record RenderResult(
            Path png,
            ImageOps.Bounds bounds,
            double lengthCm,
            Identifier entityId,
            String renderMode
    ) {}

    private record FrameResult(NativeImage image, Identifier entityId) {}

    private record FrameContext(
            SimpleFramebuffer framebuffer,
            Matrix4f previousProjection,
            VertexSorter previousVertexSorting,
            Matrix4fStack modelView,
            int previousWidth,
            int previousHeight
    ) {}
}
