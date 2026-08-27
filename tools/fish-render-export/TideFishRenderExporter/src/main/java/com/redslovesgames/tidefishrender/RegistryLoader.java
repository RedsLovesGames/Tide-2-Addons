package com.redslovesgames.tidefishrender;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.minecraft.client.MinecraftClient;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class RegistryLoader {
    record Entry(String fishId, String itemId, String entityId, String sourceMod, String group,
                 double typicalLowCm, double typicalHighCm, double recordHighCm, JsonObject raw) {
        double representativeLengthCm() {
            if (typicalLowCm > 0 && typicalHighCm > 0) return (typicalLowCm + typicalHighCm) * 0.5;
            if (typicalHighCm > 0) return typicalHighCm;
            if (recordHighCm > 0) return recordHighCm * 0.65;
            return 1.0;
        }
    }

    private RegistryLoader() {}

    static List<Entry> load() throws IOException {
        MinecraftClient client = MinecraftClient.getInstance();
        List<Path> candidates = List.of(
                client.runDirectory.toPath().resolve("fish_render_sources/registry/fish-render-registry.json"),
                client.runDirectory.toPath().resolve("config/tide-fish-render-exporter/fish-render-registry.json"),
                client.runDirectory.toPath().resolve("config/tide-fish-render-exporter/supported-fish-registry.json")
        );
        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate)) {
                try (Reader reader = Files.newBufferedReader(candidate, StandardCharsets.UTF_8)) {
                    return parse(reader, candidate.toString());
                }
            }
        }
        var resource = RegistryLoader.class.getResourceAsStream("/fishrender/fish-render-registry.json");
        if (resource != null) {
            try (Reader reader = new InputStreamReader(resource, StandardCharsets.UTF_8)) {
                return parse(reader, "bundled:/fishrender/fish-render-registry.json");
            }
        }
        throw new IOException("Fish render registry not found. Put fish-render-registry.json in config/tide-fish-render-exporter/ or build the exporter from the Tide-2-Addons repository so the validated registry is bundled.");
    }

    static List<Entry> loadModpackScope() throws IOException {
        Map<String, Entry> known = new LinkedHashMap<>();
        for (Entry entry : load()) known.put(entry.fishId(), entry);
        JsonObject scope = readBundledObject("/fishrender/modpack-scope.json");
        JsonArray modIds = scope.getAsJsonArray("mod_ids");
        if (modIds == null) throw new IOException("Bundled modpack scope has no mod_ids[]");
        Set<String> allowedNamespaces = new HashSet<>();
        for (JsonElement element : modIds) if (element.isJsonPrimitive()) allowedNamespaces.add(element.getAsString());

        JsonArray catalog = readBundledArray("/fishrender/fish-search-index.json");
        Map<String, Entry> scoped = new LinkedHashMap<>();
        for (JsonElement element : catalog) {
            if (!element.isJsonObject()) continue;
            JsonObject item = element.getAsJsonObject();
            String fishId = str(item, "id", null);
            if (fishId == null || !allowedNamespaces.contains(namespace(fishId))) continue;
            Entry entry = known.get(fishId);
            if (entry == null) {
                String group = str(item, "group", "misc");
                String runtimeEntityId = runtimeEntityId(fishId);
                JsonObject synthesized = item.deepCopy();
                synthesized.addProperty("fish_id", fishId);
                synthesized.addProperty("entity_id", runtimeEntityId);
                synthesized.addProperty("source_mod", str(item, "mod", namespace(fishId)));
                entry = new Entry(fishId, fishId, runtimeEntityId, namespace(fishId), group,
                        20.0, 40.0, 60.0, synthesized);
            }
            scoped.putIfAbsent(fishId, entry);
        }
        if (scoped.isEmpty()) throw new IOException("Modpack scope produced no fish render targets");
        return scoped.values().stream().sorted(Comparator.comparing(Entry::fishId)).toList();
    }

    static boolean isScopedNamespace(String namespace) throws IOException {
        JsonArray modIds = readBundledObject("/fishrender/modpack-scope.json").getAsJsonArray("mod_ids");
        if (modIds == null) return false;
        for (JsonElement element : modIds) {
            if (element.isJsonPrimitive() && namespace.equals(element.getAsString())) return true;
        }
        return false;
    }

    private static List<Entry> parse(Reader reader, String source) throws IOException {
        JsonObject root = JsonParser.parseReader(reader).getAsJsonObject();
        JsonArray fish = root.getAsJsonArray("fish");
        if (fish == null) throw new IOException("Registry has no fish[] array: " + source);
        List<Entry> out = new ArrayList<>(fish.size());
        Set<String> ids = new HashSet<>();
        for (JsonElement element : fish) {
            if (!element.isJsonObject()) continue;
            JsonObject o = element.getAsJsonObject();
            String fishId = str(o, "fish_id", str(o, "key", null));
            if (fishId == null || fishId.isBlank() || !ids.add(fishId)) continue;
            JsonObject journal = object(o, "journal_profile");
            JsonObject size = object(o, "size");
            String entityId = str(o, "entity_id", str(object(o, "display_data"), "entity", null));
            String sourceMod = str(o, "source_mod", str(o, "entity_namespace", namespace(entityId != null ? entityId : fishId)));
            String group = str(o, "group", str(journal, "group", "misc"));
            out.add(new Entry(fishId, str(o, "item_id", fishId), entityId, sourceMod, group,
                    number(size, "typical_low_cm"), number(size, "typical_high_cm"), number(size, "record_high_cm"), o));
        }
        if (out.isEmpty()) throw new IOException("Registry contained no usable fish entries: " + source);
        return List.copyOf(out);
    }

    private static String runtimeEntityId(String fishId) {
        // The wiki/Tide compatibility data uses the canonical underscore namespace.
        // Hybrid Aquatic 1.5.5 itself registers the runtime mod and entity namespace
        // with a hyphen. Keep fishId stable and translate only the entity lookup ID.
        if (fishId != null && fishId.startsWith("hybrid_aquatic:")) {
            return "hybrid-aquatic:" + fishId.substring("hybrid_aquatic:".length());
        }
        return fishId;
    }

    private static JsonObject readBundledObject(String resourcePath) throws IOException {
        var resource = RegistryLoader.class.getResourceAsStream(resourcePath);
        if (resource == null) throw new IOException("Missing bundled resource: " + resourcePath);
        try (Reader reader = new InputStreamReader(resource, StandardCharsets.UTF_8)) {
            return JsonParser.parseReader(reader).getAsJsonObject();
        }
    }

    private static JsonArray readBundledArray(String resourcePath) throws IOException {
        var resource = RegistryLoader.class.getResourceAsStream(resourcePath);
        if (resource == null) throw new IOException("Missing bundled resource: " + resourcePath);
        try (Reader reader = new InputStreamReader(resource, StandardCharsets.UTF_8)) {
            return JsonParser.parseReader(reader).getAsJsonArray();
        }
    }

    private static JsonObject object(JsonObject o, String key) {
        JsonElement e = o.get(key);
        return e != null && e.isJsonObject() ? e.getAsJsonObject() : new JsonObject();
    }

    private static String str(JsonObject o, String key, String fallback) {
        JsonElement e = o.get(key);
        return e != null && !e.isJsonNull() && e.isJsonPrimitive() ? e.getAsString() : fallback;
    }

    private static double number(JsonObject o, String key) {
        JsonElement e = o.get(key);
        try { return e != null && !e.isJsonNull() ? e.getAsDouble() : 0.0; }
        catch (RuntimeException ignored) { return 0.0; }
    }

    private static String namespace(String id) {
        if (id == null) return "minecraft";
        int i = id.indexOf(':');
        return i < 0 ? "minecraft" : id.substring(0, i);
    }
}
