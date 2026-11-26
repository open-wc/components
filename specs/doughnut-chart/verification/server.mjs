import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const roots = { '/docs': '/home/benedikt/project/components/dist' };
createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const prefix = Object.keys(roots).find(key => pathname.startsWith(`${key}/`));
    const base = prefix ? roots[prefix] : '/tmp/doughnut-consumer';
    const relative = prefix ? pathname.slice(prefix.length) : pathname;
    const path = resolve(base, `.${relative.endsWith('/') ? `${relative}index.html` : relative}`);
    if (!path.startsWith(`${base}/`)) { throw new Error('Invalid path'); }
    const content = await readFile(path);
    response.setHeader('Content-Type', { '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml', '.css': 'text/css', '.ttf': 'font/ttf' }[extname(path)] ?? 'application/octet-stream');
    response.end(content);
  } catch {
    response.writeHead(404).end();
  }
}).listen(8097, '127.0.0.1');
