package com.redslovesgames.tidefishrender;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.minecraft.client.MinecraftClient;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

final class RuntimeBundleExporter {
    record Bundle(Path zipPath, String cacheKey, int fishCount, int jobs, int successful, int failed, int cacheHits) {}

    private static final DateTimeFormatter FILE_TIME = DateTimeFormatter
            .ofPattern("yyyyMMdd-HHmmss")
            .withZone(ZoneOffset.UTC);

    private RuntimeBundleExporter() {}

    static Bundle export(MinecraftClient client) throws Exception {
        if (client.world == null || client.player == null) {
            throw new IOException("Join a world before exporting. Tide Fish Display rendering needs a live ClientWorld.");
        }

        RuntimeEnvironment.Snapshot environment = RuntimeEnvironment.capture();
        List<RuntimeFishCatalog.Entry> fish = RuntimeFishCatalog.discover();
        String catalogFingerprint = RuntimeFishCatalog.fingerprint(fish);
        String cacheKey = RuntimeEnvironment.sha256(
                (environment.fingerprint() + "\n" + catalogFingerprint)
                        .getBytes(StandardCharsets.UTF_8)
        );

        Path run = client.runDirectory.toPath();
        Path cacheRoot = run.resolve("tide-fish-export-cache").resolve(cacheKey);
        Files.createDirectories(cacheRoot.resolve("generated"));
        Files.createDirectories(cacheRoot.resolve("renders"));

        JsonObject environmentJson = environment.json().deepCopy();
        environmentJson.addProperty("catalog_fingerprint", catalogFingerprint);
        environmentJson.addProperty("cache_key", cacheKey);
        writeJson(cacheRoot.resolve("generated/environment.json"), environmentJson);
        writeJson(cacheRoot.resolve("generated/fish-catalog.json"), RuntimeFishCatalog.toJson(fish));

        RuntimeFishDisplayExport.Result render = new RuntimeFishDisplayExport(client, cacheRoot).exportAll(fish);

        JsonObject manifest = new JsonObject();
        manifest.addProperty("schema_version", 1);
        manifest.addProperty("generated_at", Instant.now().toString());
        manifest.addProperty("bundle_type", "tide_fish_runtime_export");
        manifest.addProperty("source_of_truth", "running Minecraft client + TideData.FISH + Tide FishDisplayRenderer");
        manifest.addProperty("environment_fingerprint", environment.fingerprint());
        manifest.addProperty("catalog_fingerprint", catalogFingerprint);
        manifest.addProperty("cache_key", cacheKey);
        manifest.addProperty("fish_count", render.fishCount());
        manifest.addProperty("jobs", render.jobs());
        manifest.addProperty("successful", render.successful());
        manifest.addProperty("failed", render.failed());
        manifest.addProperty("cache_hits", render.cacheHits());
        manifest.addProperty("renders_directory", "renders/");
        manifest.addProperty("render_report", "render-report.json");
        manifest.addProperty("failures_report", "failures.json");
        manifest.addProperty("environment", "environment.json");
        manifest.addProperty("fish_catalog", "fish-catalog.json");
        writeJson(cacheRoot.resolve("generated/manifest.json"), manifest);

        Path exports = run.resolve("tide-fish-exports");
        Files.createDirectories(exports);
        String filename = "tide-fish-runtime-export-"
                + cacheKey.substring(0, 12)
                + "-" + FILE_TIME.format(Instant.now())
                + ".zip";
        Path finalZip = exports.resolve(filename);
        Path partialZip = exports.resolve(filename + ".part");
        Files.deleteIfExists(partialZip);
        writeZip(cacheRoot, partialZip);
        Files.move(partialZip, finalZip, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);

        return new Bundle(finalZip, cacheKey, render.fishCount(), render.jobs(), render.successful(), render.failed(), render.cacheHits());
    }

    private static void writeZip(Path cacheRoot, Path zipPath) throws IOException {
        Path generated = cacheRoot.resolve("generated");
        try (OutputStream raw = Files.newOutputStream(zipPath);
             ZipOutputStream zip = new ZipOutputStream(raw, StandardCharsets.UTF_8)) {
            addFile(zip, generated.resolve("manifest.json"), "manifest.json");
            addFile(zip, generated.resolve("environment.json"), "environment.json");
            addFile(zip, generated.resolve("fish-catalog.json"), "fish-catalog.json");
            addFile(zip, generated.resolve("render-report.json"), "render-report.json");
            addFile(zip, generated.resolve("failures.json"), "failures.json");

            Path renders = cacheRoot.resolve("renders");
            if (Files.isDirectory(renders)) {
                try (var files = Files.list(renders)) {
                    for (Path file : files.filter(Files::isRegularFile)
                            .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                            .toList()) {
                        addFile(zip, file, "renders/" + file.getFileName());
                    }
                }
            }

            String readme = "Tide Fish Runtime Export\n"
                    + "========================\n\n"
                    + "This bundle was generated inside the running Minecraft client.\n"
                    + "Fish discovery comes from TideData.FISH. Images are rendered through Tide's actual FishDisplayBlockEntity and FishDisplayRenderer into a transparent framebuffer.\n"
                    + "No item-sprite, AI-art, or reconstructed-model fallback is used. Failed renders remain listed in failures.json.\n"
                    + "Give this ZIP directly to the Tideborne Fish Wiki importer.\n";
            ZipEntry entry = new ZipEntry("README.txt");
            zip.putNextEntry(entry);
            zip.write(readme.getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();
        }
    }

    private static void addFile(ZipOutputStream zip, Path source, String name) throws IOException {
        if (!Files.isRegularFile(source)) return;
        ZipEntry entry = new ZipEntry(name.replace('\\', '/'));
        zip.putNextEntry(entry);
        try (InputStream in = Files.newInputStream(source)) {
            in.transferTo(zip);
        }
        zip.closeEntry();
    }

    private static void writeJson(Path path, JsonObject value) throws IOException {
        Files.createDirectories(path.getParent());
        Files.writeString(
                path,
                new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(value),
                StandardCharsets.UTF_8
        );
    }
}
