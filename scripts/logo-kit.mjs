// Builds the full logo kit for the chosen "Workflow" mark (T8): every version as SVG (outlined), PDF (vector) and
// PNG, editable SVGs with live text, a layered master file, favicons, social avatars and colours.
// The name is set in Satoshi, the website's heading font (src/assets/fonts/Satoshi-Variable.woff2). Static Bold/Black
// instances are cut from it with Python fontTools (fontkit can't lay out a variation of this woff2).
// usage: node scripts/logo-kit.mjs
// Output: review/GHL-Megaminds-Logo-Kit-<date>/ and a zip next to it.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const fontkit = require('fontkit');
const sharp = require('sharp');
const root = fileURLToPath(new URL('..', import.meta.url));
const date = new Date().toISOString().slice(0, 10);
const NAME = `GHL-Megaminds-Logo-Kit-${date}`;
const OUT = path.join(root, 'review', NAME);

// ---------- Brand ----------
const COLOR = { yellow: '#FFC800', blue: '#2896FB', green: '#17C94B', ink: '#14211B', navy: '#0B1220', white: '#FFFFFF', black: '#000000' };
const SIZE = 64; // icon box; the name is set at 0.58 x this
const FS = SIZE * 0.6;
const GAP = SIZE * 0.3; // icon to name
const WORD_GAP = FS * 0.24; // GHL to Megaminds

// "GHL" is Satoshi Bold (700), "Megaminds" Satoshi Black (900), both tracked in slightly like the site's headings.
const WEIGHT = { ghl: 700, mega: 900 };
const TRACK = { ghl: -0.015, mega: -0.025 };
const fontTmp = mkdtempSync(path.join(tmpdir(), 'satoshi-'));
const cut = spawnSync('python3', ['-c', `
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
for w in sys.argv[2:]:
    f = TTFont(sys.argv[1]); f.flavor = None
    instancer.instantiateVariableFont(f, {'wght': int(w)}).save(f'${fontTmp}/Satoshi-{w}.ttf')
`, `${root}src/assets/fonts/Satoshi-Variable.woff2`, String(WEIGHT.ghl), String(WEIGHT.mega)], { stdio: 'inherit' });
if (cut.status !== 0) throw new Error('fontTools could not cut the Satoshi instances');
const f600 = fontkit.openSync(path.join(fontTmp, `Satoshi-${WEIGHT.ghl}.ttf`));
const f800 = fontkit.openSync(path.join(fontTmp, `Satoshi-${WEIGHT.mega}.ttf`));

const textPath = (text, font, fontSize, tracking) => {
  const scale = fontSize / font.unitsPerEm, run = font.layout(text);
  let x = 0;
  const parts = [];
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i];
    const d = g.path.scale(scale, -scale).translate(x + pos.xOffset * scale, -pos.yOffset * scale).toSVG();
    if (d) parts.push(d);
    x += pos.xAdvance * scale + tracking * fontSize;
  });
  return { d: parts.join(''), width: x - tracking * fontSize };
};
const capH = f800.capHeight * (FS / f800.unitsPerEm);
const descender = Math.abs(f800.descent) * (FS / f800.unitsPerEm) * 0.85;
const ghl = textPath('GHL', f600, FS, TRACK.ghl);
const mega = textPath('Megaminds', f800, FS, TRACK.mega);
const WORD_W = ghl.width + WORD_GAP + mega.width;

// ---------- Mark (64 x 64): three automation steps linked by a rising line ----------
const icon = ({ line, dots }) =>
  `<g id="icon">` +
  `<path id="icon-line" d="M12 50 C22 50 22 32 32 32 S42 14 52 14" fill="none" stroke="${line}" stroke-width="4.5" stroke-linecap="round"/>` +
  `<circle id="dot-trigger" cx="12" cy="50" r="8" fill="${dots[0]}"/>` +
  `<circle id="dot-action" cx="32" cy="32" r="8" fill="${dots[1]}"/>` +
  `<circle id="dot-result" cx="52" cy="14" r="8" fill="${dots[2]}"/>` +
  `</g>`;

// Colour schemes: line colour, dot colours, name colour.
const DOTS = [COLOR.yellow, COLOR.blue, COLOR.green];
const SCHEMES = {
  color: { label: 'Full colour (light backgrounds)', line: COLOR.ink, dots: DOTS, text: COLOR.ink },
  'color-on-dark': { label: 'Full colour (dark backgrounds)', line: COLOR.white, dots: DOTS, text: COLOR.white },
  black: { label: 'One colour, black', line: COLOR.black, dots: [COLOR.black, COLOR.black, COLOR.black], text: COLOR.black },
  white: { label: 'One colour, white', line: COLOR.white, dots: [COLOR.white, COLOR.white, COLOR.white], text: COLOR.white },
};

// Name: outlined paths, or live text (editable; needs Satoshi installed).
const wordmark = (x, base, fill, editable) =>
  editable
    ? `<text id="name" x="${x.toFixed(2)}" y="${base.toFixed(2)}" fill="${fill}" font-family="Satoshi, sans-serif" font-size="${FS.toFixed(2)}">` +
      `<tspan id="name-ghl" font-weight="${WEIGHT.ghl}" letter-spacing="${(TRACK.ghl * FS).toFixed(3)}">GHL</tspan>` +
      `<tspan id="name-megaminds" x="${(x + ghl.width + WORD_GAP).toFixed(2)}" font-weight="${WEIGHT.mega}" letter-spacing="${(TRACK.mega * FS).toFixed(3)}">Megaminds</tspan>` +
      `</text>`
    : `<g id="name"><path id="name-ghl" transform="translate(${x.toFixed(2)} ${base.toFixed(2)})" d="${ghl.d}" fill="${fill}"/>` +
      `<path id="name-megaminds" transform="translate(${(x + ghl.width + WORD_GAP).toFixed(2)} ${base.toFixed(2)})" d="${mega.d}" fill="${fill}"/></g>`;

const svg = (w, h, body, title) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">\n<title>${title}</title>\n${body}\n</svg>\n`;

// Horizontal lockup.
const H_W = Math.ceil(SIZE + GAP + WORD_W + 2), H_H = SIZE;
const horizontal = (scheme, editable = false) => {
  const s = SCHEMES[scheme];
  return svg(H_W, H_H, icon(s) + wordmark(SIZE + GAP, SIZE / 2 + capH / 2, s.text, editable), 'GHL Megaminds');
};

// Stacked lockup: icon centred above the name.
const S_GAP = 16;
const S_W = Math.ceil(WORD_W + 2), S_H = Math.ceil(SIZE + S_GAP + capH + descender);
const stacked = (scheme, editable = false) => {
  const s = SCHEMES[scheme];
  return svg(S_W, S_H, `<g transform="translate(${((S_W - SIZE) / 2).toFixed(2)} 0)">${icon(s)}</g>` + wordmark(1, SIZE + S_GAP + capH, s.text, editable), 'GHL Megaminds');
};

const iconOnly = (scheme) => svg(SIZE, SIZE, icon(SCHEMES[scheme]), 'GHL Megaminds icon');

// App icon: rounded square; the mark at 72% so it breathes.
const appIcon = (tile, scheme, radius = 16) =>
  svg(64, 64, `<rect id="tile" width="64" height="64" rx="${radius}" fill="${tile}"/><g transform="translate(32 32) scale(0.72) translate(-32 -32)">${icon(SCHEMES[scheme])}</g>`, 'GHL Megaminds');
// Social avatar: full square (platforms crop it to a circle themselves); the mark sits inside the circle-safe area.
const avatar = () => svg(64, 64, `<rect id="background" width="64" height="64" fill="${COLOR.navy}"/><g transform="translate(32 32) scale(0.6) translate(-32 -32)">${icon(SCHEMES['color-on-dark'])}</g>`, 'GHL Megaminds');

// ---------- Writers ----------
const files = []; // [relativePath, svgString] for PDF export later
const write = (rel, content) => {
  const p = path.join(OUT, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, content);
  return p;
};
const widthOf = (s) => Number(s.match(/viewBox="0 0 ([\d.]+)/)[1]);
const png = async (rel, s, pxWidth, background) => {
  const p = path.join(OUT, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  let img = sharp(Buffer.from(s), { density: (72 * pxWidth) / widthOf(s) }).png();
  if (background) img = sharp(await img.toBuffer()).flatten({ background }).png();
  await img.toFile(p);
};
const vector = (rel, s) => { write(rel, s); files.push([rel.replace(/\.svg$/, '.pdf'), s]); };

rmSync(OUT, { recursive: true, force: true });

// 1-2. Lockups
for (const [dir, make, pngW] of [['01 Logo - horizontal', horizontal, 2400], ['02 Logo - stacked', stacked, 1400]]) {
  const kind = dir.includes('stacked') ? 'stacked' : 'horizontal';
  for (const scheme of Object.keys(SCHEMES)) {
    const base = `${dir}/GHL-Megaminds-logo-${kind}-${scheme}`;
    vector(`${base}.svg`, make(scheme));
    await png(`${base}.png`, make(scheme), pngW);
  }
}

// 3. Icon
for (const scheme of Object.keys(SCHEMES)) {
  const base = `03 Icon/GHL-Megaminds-icon-${scheme}`;
  vector(`${base}.svg`, iconOnly(scheme));
  await png(`${base}.png`, iconOnly(scheme), 1024);
}

// 4. App icon
const appNavy = appIcon(COLOR.navy, 'color-on-dark');
const appWhite = appIcon(COLOR.white, 'color');
vector('04 App icon/GHL-Megaminds-app-icon-navy.svg', appNavy);
vector('04 App icon/GHL-Megaminds-app-icon-white.svg', appWhite);
for (const px of [1024, 512, 192, 180]) {
  await png(`04 App icon/GHL-Megaminds-app-icon-navy-${px}.png`, appNavy, px);
  await png(`04 App icon/GHL-Megaminds-app-icon-white-${px}.png`, appWhite, px);
}
// iOS / stores want a full square without transparency (the platform rounds the corners).
await png('04 App icon/GHL-Megaminds-app-icon-navy-square-1024.png', appIcon(COLOR.navy, 'color-on-dark', 0), 1024);

// 5. Favicon (navy tile), incl. a multi-size .ico
write('05 Favicon/favicon.svg', appNavy);
const favPngs = {};
for (const px of [16, 32, 48, 180, 192, 512]) {
  const name = px === 180 ? 'apple-touch-icon.png' : px >= 192 ? `android-chrome-${px}.png` : `favicon-${px}.png`;
  await png(`05 Favicon/${name}`, px === 180 ? appIcon(COLOR.navy, 'color-on-dark', 0) : appNavy, px);
  if (px <= 48) favPngs[px] = await sharp(path.join(OUT, '05 Favicon', name)).toBuffer();
}
{
  const sizes = [16, 32, 48], header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((px, i) => {
    const e = 6 + i * 16, data = favPngs[px];
    header.writeUInt8(px, e); header.writeUInt8(px, e + 1); header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6); header.writeUInt32LE(data.length, e + 8); header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  write('05 Favicon/favicon.ico', Buffer.concat([header, ...sizes.map((px) => favPngs[px])]));
}

// 6. Social avatar
vector('06 Social avatar/GHL-Megaminds-avatar.svg', avatar());
for (const px of [400, 800, 1080]) await png(`06 Social avatar/GHL-Megaminds-avatar-${px}.png`, avatar(), px);

// 0. Editable sources: live-text SVGs and a layered master sheet with every version.
for (const scheme of ['color', 'color-on-dark', 'black', 'white']) {
  write(`00 Editable source/GHL-Megaminds-logo-horizontal-${scheme}-EDITABLE.svg`, horizontal(scheme, true));
  write(`00 Editable source/GHL-Megaminds-logo-stacked-${scheme}-EDITABLE.svg`, stacked(scheme, true));
}
const master = (editable) => {
  const W = 1600, rows = [];
  let y = 120;
  const label = (x, yy, t) => `<text x="${x}" y="${yy}" font-family="Satoshi, sans-serif" font-size="18" font-weight="700" fill="#5B6472">${t}</text>`;
  const place = (id, title, inner, w, h, bg, x, yy, scale) =>
    `<g id="${id}">` + (bg ? `<rect id="${id}-background" x="${x - 40}" y="${yy - 40}" width="${w * scale + 80}" height="${h * scale + 80}" rx="24" fill="${bg}"/>` : '') +
    `<g transform="translate(${x} ${yy}) scale(${scale})">${inner}</g>` + label(x - 40, yy - 56, title) + `</g>`;
  const strip = (s) => s.replace(/^[\s\S]*?<\/title>\n/, '').replace(/\n<\/svg>\n$/, '');
  const bgFor = { color: '#F4F6F9', 'color-on-dark': COLOR.navy, black: '#F4F6F9', white: COLOR.navy };
  // Horizontal lockups, two per row
  Object.keys(SCHEMES).forEach((scheme, i) => {
    const x = i % 2 === 0 ? 100 : 860, yy = y + Math.floor(i / 2) * 260 + 60;
    rows.push(place(`horizontal-${scheme}`, `Horizontal · ${SCHEMES[scheme].label}`, strip(horizontal(scheme, editable)), H_W, H_H, bgFor[scheme], x, yy, 1.75));
  });
  y += 2 * 260 + 80;
  Object.keys(SCHEMES).forEach((scheme, i) => {
    const x = 100 + i * 370, yy = y + 60;
    rows.push(place(`stacked-${scheme}`, `Stacked · ${scheme}`, strip(stacked(scheme, editable)), S_W, S_H, bgFor[scheme], x, yy, 1.0));
  });
  y += S_H + 200;
  Object.keys(SCHEMES).forEach((scheme, i) => {
    rows.push(place(`icon-${scheme}`, `Icon · ${scheme}`, strip(iconOnly(scheme)), 64, 64, bgFor[scheme], 100 + i * 200, y + 60, 1.6));
  });
  rows.push(place('app-icon-navy', 'App icon · navy', strip(appNavy), 64, 64, null, 900, y + 60, 1.6));
  rows.push(place('app-icon-white', 'App icon · white', strip(appWhite), 64, 64, '#F4F6F9', 1080, y + 60, 1.6));
  rows.push(place('social-avatar', 'Social avatar', strip(avatar()), 64, 64, null, 1300, y + 60, 1.6));
  y += 64 * 1.6 + 160;
  const sw = Object.entries({ Yellow: COLOR.yellow, Blue: COLOR.blue, Green: COLOR.green, Ink: COLOR.ink, Navy: COLOR.navy })
    .map(([n, c], i) => `<g id="swatch-${n.toLowerCase()}"><rect x="${100 + i * 280}" y="${y}" width="240" height="90" rx="16" fill="${c}"/>${label(100 + i * 280, y + 122, `${n} ${c}`)}</g>`).join('');
  const H = y + 180;
  return svg(W, H, `<rect id="artboard" width="${W}" height="${H}" fill="#FFFFFF"/>` +
    `<text x="60" y="64" font-family="Satoshi, sans-serif" font-size="30" font-weight="900" fill="${COLOR.ink}">GHL Megaminds · logo master</text>` +
    rows.join('\n') + `<g id="colours">${sw}</g>`, 'GHL Megaminds logo master');
};
write('00 Editable source/GHL-Megaminds-logo-master-EDITABLE.svg', master(true));
vector('00 Editable source/GHL-Megaminds-logo-master.svg', master(false));

// 7. Brand: colours
write('07 Brand/colours.txt', `GHL MEGAMINDS · BRAND COLOURS

Yellow (trigger dot)   ${COLOR.yellow}   RGB 255 200 0     CMYK approx 0 22 100 0
Blue   (action dot)    ${COLOR.blue}   RGB 40 150 251    CMYK approx 84 40 0 2
Green  (result dot)    ${COLOR.green}   RGB 23 201 75     CMYK approx 89 0 63 21
Ink    (line + name)   ${COLOR.ink}   RGB 20 33 27      CMYK approx 39 0 18 87
Navy   (dark tile/bg)  ${COLOR.navy}   RGB 11 18 32      CMYK approx 66 44 0 87

On dark backgrounds the line and the name are white; the three dots keep their colours.
One-colour versions (black or white) are for stamps, embroidery, fax-like printing and
places where colour isn't possible.

TYPEFACE
Satoshi by Indian Type Foundry, the website's heading font (free from fontshare.com/fonts/satoshi)
  "GHL"        Bold (700), letter-spacing -1.5%
  "Megaminds"  Black (900), letter-spacing -2.5%
`);

// ---------- PDFs (vector, via headless Chrome) ----------
{
  const port = 9200 + Math.floor(Math.random() * 90);
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/claude-501/kit-${port}`, 'about:blank'], { stdio: 'ignore' });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let list;
  for (let i = 0; i < 40; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (list.length) break; } catch {} await sleep(250); }
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.enable');
  for (const [rel, s] of files) {
    const w = widthOf(s), h = Number(s.match(/viewBox="0 0 [\d.]+ ([\d.]+)/)[1]);
    const scale = w > 400 ? 1 : 8; // small marks get a bigger page; it's vector either way
    const pw = w * scale, ph = h * scale;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${pw}px ${ph}px;margin:0}html,body{margin:0;padding:0}svg{display:block;width:${pw}px;height:${ph}px}</style></head><body>${s.replace(/^<\?xml[^>]*>\n/, '').replace(/width="[\d.]+" height="[\d.]+"/, '')}</body></html>`;
    await send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
    await sleep(250);
    const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 });
    write(rel, Buffer.from(pdf.result.data, 'base64'));
  }
  chrome.kill('SIGKILL');
}

rmSync(fontTmp, { recursive: true, force: true });

// README
write('README.txt', `GHL MEGAMINDS · LOGO KIT ("Workflow" mark)

The mark: three steps of an automation (trigger, action, result) linked by a rising line,
in yellow, blue and green, next to the name GHL Megaminds.

FOLDERS
00 Editable source   Live-text SVGs (retype or change the name) and the master sheet with
                     every version on one artboard, in named layers. Opens in Figma,
                     Illustrator, Inkscape, Affinity. Install Satoshi first (see below).
                     GHL-Megaminds-logo-master.pdf is the same sheet fully outlined.
01 Logo - horizontal Main logo. SVG (vector), PDF (vector), PNG (transparent, 2400 px).
02 Logo - stacked    Icon above the name, for square spaces. SVG, PDF, PNG (1400 px).
03 Icon              The mark alone. SVG, PDF, PNG (1024 px).
04 App icon          Rounded tile, navy or white. SVG, PDF, PNG 1024/512/192/180, plus a
                     full-square 1024 for app stores (they round the corners themselves).
05 Favicon           favicon.svg, favicon.ico (16/32/48), PNG 16/32/48, apple-touch-icon,
                     android-chrome 192/512.
06 Social avatar     Square navy avatar, the mark inside the circle-safe area. 400/800/1080.
07 Brand             Colour codes and typeface details.

VERSIONS (in every logo folder)
  color          full colour for light backgrounds (dark line and name)
  color-on-dark  full colour for dark backgrounds (white line and name)
  black / white  one colour, for single-colour printing

WHICH FILE?
  Website, slides, documents: SVG (or PNG if the tool can't take SVG)
  Print, signage, merch:      PDF or SVG
  Editing the logo:           00 Editable source (live text) or the PDFs in Illustrator

The name in the normal SVG/PDF/PNG files is converted to outlines, so it looks exactly right
without any font installed. In the EDITABLE files the name is live text: install Satoshi
first (free for personal and commercial use from https://www.fontshare.com/fonts/satoshi).
"GHL" is Satoshi Bold and "Megaminds" is Satoshi Black. Keep clear
space around the logo of at least the height of the blue dot on every side, and don't
recolour, stretch or rotate it.
`);

// Zip
rmSync(`${OUT}.zip`, { force: true });
spawnSync('zip', ['-rq', '-X', `${OUT}.zip`, NAME, '-x', '*.DS_Store'], { cwd: path.join(root, 'review'), stdio: 'inherit' });
console.log('kit:', OUT, `(${files.length} PDFs)`);
