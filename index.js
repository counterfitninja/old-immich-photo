import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const RUNTIME_CONFIG_PATH = path.join(__dirname, 'runtime-config.json');
const DEFAULT_PORT = 8000;

function loadRuntimeConfig() {
  try {
    if (!fs.existsSync(RUNTIME_CONFIG_PATH)) {
      return {};
    }

    const raw = fs.readFileSync(RUNTIME_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('Failed to read runtime-config.json, continuing with defaults:', error.message);
    return {};
  }
}

const runtimeConfig = loadRuntimeConfig();
const IMMICH_BASE_URL = (
  process.env.IMMICH_BASE_URL ||
  process.env.PELICAN_IMMICH_BASE_URL ||
  runtimeConfig.immichBaseUrl ||
  ''
)
  .toString()
  .trim()
  .replace(/\/$/, '');

const LM_STUDIO_URL = (
  process.env.LM_STUDIO_URL ||
  process.env.PELICAN_LM_STUDIO_URL ||
  runtimeConfig.lmStudioUrl ||
  'http://localhost:1234'
)
  .toString()
  .trim()
  .replace(/\/$/, '');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, x-api-key, Authorization, x-immich-url',
  'Access-Control-Max-Age': '86400',
};

function resolvePort() {
  const rawPort =
    process.env.PORT ||
    process.env.SERVER_PORT ||
    process.env.PELICAN_PORT ||
    process.env.PTERODACTYL_PORT ||
    '';

  const parsed = Number(rawPort);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
    return parsed;
  }
  return DEFAULT_PORT;
}

const PORT = resolvePort();
const HOST = '0.0.0.0';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal server error while reading file.');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function getImmichTargetUrl(reqUrl, immichBaseUrl) {
  const requestPath = decodeURIComponent((reqUrl || '/').split('?')[0]);
  const proxyPrefix = '/api/immich';

  if (!requestPath.startsWith(proxyPrefix)) {
    return null;
  }

  const immichPath = requestPath.slice(proxyPrefix.length) || '/';
  return `${immichBaseUrl}${immichPath}`;
}

async function proxyImmichRequest(req, res) {
  const immichBaseUrl = IMMICH_BASE_URL || (req.headers['x-immich-url'] || '').toString().replace(/\/$/, '');
  const apiKey = (req.headers['x-api-key'] || '').toString();

  if (!immichBaseUrl || !apiKey) {
    sendJson(res, 400, { error: 'Missing Immich URL or API key.' });
    return;
  }

  const targetUrl = getImmichTargetUrl(req.url, immichBaseUrl);
  if (!targetUrl) {
    sendJson(res, 400, { error: 'Invalid Immich proxy path.' });
    return;
  }

  try {
    const incomingContentType = req.headers['content-type'];
    const incomingContentLength = req.headers['content-length'];

    const upstreamHeaders = {
      'x-api-key': apiKey,
      'Accept': 'application/json',
    };

    if (incomingContentType) {
      upstreamHeaders['Content-Type'] = incomingContentType;
    }

    if (incomingContentLength) {
      upstreamHeaders['Content-Length'] = incomingContentLength;
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: upstreamHeaders,
      body: hasBody ? req : undefined,
      duplex: hasBody ? 'half' : undefined,
    });

    const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    const responseHeaders = {};
    const responseContentType = upstreamResponse.headers.get('content-type');

    if (responseContentType) {
      responseHeaders['Content-Type'] = responseContentType;
    }

    res.writeHead(upstreamResponse.status, responseHeaders);
    res.end(responseBuffer);
  } catch (error) {
    console.error('Immich proxy error:', error);
    sendJson(res, 502, { error: 'Immich proxy request failed.' });
  }
}

if (!fs.existsSync(DIST_DIR)) {
  console.error('dist/ not found. Run "npm run build" before starting the server.');
  process.exit(1);
}

async function proxyLmStudio(req, res) {
  // Strip the /api/ai prefix and forward the rest of the path to LM Studio
  const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const upstreamPath = reqPath.replace(/^\/api\/ai/, '') || '/';
  const targetUrl = `${LM_STUDIO_URL}${upstreamPath}`;

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
      body: body.length ? body : undefined,
    });

    const responseBuffer = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      ...CORS_HEADERS,
    });
    res.end(responseBuffer);
  } catch (err) {
    console.error('LM Studio proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: { message: `LM Studio proxy error: ${err.message}` } }));
  }
}

const server = http.createServer((req, res) => {
  const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // Handle CORS preflight for all /api/* proxy routes
  if (req.method === 'OPTIONS' && reqPath.startsWith('/api/')) {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/config') {
    sendJson(res, 200, {
      immichBaseUrl: IMMICH_BASE_URL,
      lmStudioProxy: true,
    });
    return;
  }

  if (reqPath.startsWith('/api/ai')) {
    proxyLmStudio(req, res);
    return;
  }

  if (reqPath.startsWith('/api/immich')) {
    proxyImmichRequest(req, res);
    return;
  }

  const safePath = path.normalize(reqPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(DIST_DIR, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(res, filePath);
      return;
    }

    // SPA fallback for React routes
    const indexPath = path.join(DIST_DIR, 'index.html');
    fs.stat(indexPath, (indexErr, indexStats) => {
      if (indexErr || !indexStats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      sendFile(res, indexPath);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Static server running at http://${HOST}:${PORT}`);
});
