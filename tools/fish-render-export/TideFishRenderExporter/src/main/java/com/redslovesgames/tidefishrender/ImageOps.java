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
        int rgbMinX = image.getWidth(), rgbMinY = image.getHeight(), rgbMaxX = -1, rgbMaxY = -1;
        long alphaPixels = 0, rgbPixels = 0;
        for (int y = 0; y < image.getHeight(); y++) for (int x = 0; x < image.getWidth(); x++) {
            int abgr = image.getColor(x, y);
            if ((abgr & 0x00FFFFFF) != 0) {
                rgbPixels++;
                if (x < rgbMinX) rgbMinX = x;
                if (y < rgbMinY) rgbMinY = y;
                if (x > rgbMaxX) rgbMaxX = x;
                if (y > rgbMaxY) rgbMaxY = y;
            }
            if (((abgr >>> 24) & 255) == 0) continue;
            alphaPixels++;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
        if (maxX < 0) {
            String rgbBounds = rgbMaxX < 0 ? "none" : rgbMinX + "," + rgbMinY + "-" + rgbMaxX + "," + rgbMaxY;
            System.out.println("FISHRENDER_FRAME_STATS width=" + image.getWidth() + " height=" + image.getHeight()
                    + " alpha_pixels=" + alphaPixels + " rgb_pixels=" + rgbPixels + " rgb_bounds=" + rgbBounds);
            return null;
        }
        return new Bounds(minX, minY, maxX, maxY);
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
