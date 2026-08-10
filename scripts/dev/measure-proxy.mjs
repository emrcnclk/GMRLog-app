#!/usr/bin/env node
/**
 * Measurement proxy (3b.1c, promoted from 3b.1's throwaway pass-through).
 *
 * A dev-only fault seam: every route passes straight through to the real
 * backend except one, which can be told to answer with a chosen status
 * instead. This is what makes a screen's error branch reachable at all — the
 * real backend has no lever to fail a request on demand, and a production
 * client must never carry a fault flag of its own (3b.1f).
 *
 * Usage:
 *   node scripts/dev/measure-proxy.mjs [--port 4001] [--target http://127.0.0.1:4000]
 *
 * Then point EXPO_PUBLIC_API_URL at the proxy instead of the real backend.
 * While no fault is set, every request — sign-in, /me, the query client,
 * everything — passes through untouched.
 *
 * Control routes (never forwarded):
 *   POST /__proxy/fault  { "method": "GET", "path": "/api/v1/communities", "status": 500 }
 *   POST /__proxy/clear
 *   GET  /__proxy/status
 */
import http from 'node:http';
import { URL } from 'node:url';

const args = process.argv.slice(2);
function flag(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 || index === args.length - 1 ? fallback : args[index + 1];
}

const PORT = Number(flag('port', '4001'));
const TARGET = new URL(flag('target', 'http://127.0.0.1:4000'));

/** @type {{ method: string, path: string, status: number, body: unknown } | null} */
let fault = null;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function faultEnvelope(status) {
  return {
    error: {
      category: status >= 500 ? 'internal' : 'validation',
      code: status >= 500 ? 'INTERNAL_ERROR' : 'FAULT_INJECTED',
      message: `measure-proxy: injected ${status} response`,
      requestId: `req_fault_${Date.now().toString(36)}`,
      retryable: status >= 500,
    },
  };
}

function matchesFault(req, pathname) {
  if (!fault) return false;
  if (fault.method !== '*' && fault.method !== req.method) return false;
  return fault.path === pathname;
}

async function handleControl(req, res, pathname) {
  if (pathname === '/__proxy/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ fault }));
    return true;
  }
  if (pathname === '/__proxy/clear' && req.method === 'POST') {
    fault = null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ fault }));
    console.log('[measure-proxy] fault cleared');
    return true;
  }
  if (pathname === '/__proxy/fault' && req.method === 'POST') {
    const raw = await readBody(req);
    const parsed = JSON.parse(raw.toString('utf8') || '{}');
    if (typeof parsed.path !== 'string' || typeof parsed.status !== 'number') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'path and status are required' }));
      return true;
    }
    fault = {
      method: typeof parsed.method === 'string' ? parsed.method.toUpperCase() : '*',
      path: parsed.path,
      status: parsed.status,
      body: parsed.body ?? faultEnvelope(parsed.status),
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ fault }));
    console.log('[measure-proxy] fault set:', fault);
    return true;
  }
  return false;
}

function proxyThrough(req, res) {
  const upstream = http.request(
    {
      protocol: TARGET.protocol,
      hostname: TARGET.hostname,
      port: TARGET.port,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: TARGET.host },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on('error', (error) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ error: 'measure-proxy: upstream unreachable', detail: String(error) }),
    );
  });
  req.pipe(upstream);
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url ?? '/', 'http://internal').pathname;

  if (pathname.startsWith('/__proxy/')) {
    const handled = await handleControl(req, res, pathname);
    if (handled) return;
  }

  if (matchesFault(req, pathname)) {
    await readBody(req); // drain so the socket doesn't hang
    // The real backend answers CORS itself; a fault response bypasses it
    // entirely, so this echoes the same headers a real response would carry
    // (credentialed CORS needs the exact origin, not `*`) or the browser
    // drops the response as a network error before the app ever sees the 500.
    const origin = req.headers.origin;
    res.writeHead(fault.status, {
      'Content-Type': 'application/json',
      ...(origin
        ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' }
        : {}),
    });
    res.end(JSON.stringify(fault.body));
    console.log(`[measure-proxy] served fault ${fault.status} for ${req.method} ${pathname}`);
    return;
  }

  proxyThrough(req, res);
});

server.listen(PORT, () => {
  console.log(`[measure-proxy] listening on :${PORT}, forwarding to ${TARGET.origin}`);
});
