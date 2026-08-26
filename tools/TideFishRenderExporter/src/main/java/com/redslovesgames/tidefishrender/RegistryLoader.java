package com.redslovesgames.tidefishrender;

import com.google.gson.*;
import net.minecraft.client.MinecraftClient;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

final class RegistryLoader {
    record Entry(String fishId,String itemId,String entityId,String sourceMod,String group,JsonObject raw) {}
    private RegistryLoader() {}
    static List<Entry> load() throws IOException {
        Path run=MinecraftClient.getInstance().runDirectory.toPath();
        Path extracted=run.resolve("fish_render_sources/registry/fish-render-registry.json");
        Path configured=run.resolve("config/tide-fish-render-exporter/fish-render-registry.json");
        Path path=Files.isRegularFile(extracted)?extracted:configured;
        if(!Files.isRegularFile(path)) throw new IOException("Registry not found. Put fish-render-registry.json at "+configured+" or run the extractor into fish_render_sources/registry/.");
        try(Reader reader=Files.newBufferedReader(path,StandardCharsets.UTF_8)){
            JsonObject root=JsonParser.parseReader(reader).getAsJsonObject(); JsonArray fish=root.getAsJsonArray("fish");
            if(fish==null) throw new IOException("Registry has no fish[] array: "+path);
            List<Entry> out=new ArrayList<>(fish.size()); Set<String> ids=new HashSet<>();
            for(JsonElement el:fish){ JsonObject o=el.getAsJsonObject(); String id=str(o,"fish_id",str(o,"key",null)); if(id==null||!ids.add(id))continue; out.add(new Entry(id,str(o,"item_id",id),str(o,"entity_id",null),str(o,"source_mod",namespace(id)),str(o,"group","misc"),o)); }
            return List.copyOf(out);
        }
    }
    private static String str(JsonObject o,String key,String fallback){JsonElement e=o.get(key);return e!=null&&!e.isJsonNull()?e.getAsString():fallback;}
    private static String namespace(String id){int i=id.indexOf(':');return i<0?"minecraft":id.substring(0,i);}
}
