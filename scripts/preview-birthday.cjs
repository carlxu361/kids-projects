const { createServer } = require('node:http');
const { createReadStream } = require('node:fs');
const { stat } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const mission = require('../api/mission.js');
const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/birthday' || url.pathname.startsWith('/birthday/') || url.pathname === '/api/mission') {
    return mission(req, res);
  }
  try {
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) throw Error('path');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    await stat(file);
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(Number(process.env.PORT || 8787), '127.0.0.1', () => {
  process.stdout.write('Local: http://127.0.0.1:' + (process.env.PORT || 8787) + '\n');
});
