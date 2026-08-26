package com.redslovesgames.tidefishrender;

import com.mojang.brigadier.arguments.StringArgumentType;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.MinecraftClient;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static net.fabricmc.fabric.api.client.command.v2.ClientCommandManager.argument;
import static net.fabricmc.fabric.api.client.command.v2.ClientCommandManager.literal;

public final class TideFishRenderExporter implements ClientModInitializer {
    public static final String MOD_ID = "tide_fish_render_exporter";
    private static final String AUTO_EXPORT = System.getenv("TIDE_FISH_RENDER_AUTO");
    private static int readyTicks;
    private static boolean autoStarted;

    @Override
    public void onInitializeClient() {
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> dispatcher.register(
                literal("fishrender")
                        .then(literal("verify").executes(ctx -> RenderCommands.verify(ctx.getSource())))
                        .then(literal("export")
                                .then(literal("all").executes(ctx -> RenderCommands.exportAll(ctx.getSource(), "default"))
                                        .then(argument("variant", StringArgumentType.word()).executes(ctx -> RenderCommands.exportAll(ctx.getSource(), StringArgumentType.getString(ctx, "variant")))))
                                .then(literal("tide").executes(ctx -> RenderCommands.exportNamespace(ctx.getSource(), "tide", "default"))
                                        .then(argument("variant", StringArgumentType.word()).executes(ctx -> RenderCommands.exportNamespace(ctx.getSource(), "tide", StringArgumentType.getString(ctx, "variant")))))
                                .then(literal("namespace").then(argument("namespace", StringArgumentType.word())
                                        .executes(ctx -> RenderCommands.exportNamespace(ctx.getSource(), StringArgumentType.getString(ctx, "namespace"), "default"))
                                        .then(argument("variant", StringArgumentType.word()).executes(ctx -> RenderCommands.exportNamespace(ctx.getSource(), StringArgumentType.getString(ctx, "namespace"), StringArgumentType.getString(ctx, "variant"))))))
                                .then(argument("fish", StringArgumentType.word())
                                        .executes(ctx -> RenderCommands.exportFish(ctx.getSource(), StringArgumentType.getString(ctx, "fish"), "default"))
                                        .then(argument("variant", StringArgumentType.word()).executes(ctx -> RenderCommands.exportFish(ctx.getSource(), StringArgumentType.getString(ctx, "fish"), StringArgumentType.getString(ctx, "variant"))))))
        ));

        if (AUTO_EXPORT != null && !AUTO_EXPORT.isBlank()) {
            ClientTickEvents.END_CLIENT_TICK.register(TideFishRenderExporter::tickAutoExport);
        }
    }

    private static void tickAutoExport(MinecraftClient client) {
        if (autoStarted || client.world == null || client.player == null) return;
        if (++readyTicks < 100) return;
        autoStarted = true;
        try {
            RenderService service = RenderService.create();
            RenderReport report = switch (AUTO_EXPORT.toLowerCase()) {
                case "verify" -> service.verifyAll();
                case "all" -> service.exportAll("default");
                case "tide" -> service.exportNamespace("tide", "default");
                default -> AUTO_EXPORT.startsWith("namespace:")
                        ? service.exportNamespace(AUTO_EXPORT.substring("namespace:".length()), "default")
                        : service.exportFish(AUTO_EXPORT, "default");
            };
            writeAutoStatus(client, "success", report.reportPath().toString(), report.totalFish(), report.successful(), report.failed(), null);
        } catch (Throwable t) {
            t.printStackTrace();
            try {
                writeAutoStatus(client, "exception", null, 0, 0, 1, t.getClass().getName() + ": " + String.valueOf(t.getMessage()));
            } catch (Exception ignored) {
            }
        } finally {
            client.scheduleStop();
        }
    }

    private static void writeAutoStatus(MinecraftClient client, String status, String reportPath,
                                        int totalFish, int successful, int failed, String error) throws Exception {
        Path generated = client.runDirectory.toPath().resolve("fishrender-output/generated");
        Files.createDirectories(generated);
        String json = "{\n"
                + "  \"status\": \"" + escape(status) + "\",\n"
                + "  \"mode\": \"" + escape(AUTO_EXPORT) + "\",\n"
                + "  \"total_fish\": " + totalFish + ",\n"
                + "  \"successful\": " + successful + ",\n"
                + "  \"failed\": " + failed + ",\n"
                + "  \"report\": " + (reportPath == null ? "null" : "\"" + escape(reportPath) + "\"") + ",\n"
                + "  \"error\": " + (error == null ? "null" : "\"" + escape(error) + "\"") + "\n"
                + "}\n";
        Files.writeString(generated.resolve("auto-export-status.json"), json, StandardCharsets.UTF_8);
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
