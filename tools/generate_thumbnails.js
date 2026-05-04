const { mkdirSync, readdirSync } = require('node:fs');
const { dirname, extname, join, relative, sep } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const posterDir = join(root, 'assets', 'posters');
const outputRoot = join(root, 'assets', 'thumbs');

function collectPngs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectPngs(entryPath);
    return entry.name.toLowerCase().endsWith('.png') ? [entryPath] : [];
  });
}

const files = collectPngs(posterDir)
  .filter((file) => !file.includes(`${join('assets', 'posters', 'legacy')}${sep}`))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));

for (const file of files) {
  const rel = relative(posterDir, file);
  const out = join(outputRoot, rel).replace(new RegExp(`${extname(file)}$`), '.jpg');
  mkdirSync(dirname(out), { recursive: true });
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

console.log(`Generated ${files.length} thumbnails in assets/thumbs/{en,ru}/{land,marine,mass}`);
