package com.redslovesgames.tidefishrender;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.rendering.v1.WorldRenderEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.text.Text;

import static net.fabricmc.fabric.api.client.command.v2.ClientCommandManager.literal;

public final class RuntimeBundleAutoInitializer implements ClientModInitializer {
    private static final String LEGACY_AUTO_MODE = System.getenv("TIDE_FISH_RENDER_AUTO");
    private static final boolean AUTO_ENABLED = !"false".equalsIgnoreCase(System.getenv("TIDE_FISH_RUNTIME_AUTO"));
    private static final boolean EXIT_AFTER_EXPORT = "true".equalsIgnoreCase(System.getenv("TIDE_FISH_RUNTIME_EXIT_AFTER_EXPORT"));

    private static int readyTicks;
    private static boolean frameReady;
    private static boolean running;
    private static boolean automaticCompleted;
    private static boolean manualRequested;

    @Override
    public void onInitializeClient() {
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> dispatcher.register(
                literal("fishexport")
                        .executes(ctx -> requestManual(ctx.getSource().getClient()))
                        .then(literal("bundle").executes(ctx -> requestManual(ctx.getSource().getClient())))
        ));

        ClientTickEvents.END_CLIENT_TICK.register(RuntimeBundleAutoInitializer::tick);
        WorldRenderEvents.LAST.register(context -> runWhenFrameReady(MinecraftClient.getInstance()));

        if (legacyAutomationActive()) {
            System.out.println("FISHBUNDLE_AUTO_DISABLED reason=legacy_renderer_automation mode=" + LEGACY_AUTO_MODE);
        } else if (AUTO_ENABLED) {
            System.out.println("FISHBUNDLE_AUTO_ARMED trigger=first_world_join exit_after_export=" + EXIT_AFTER_EXPORT);
        } else {
            System.out.println("FISHBUNDLE_AUTO_DISABLED reason=TIDE_FISH_RUNTIME_AUTO=false manual_command=/fishexport");
        }
    }

    private static int requestManual(MinecraftClient client) {
        if (running) {
            message(client, "Fish export is already running.");
            return 0;
        }
        if (client.world == null || client.player == null) {
            message(client, "Join a world first, then run /fishexport again.");
            return 0;
        }
        manualRequested = true;
        frameReady = true;
        message(client, "Fish runtime export queued. Rendering will begin on the next frame.");
        return 1;
    }

    private static void tick(MinecraftClient client) {
        if (running) return;
        if (client.world == null || client.player == null) {
            readyTicks = 0;
            return;
        }
        if (manualRequested) {
            frameReady = true;
            return;
        }
        if (automaticCompleted || !AUTO_ENABLED || legacyAutomationActive()) return;
        readyTicks++;
        if (readyTicks >= 100) frameReady = true;
    }

    private static void runWhenFrameReady(MinecraftClient client) {
        if (!frameReady || running || client.world == null || client.player == null) return;
        if (!manualRequested && (automaticCompleted || !AUTO_ENABLED || legacyAutomationActive())) return;

        frameReady = false;
        manualRequested = false;
        running = true;
        automaticCompleted = true;
        System.out.println("FISHBUNDLE_EXPORT_START world=" + client.world.getRegistryKey().getValue());
        message(client, "Tide fish export started. Minecraft may pause while source-authentic renders are captured.");

        try {
            RuntimeBundleExporter.Bundle bundle = RuntimeBundleExporter.export(client);
            System.out.println(
                    "FISHBUNDLE_EXPORT_DONE zip=" + bundle.zipPath()
                            + " fish=" + bundle.fishCount()
                            + " jobs=" + bundle.jobs()
                            + " successful=" + bundle.successful()
                            + " failed=" + bundle.failed()
                            + " cache_hits=" + bundle.cacheHits()
            );
            message(
                    client,
                    "Fish export complete: " + bundle.zipPath().toAbsolutePath()
                            + " | fish=" + bundle.fishCount()
                            + " renders=" + bundle.successful()
                            + " failed=" + bundle.failed()
            );
        } catch (Throwable failure) {
            System.err.println(
                    "FISHBUNDLE_EXPORT_FAILED type=" + failure.getClass().getName()
                            + " message=" + String.valueOf(failure.getMessage())
            );
            failure.printStackTrace();
            message(client, "Fish export failed: " + failure.getClass().getSimpleName() + ": " + String.valueOf(failure.getMessage()));
        } finally {
            running = false;
            if (EXIT_AFTER_EXPORT) {
                System.out.println("FISHBUNDLE_EXIT_REQUESTED");
                client.scheduleStop();
            }
        }
    }

    private static boolean legacyAutomationActive() {
        return LEGACY_AUTO_MODE != null && !LEGACY_AUTO_MODE.isBlank();
    }

    private static void message(MinecraftClient client, String text) {
        if (client.player != null) client.player.sendMessage(Text.literal(text), false);
    }
}
