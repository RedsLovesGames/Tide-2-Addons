package com.redslovesgames.tidefishrender;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.li64.tide.data.TideData;
import com.li64.tide.data.fishing.DisplayData;
import com.li64.tide.data.fishing.FishData;
import net.minecraft.registry.Registries;
import net.minecraft.util.Identifier;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class RuntimeFishCatalog {
    record Entry(
            String dataKey,
            String fishId,
            String itemId,
            String entityId,
            String sourceMod,
            List<String> associatedMods,
            double typicalLowCm,
            double typicalHighCm,
            double recordHighCm,
            boolean showInJournal,
            boolean original,
            JsonObject raw
    ) {
        double representativeLengthCm() {
            if (typicalLowCm > 0 && typicalHighCm > 0) return (typicalLowCm + typicalHighCm) * 0.5;
            if (typicalHighCm > 0) return typicalHighCm;
            if (recordHighCm > 0) return recordHighCm * 0.65;
            return 1.0;
        }

        RegistryLoader.Entry asRegistryEntry() {
            return new RegistryLoader.Entry(
                    fishId,
                    itemId,
                    entityId,
                    sourceMod,
                    "runtime",
                    typicalLowCm,
                    typicalHighCm,
                    recordHighCm,
                    raw
            );
        }
    }

    private RuntimeFishCatalog() {}

    static List<Entry> discover() throws IOException {
        if (TideData.FISH == null || TideData.FISH.get() == null) {
            throw new IOException("Tide FishData is not loaded yet");
        }

        var runtimeRows = TideData.FISH.get().stream().toList();
        runtimeRows = runtimeRows.stream()
                .sorted(Comparator.comparing(row -> row.getKey().toString()))
                .toList();

        Map<String, Entry> byFish = new LinkedHashMap<>();
        for (var row : runtimeRows) {
            FishData data = row.getValue();
            if (data == null || data.fish() == null || data.fish().value() == null) continue;

            Identifier itemId = Registries.ITEM.getId(data.fish().value());
            if (itemId == null) continue;
            String fishId = itemId.toString();

            String entityId = null;
            DisplayData display = data.display().orElse(null);
            if (display != null && display.entityType() != null) {
                Identifier resolved = Registries.ENTITY_TYPE.getId(display.entityType());
                if (resolved != null) entityId = resolved.toString();
            }

            double typicalLow = 0.0;
            double typicalHigh = 0.0;
            double recordHigh = 0.0;
            if (data.size().isPresent()) {
                var size = data.size().get();
                typicalLow = size.typicalLowCm();
                typicalHigh = size.typicalHighCm();
                recordHigh = size.recordHighCm();
            }

            JsonObject raw = new JsonObject();
            raw.addProperty("data_key", row.getKey().toString());
            raw.addProperty("fish_id", fishId);
            raw.addProperty("item_id", fishId);
            if (entityId != null) raw.addProperty("entity_id", entityId);
            raw.addProperty("source_mod", itemId.getNamespace());
            raw.addProperty("show_in_journal", data.showInJournal());
            raw.addProperty("original", data.parent().isEmpty());

            JsonArray associated = new JsonArray();
            data.associatedMods().forEach(associated::add);
            raw.add("associated_mods", associated);

            JsonObject size = new JsonObject();
            size.addProperty("typical_low_cm", typicalLow);
            size.addProperty("typical_high_cm", typicalHigh);
            size.addProperty("record_high_cm", recordHigh);
            raw.add("size", size);

            if (display != null) {
                JsonObject displayJson = new JsonObject();
                if (entityId != null) displayJson.addProperty("entity", entityId);
                displayJson.addProperty("shape", String.valueOf(display.shape()));
                displayJson.addProperty("x", display.x());
                displayJson.addProperty("y", display.y());
                displayJson.addProperty("z", display.z());
                displayJson.addProperty("roll", display.roll());
                displayJson.addProperty("pitch", display.pitch());
                displayJson.addProperty("yaw", display.yaw());
                display.nbt().ifPresent(nbt -> displayJson.addProperty("nbt", nbt.toString()));
                raw.add("display_data", displayJson);
            }

            Entry entry = new Entry(
                    row.getKey().toString(),
                    fishId,
                    fishId,
                    entityId,
                    itemId.getNamespace(),
                    List.copyOf(data.associatedMods()),
                    typicalLow,
                    typicalHigh,
                    recordHigh,
                    data.showInJournal(),
                    data.parent().isEmpty(),
                    raw
            );
            byFish.putIfAbsent(fishId, entry);
        }

        List<Entry> entries = new ArrayList<>(byFish.values());
        entries.sort(Comparator.comparing(Entry::fishId));
        if (entries.isEmpty()) throw new IOException("Tide runtime contains no discoverable FishData entries");
        return List.copyOf(entries);
    }

    static JsonObject toJson(List<Entry> entries) {
        JsonObject root = new JsonObject();
        root.addProperty("schema_version", 1);
        root.addProperty("source", "runtime:TideData.FISH");
        root.addProperty("fish_count", entries.size());
        JsonArray fish = new JsonArray();
        entries.forEach(entry -> fish.add(entry.raw().deepCopy()));
        root.add("fish", fish);
        return root;
    }

    static String fingerprint(List<Entry> entries) {
        String json = new GsonBuilder().disableHtmlEscaping().create().toJson(toJson(entries));
        return RuntimeEnvironment.sha256(json.getBytes(StandardCharsets.UTF_8));
    }
}
