package com.redslovesgames.tidefishrender;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import net.fabricmc.loader.api.FabricLoader;
import net.fabricmc.loader.api.ModContainer;
import net.fabricmc.loader.api.metadata.ModOrigin;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;

final class RuntimeEnvironment {
    record Snapshot(JsonObject json, String fingerprint) {}

    private RuntimeEnvironment() {}

    static Snapshot capture() throws IOException {
        List<ModContainer> mods = new ArrayList<>(FabricLoader.getInstance().getAllMods());
        mods.sort(Comparator.comparing(mod -> mod.getMetadata().getId()));

        JsonArray rows = new JsonArray();
        StringBuilder fingerprintMaterial = new StringBuilder();
        for (ModContainer mod : mods) {
            JsonObject row = new JsonObject();
            String id = mod.getMetadata().getId();
            String version = mod.getMetadata().getVersion().getFriendlyString();
            row.addProperty("id", id);
            row.addProperty("name", mod.getMetadata().getName());
            row.addProperty("version", version);

            JsonArray origins = new JsonArray();
            List<String> originFingerprints = new ArrayList<>();
            ModOrigin modOrigin = mod.getOrigin();
            switch (modOrigin.getKind()) {
                case PATH -> addPathOrigins(modOrigin, origins, originFingerprints);
                case NESTED -> addNestedOrigin(modOrigin, origins, originFingerprints);
                default -> {
                    JsonObject origin = new JsonObject();
                    origin.addProperty("kind", "unknown");
                    origins.add(origin);
                    originFingerprints.add("unknown");
                }
            }
            row.add("origins", origins);
            rows.add(row);

            fingerprintMaterial.append(id).append('\u0000').append(version).append('\u0000');
            originFingerprints.forEach(value -> fingerprintMaterial.append(value).append('\u0000'));
        }

        String fingerprint = sha256(fingerprintMaterial.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
        JsonObject root = new JsonObject();
        root.addProperty("schema_version", 1);
        root.addProperty("generated_at", Instant.now().toString());
        root.addProperty("fingerprint", fingerprint);
        root.addProperty("minecraft_version", FabricLoader.getInstance()
                .getModContainer("minecraft")
                .map(mod -> mod.getMetadata().getVersion().getFriendlyString())
                .orElse("unknown"));
        root.add("mods", rows);
        return new Snapshot(root, fingerprint);
    }

    private static void addPathOrigins(ModOrigin modOrigin, JsonArray origins, List<String> fingerprints) throws IOException {
        List<Path> paths = new ArrayList<>(modOrigin.getPaths());
        paths.sort(Comparator.comparing(Path::toString));
        for (Path path : paths) {
            JsonObject origin = new JsonObject();
            Path fileName = path.getFileName();
            origin.addProperty("file", fileName == null ? path.toString() : fileName.toString());
            origin.addProperty("kind", Files.isDirectory(path) ? "directory" : "file");
            if (Files.isRegularFile(path)) {
                String hash = sha256(path);
                origin.addProperty("sha256", hash);
                fingerprints.add("path:" + hash);
            } else {
                fingerprints.add("path:" + path.toAbsolutePath().normalize());
            }
            origins.add(origin);
        }
    }

    private static void addNestedOrigin(ModOrigin modOrigin, JsonArray origins, List<String> fingerprints) {
        String parentModId = modOrigin.getParentModId();
        String subLocation = modOrigin.getParentSubLocation();
        JsonObject origin = new JsonObject();
        origin.addProperty("kind", "nested");
        origin.addProperty("parent_mod_id", parentModId);
        origin.addProperty("parent_sub_location", subLocation);
        origins.add(origin);
        fingerprints.add("nested:" + parentModId + ":" + subLocation);
    }

    static String sha256(Path path) throws IOException {
        try (InputStream in = Files.newInputStream(path)) {
            MessageDigest digest = digest();
            byte[] buffer = new byte[1024 * 1024];
            for (int read; (read = in.read(buffer)) >= 0; ) {
                if (read > 0) digest.update(buffer, 0, read);
            }
            return HexFormat.of().formatHex(digest.digest());
        }
    }

    static String sha256(byte[] bytes) {
        MessageDigest digest = digest();
        digest.update(bytes);
        return HexFormat.of().formatHex(digest.digest());
    }

    private static MessageDigest digest() {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("JVM has no SHA-256 provider", e);
        }
    }
}
