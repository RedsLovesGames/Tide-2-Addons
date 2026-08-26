import { spawnSync } from 'node:child_process';

const commands = [
  ['node', ['--check', 'assets/app.js']],
  ['node', ['--check', 'assets/specimens.js']],
  ['node', ['--check', 'assets/fish-site-search.js']],
  ['node', ['--check', 'assets/fish-wiki.js']],
  ['node', ['--check', 'assets/fish-wiki-v2.js']],
  ['node', ['--check', 'assets/fish-detail-nav.js']],
  ['node', ['--check', 'assets/latest-1357.js']],
  ['node', ['--check', 'assets/tide-item-textures.js']],
  ['node', ['--check', 'assets/bugfix-ux.js']],
  ['node', ['scripts/validate-static-site.mjs']],
  ['node', ['scripts/validate-provenance.mjs']],
  ['node', ['scripts/validate-source-state.mjs']],
  ['python', ['scripts/validate-fish-wiki.py']],
  ['python', ['scripts/validate-fish-render-manifest.py']],
];

for (const [command, args] of commands) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) {
    console.error(`Could not run ${command}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('\nAll deterministic Tideborne Fish Wiki validation passed.');
