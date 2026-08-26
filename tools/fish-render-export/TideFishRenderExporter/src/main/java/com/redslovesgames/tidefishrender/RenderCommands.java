package com.redslovesgames.tidefishrender;

import net.fabricmc.fabric.api.client.command.v2.FabricClientCommandSource;
import net.minecraft.text.Text;

final class RenderCommands {
    private RenderCommands() {}
    static int verify(FabricClientCommandSource source) { return run(source, "verification", () -> RenderService.create().verifyAll()); }
    static int exportAll(FabricClientCommandSource source, String variant) { return run(source, "export", () -> RenderService.create().exportAll(variant)); }
    static int exportNamespace(FabricClientCommandSource source, String namespace, String variant) { return run(source, "export", () -> RenderService.create().exportNamespace(namespace, variant)); }
    static int exportFish(FabricClientCommandSource source, String fishId, String variant) { return run(source, "export", () -> RenderService.create().exportFish(fishId, variant)); }

    private static int run(FabricClientCommandSource source, String action, ThrowingSupplier<RenderReport> operation) {
        try {
            RenderReport report = operation.get();
            source.sendFeedback(Text.literal("Fish render " + action + ": " + report.successful() + " successful, " + report.failed() + " failed. Report: " + report.reportPath()));
            return report.failed() == 0 ? 1 : 0;
        } catch (Exception e) {
            source.sendError(Text.literal("fishrender failed: " + e.getClass().getSimpleName() + ": " + e.getMessage()));
            return 0;
        }
    }

    @FunctionalInterface private interface ThrowingSupplier<T> { T get() throws Exception; }
}
