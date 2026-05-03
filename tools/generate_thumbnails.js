const { mkdirSync, readdirSync } = require('node:fs');
const { basename, extname, join } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const outputDir = join(root, 'assets', 'thumbs');
mkdirSync(outputDir, { recursive: true });

const files = readdirSync(root)
  .filter((name) => name.toLowerCase().endsWith('.png'))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));

for (const file of files) {
  const out = join(outputDir, `${basename(file, extname(file))}.jpg`);
  const result = spawnSync('sips', [
    '-Z', '720',
    '-s', 'format', 'jpeg',
    '-s', 'formatOptions', '72',
    file,
    '--out',
    out,
  ], { cwd: root, encoding: 'utf8' });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log(`Generated ${files.length} thumbnails in assets/thumbs`);
