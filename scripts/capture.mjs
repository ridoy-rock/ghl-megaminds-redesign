// Full-page screenshot with true device emulation over the Chrome DevTools Protocol.
// usage: node scripts/capture.mjs <url> <width> <outPrefix> [sliceHeight] [mobile=1]
// Writes .captures/<outPrefix>-full.png plus JPG slices. Needs Google Chrome and a running dev server.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const [url, widthArg, outPrefix, sliceArg = '1800', mobileArg = '1'] = process.argv.slice(2);
const width = Number(widthArg);
const sliceH = Number(sliceArg);
const mobile = mobileArg === '1';
const dir = fileURLToPath(new URL('../.captures/', import.meta.url));
mkdirSync(dir, { recursive: true });

const port = 9333 + Math.floor(Math.random() * 400);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${dir}/cdp-profile-${port}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killTimer = setTimeout(() => { chrome.kill('SIGKILL'); process.exit(2); }, 60000);

try {
  let targets;
  for (let i = 0; i < 40; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.length) break; } catch {}
    await sleep(250);
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else if (msg.method) events.push(msg.method);
  });
  const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url });
  for (let i = 0; i < 60 && !events.includes('Page.loadEventFired'); i++) await sleep(200);
  await sleep(1200);
  // Show every scroll-reveal element in its final state and wait out the transitions.
  await send('Runtime.evaluate', {
    expression: "document.querySelectorAll('[data-reveal], [data-stagger]').forEach(el => el.classList.add('is-in'))",
  });
  // Count-ups only run when scrolled into view, so set their final values (and retire them) for the capture.
  await send('Runtime.evaluate', {
    expression: "document.querySelectorAll('[data-count]').forEach(el => { el.textContent = el.dataset.count; el.removeAttribute('data-count'); })",
  });
  // Lazy images below the emulated viewport never load on their own during a capture.
  await send('Runtime.evaluate', {
    expression: "Promise.all([...document.images].map(img => { img.loading = 'eager'; return img.complete ? null : new Promise(r => { img.onload = img.onerror = r; }); }))",
    awaitPromise: true,
  });
  // Load lazy iframes too (the HighLevel calendar), then give the widget time to render and resize.
  await send('Runtime.evaluate', { expression: "document.querySelectorAll('iframe[loading=lazy]').forEach(f => { f.loading = 'eager'; f.src = f.src; })" });
  await sleep(Number(process.env.IFRAME_WAIT || 1400));
  const metrics = await send('Page.getLayoutMetrics');
  const { width: cw, height: ch } = metrics.result.cssContentSize;
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: Math.min(cw, width), height: ch, scale: 1 },
  });
  const full = `${dir}/${outPrefix}-full.png`;
  writeFileSync(full, Buffer.from(shot.result.data, 'base64'));
  const meta = await sharp(full).metadata();
  const n = Math.ceil(meta.height / sliceH);
  for (let i = 0; i < n; i++) {
    const top = i * sliceH;
    const h = Math.min(sliceH, meta.height - top);
    await sharp(full).extract({ left: 0, top, width: meta.width, height: h }).jpeg({ quality: 82 }).toFile(`${dir}/${outPrefix}-${String(i).padStart(2, '0')}.jpg`);
  }
  console.log(`${meta.width}x${meta.height} (content ${cw}x${ch}), ${n} slices`);
  ws.close();
} finally {
  clearTimeout(killTimer);
  chrome.kill('SIGKILL');
}
