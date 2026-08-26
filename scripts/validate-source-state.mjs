import crypto from 'node:crypto';
import fs from 'node:fs';

const errors = [];
let state;
try {
  state = JSON.parse(fs.readFileSync('.agent/source-state.json', 'utf8'));
} catch (error) {
  console.error(`Source-state validation FAILED: ${error.message}`);
  process.exit(1);
}

if (state.schemaVersion !== 1) errors.push(`schemaVersion must be 1, got ${JSON.stringify(state.schemaVersion)}`);
if (state.workingBranch !== 'fish-wiki-production') errors.push(`workingBranch must be fish-wiki-production, got ${JSON.stringify(state.workingBranch)}`);

const tide = state.authoritativeInputs?.tideFishData;
const extra = state.authoritativeInputs?.tideExtraCompatibility;
const builder = fs.readFileSync('scripts/build-fish-wiki.py', 'utf8');
const inventory = fs.readFileSync('scripts/fish-source-inventory.txt', 'utf8');
const workflow = fs.readFileSync('.github/workflows/build-fish-wiki-data.yml', 'utf8');

for (const [label, value, sources] of [
  ['Tide commit', tide?.commit, [['scripts/build-fish-wiki.py', builder], ['scripts/fish-source-inventory.txt', inventory], ['.github/workflows/build-fish-wiki-data.yml', workflow]]],
  ['Tide Extra version', extra?.version, [['scripts/build-fish-wiki.py', builder], ['scripts/fish-source-inventory.txt', inventory], ['.github/workflows/build-fish-wiki-data.yml', workflow]]],
  ['Tide Extra Modrinth version', extra?.modrinthVersion, [['scripts/fish-source-inventory.txt', inventory], ['.github/workflows/build-fish-wiki-data.yml', workflow]]],
]) {
  if (!(typeof value === 'string' && value.trim())) {
    errors.push(`${label} is missing from source-state`);
    continue;
  }
  for (const [sourceName, sourceText] of sources) {
    if (!sourceText.includes(value)) errors.push(`${label} ${value} is not referenced by ${sourceName}`);
  }
}

function gitBlobSha(buffer) {
  const prefix = Buffer.from(`blob ${buffer.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(prefix).update(buffer).digest('hex');
}

for (const [name, artifact] of Object.entries(state.trackedArtifacts || {})) {
  if (!(typeof artifact.path === 'string' && artifact.path)) {
    errors.push(`trackedArtifacts.${name}.path is missing`);
    continue;
  }
  if (!fs.existsSync(artifact.path)) {
    errors.push(`tracked artifact missing: ${artifact.path}`);
    continue;
  }
  if (artifact.gitBlobSha) {
    const actual = gitBlobSha(fs.readFileSync(artifact.path));
    if (actual !== artifact.gitBlobSha) {
      errors.push(`${artifact.path}: tracked Git blob SHA is stale; expected ${artifact.gitBlobSha}, actual ${actual}. Update source-state and invalidate dependent caches as needed.`);
    }
  }
}

const jar = state.authoritativeInputs?.tideborne;
if (jar?.sha256 != null && !/^[a-f0-9]{64}$/i.test(jar.sha256)) errors.push('authoritativeInputs.tideborne.sha256 must be null or a 64-character hex SHA-256');

if (errors.length) {
  console.error('Source-state validation FAILED:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('Source-state validation OK: pinned source identifiers and tracked repository artifact hashes are current.');
