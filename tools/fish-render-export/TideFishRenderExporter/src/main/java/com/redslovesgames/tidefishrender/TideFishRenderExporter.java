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
    private static final String AUTO_WORLD = "RenderWorld";
    private static int clientTicks;
    private static int readyTicks;
    private static boolean autoStarted;
    private static boolean worldOpenRequested;

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
            System.out.println("FISHRENDER_AUTO_ARMED mode=" + AUTO_EXPORT);
            ClientTickEvents.END_CLIENT_TICK.register(TideFishRenderExporter::tickAutoExport);
        }
    }

    private static void tickAutoExport(MinecraftClient client) {
        if (autoStarted) return;
        clientTicks++;
        if (clientTicks == 1 || clientTicks == 20 || clientTicks % 200 == 0) logClientState(client);

        if (client.world == null || client.player == null) {
            readyTicks = 0;
            if (!worldOpenRequested && clientTicks >= 200 && client.getServer() == null) openRenderWorld(client);
            return;
        }
        if (++readyTicks < 100) return;
        autoStarted = true;
        System.out.println("FISHRENDER_AUTO_START mode=" + AUTO_EXPORT + " world=" + client.world.getRegistryKey().getValue());
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
            System.out.println("FISHRENDER_AUTO_DONE mode=" + AUTO_EXPORT + " total=" + report.totalFish()
                    + " successful=" + report.successful() + " failed=" + report.failed()
                    + " report=" + report.reportPath());
            writeAutoStatus(client, "success", report.reportPath().toString(), report.totalFish(), report.successful(), report.failed(), null);
        } catch (Throwable t) {
            System.err.println("FISHRENDER_AUTO_EXCEPTION mode=" + AUTO_EXPORT + " type=" + t.getClass().getName()
                    + " message=" + String.valueOf(t.getMessage()));
            t.printStackTrace();
            try {
                writeAutoStatus(client, "exception", null, 0, 0, 1, t.getClass().getName() + ": " + String.valueOf(t.getMessage()));
            } catch (Exception ignored) {
            }
        } finally {
            System.out.println("FISHRENDER_AUTO_STOP_REQUESTED mode=" + AUTO_EXPORT);
            client.scheduleStop();
        }
    }

    private static void openRenderWorld(MinecraftClient client) {
        worldOpenRequested = true;
        Path levelDat = client.runDirectory.toPath().resolve("saves").resolve(AUTO_WORLD).resolve("level.dat");
        System.out.println("FISHRENDER_AUTO_WORLD_OPEN_REQUEST world=" + AUTO_WORLD + " level_dat=" + levelDat
                + " exists=" + Files.isRegularFile(levelDat));
        if (!Files.isRegularFile(levelDat)) {
            failWorldOpen(client, "missing world save: " + levelDat);
            return;
        }
        try {
            client.createIntegratedServerLoader().start(AUTO_WORLD, () -> failWorldOpen(client, "world load cancelled"));
        } catch (Throwable t) {
            failWorldOpen(client, t.getClass().getName() + ": " + String.valueOf(t.getMessage()));
        }
    }

    private static void failWorldOpen(MinecraftClient client, String error) {
        autoStarted = true;
        System.err.println("FISHRENDER_AUTO_WORLD_OPEN_FAILED world=" + AUTO_WORLD + " error=" + error);
        try {
            writeAutoStatus(client, "world_open_failed", null, 0, 0, 1, error);
        } catch (Exception writeError) {
            writeError.printStackTrace();
        }
        client.scheduleStop();
    }

    private static void logClientState(MinecraftClient client) {
        String screen = client.currentScreen == null ? "none" : client.currentScreen.getClass().getName();
        String server = client.getServer() == null ? "none"
                : client.getServer().getClass().getName() + ":running=" + client.getServer().isRunning()
                + ":loading=" + client.getServer().isLoading();
        Path levelDat = client.runDirectory.toPath().resolve("saves").resolve(AUTO_WORLD).resolve("level.dat");
        System.out.println("FISHRENDER_AUTO_STATE ticks=" + clientTicks + " screen=" + screen
                + " world=" + (client.world == null ? "none" : client.world.getRegistryKey().getValue())
                + " player=" + (client.player == null ? "none" : client.player.getUuidAsString())
                + " integrated_server=" + server + " save_available=" + Files.isRegularFile(levelDat));
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

