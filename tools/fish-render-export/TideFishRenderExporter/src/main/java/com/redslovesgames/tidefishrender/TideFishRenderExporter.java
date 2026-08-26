package com.redslovesgames.tidefishrender;

import com.mojang.brigadier.arguments.StringArgumentType;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;

import static net.fabricmc.fabric.api.client.command.v2.ClientCommandManager.argument;
import static net.fabricmc.fabric.api.client.command.v2.ClientCommandManager.literal;

public final class TideFishRenderExporter implements ClientModInitializer {
    public static final String MOD_ID = "tide_fish_render_exporter";

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
    }
}
