import { cp, mkdir, readdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
await cp('index.html', 'dist/index.html');
await cp('scripts/birthday-card.js', 'dist/birthday-card.js');
for (const entry of await readdir('.', { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^\d\d-/.test(entry.name)) continue;
  await cp(entry.name, 'dist/' + entry.name, {
    recursive: true,
    filter: path => !/(^|\/)(?:\.git|\.env[^/]*|AGENTS\.md|MEMORY\.md|node_modules)(?:\/|$)/.test(path)
  });
}
