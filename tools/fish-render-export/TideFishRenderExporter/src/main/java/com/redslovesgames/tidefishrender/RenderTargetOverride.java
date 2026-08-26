package com.redslovesgames.tidefishrender;

import net.minecraft.client.gl.Framebuffer;

public final class RenderTargetOverride {
    private static Framebuffer active;

    private RenderTargetOverride() {}

    public static Framebuffer get() {
        return active;
    }

    public static void set(Framebuffer framebuffer) {
        active = framebuffer;
    }

    public static void clear() {
        active = null;
    }
}
