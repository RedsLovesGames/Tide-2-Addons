/**
 * Tideborne Fish Wiki render-source metadata loader.
 *
 * Metadata only. This does not approximate or fake Minecraft entity geometry.
 */
export const FISH_RENDER_DATA_BASE = new URL("./", import.meta.url);

async function loadJson(path) {
  const response = await fetch(new URL(path, FISH_RENDER_DATA_BASE));
  if (!response.ok) throw new Error(`Fish render data request failed: ${response.status} ${path}`);
  return response.json();
}

export const loadFishRenderManifest = () => loadJson("manifest.json");
export const loadSupportedFishRegistry = () => loadJson("registry/supported-fish-registry.json");
export const loadModRenderRegistry = () => loadJson("registry/mod-render-registry.json");
export const loadFishSourceIndex = () => loadJson("registry/fish-source-file-index.json");
