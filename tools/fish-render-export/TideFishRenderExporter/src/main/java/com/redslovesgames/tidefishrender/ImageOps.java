package com.redslovesgames.tidefishrender;

import net.minecraft.client.texture.NativeImage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

final class ImageOps {
    private ImageOps() {}

    record Bounds(int minX, int minY, int maxX, int maxY) {
        int width() { return maxX - minX + 1; }
        int height() { return maxY - minY + 1; }
        boolean touches(int w, int h, int margin) { return minX <= margin || minY <= margin || maxX >= w - 1 - margin || maxY >= h - 1 - margin; }
        double occupancy(int w, int h) { return Math.max(width() / (double) w, height() / (double) h); }
    }

    static Bounds alphaBounds(NativeImage image) {
        int minX = image.getWidth(), minY = image.getHeight(), maxX = -1, maxY = -1;
        for (int y = 0; y < image.getHeight(); y++) for (int x = 0; x < image.getWidth(); x++) {
            int abgr = image.getColor(x, y);
            if (((abgr >>> 24) & 255) == 0) continue;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
        return maxX < 0 ? null : new Bounds(minX, minY, maxX, maxY);
    }

    static NativeImage cropWithPadding(NativeImage source, Bounds bounds, int padding) {
        NativeImage out = new NativeImage(NativeImage.Format.RGBA, bounds.width() + padding * 2, bounds.height() + padding * 2, true);
        for (int y = 0; y < bounds.height(); y++) for (int x = 0; x < bounds.width(); x++)
            out.setColor(x + padding, y + padding, source.getColor(bounds.minX() + x, bounds.minY() + y));
        return out;
    }

    static void write(NativeImage image, Path file) throws IOException {
        Files.createDirectories(file.getParent());
        image.writeTo(file);
    }
}
