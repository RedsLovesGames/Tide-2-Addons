package com.redslovesgames.tidefishrender.mixin;

import com.llamalad7.mixinextras.injector.ModifyExpressionValue;
import com.redslovesgames.tidefishrender.RenderTargetOverride;
import net.minecraft.client.gl.Framebuffer;
import net.minecraft.client.render.RenderPhase;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;

@Mixin(RenderPhase.class)
public abstract class RenderPhaseMixin {
    @ModifyExpressionValue(
            method = {"method_62272", "method_34555", "method_29377"},
            at = @At(value = "INVOKE", target = "Lnet/minecraft/client/MinecraftClient;getFramebuffer()Lnet/minecraft/client/gl/Framebuffer;")
    )
    private static Framebuffer tideFishRender$overrideMainTarget(Framebuffer original) {
        Framebuffer override = RenderTargetOverride.get();
        return override == null ? original : override;
    }
}
