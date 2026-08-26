import fs from 'node:fs';
import zlib from 'node:zlib';

const errors = [];
const shardPaths = ['assets/fish-wiki-data-0.json.gz', 'assets/fish-wiki-data-1.json.gz'];
const records = [];

for (const shardPath of shardPaths) {
  try {
    const decoded = zlib.gunzipSync(fs.readFileSync(shardPath)).toString('utf8');
    const shard = JSON.parse(decoded);
    if (!Array.isArray(shard.records)) errors.push(`${shardPath}: records is not an array`);
    else records.push(...shard.records);
  } catch (error) {
    errors.push(`${shardPath}: cannot decode FishData: ${error.message}`);
  }
}

const fishIds = new Set(records.map(record => record.id));
const allowed = new Set(['exact', 'representative', 'no_entity', 'source_missing', 'vanilla_model', 'unreconstructed']);
const unavailableLike = new Set(['no_entity', 'source_missing', 'vanilla_model', 'unreconstructed']);

for (const record of records) {
  const id = record.id || '<unknown>';
  const preview = record.preview;
  if (!preview || typeof preview !== 'object') {
    errors.push(`${id}: preview object is missing`);
    continue;
  }
  if (!allowed.has(preview.status)) {
    errors.push(`${id}: unsupported preview status ${JSON.stringify(preview.status)}`);
    continue;
  }
  if (unavailableLike.has(preview.status) && !(typeof preview.note === 'string' && preview.note.trim())) {
    errors.push(`${id}: ${preview.status} preview needs an explicit note/reason`);
  }
  if (preview.status === 'exact' || preview.status === 'representative') {
    if (!Number.isInteger(preview.row) || preview.row < 0 || !Number.isInteger(preview.col) || preview.col < 0) {
      errors.push(`${id}: ${preview.status} preview requires non-negative atlas row/col`);
    }
    const provenance = preview.provenance;
    if (!provenance || typeof provenance !== 'object') {
      errors.push(`${id}: ${preview.status} preview requires a provenance object`);
    } else {
      for (const key of ['modelSource', 'textureSource', 'rendererSource']) {
        if (!(typeof provenance[key] === 'string' && provenance[key].trim())) {
          errors.push(`${id}: ${preview.status} preview provenance missing ${key}`);
        }
      }
      if (preview.status === 'representative' && !(typeof provenance.variantNote === 'string' && provenance.variantNote.trim())) {
        errors.push(`${id}: representative preview provenance requires variantNote`);
      }
    }
  }
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync('assets/fish-render-manifest.json', 'utf8'));
} catch (error) {
  errors.push(`assets/fish-render-manifest.json: cannot parse: ${error.message}`);
  manifest = null;
}

if (manifest) {
  if (!manifest.policy || typeof manifest.policy !== 'string') errors.push('render manifest: policy string is required');
  if (!manifest.fish || typeof manifest.fish !== 'object' || Array.isArray(manifest.fish)) errors.push('render manifest: fish object is required');
  else {
    for (const [fishId, entry] of Object.entries(manifest.fish)) {
      if (!fishIds.has(fishId)) errors.push(`render manifest: ${fishId} is not present in FishData`);
      if (!(typeof entry.source === 'string' && entry.source.trim())) errors.push(`${fishId}: source is required`);
      if (!(typeof entry.entity === 'string' && entry.entity.trim())) errors.push(`${fishId}: entity is required`);
      const variants = entry.variants;
      if (!variants || typeof variants !== 'object') {
        errors.push(`${fishId}: variants object is required`);
        continue;
      }
      for (const [condition, variant] of Object.entries(variants)) {
        const status = variant?.status;
        if (!new Set(['source_backed_documentation', 'source_backed_export', 'unavailable']).has(status)) {
          errors.push(`${fishId}/${condition}: unsupported render-manifest status ${JSON.stringify(status)}`);
          continue;
        }
        if (status === 'unavailable') {
          if (variant.file != null) errors.push(`${fishId}/${condition}: unavailable variant must not claim a file`);
          if (!(typeof variant.reason === 'string' && variant.reason.trim())) errors.push(`${fishId}/${condition}: unavailable variant needs a reason`);
        } else if (!(typeof variant.file === 'string' && variant.file.trim())) {
          errors.push(`${fishId}/${condition}: source-backed status requires a file`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error('Provenance validation FAILED:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Provenance validation OK: ${records.length} FishData records and ${Object.keys(manifest?.fish || {}).length} render-manifest fish checked.`);
