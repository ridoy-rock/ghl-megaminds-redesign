// GHL Megaminds logo builder: icon concepts on a 64-unit grid + the name outlined from Bricolage Grotesque.
// usage: node scripts/build-logo.mjs [concepts]   (no arg = build the final brand files into brand/)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const fontkit = require('fontkit');
const sharp = require('sharp');
const root = fileURLToPath(new URL('..', import.meta.url));

const C = { ink: '#14211b', pine: '#12271e', canvas: '#f4f2ec', sun: '#f3bd33', forest: '#1f4a37', sage: '#dce8da' };

// ---------- Icon concepts (64 x 64) ----------
// A: "M" of two rising peaks + gold spark (also reads as a person with arms raised).
const peaks = (color, join = 'round') =>
  `<path d="M11 50 L22 20 L32 36 L42 20 L53 50" fill="none" stroke="${color}" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="${join}"/>`;
const spark = (color = C.sun) => `<circle cx="32" cy="10" r="5.6" fill="${color}"/>`;

// The chosen mark (T13 Rising dots, 6 Oct 2026): three dots in HighLevel yellow, blue and green that grow as they climb.
export const DOTS = { y: '#FFC800', b: '#2896FB', g: '#17C94B' };
const dots = () =>
  `<circle cx="13" cy="50" r="7" fill="${DOTS.y}"/><circle cx="29.5" cy="35" r="9.5" fill="${DOTS.b}"/><circle cx="48" cy="17" r="12" fill="${DOTS.g}"/>`;

export const icons = {
  dots,
  // The dots on a dark rounded tile (app icon, favicon, avatars).
  dotsTile: (bg = C.pine) => `<rect width="64" height="64" rx="16" fill="${bg}"/><g transform="translate(32 32) scale(0.72) translate(-32 -32)">${dots()}</g>`,
  peaksRound: (fg = C.ink) => peaks(fg, 'round') + spark(),
  peaksSharp: (fg = C.ink) => peaks(fg, 'miter') + spark(),
  // Same mark inside a squircle badge (favicon / app icon / avatar).
  badge: (bg = C.pine, fg = C.canvas) =>
    `<rect width="64" height="64" rx="16" fill="${bg}"/><g transform="translate(32 33) scale(0.74) translate(-32 -32)">${peaks(fg, 'round')}${spark()}</g>`,
  // B: a mind (sphere) with an orbit of systems, echoing the hero illustration.
  orbit: (fg = C.ink) =>
    `<g transform="rotate(-18 32 33)"><ellipse cx="32" cy="33" rx="27" ry="9.5" fill="none" stroke="${C.sun}" stroke-width="3.6"/></g>` +
    `<circle cx="32" cy="33" r="14.5" fill="${fg}"/>` +
    `<g transform="rotate(-18 32 33)"><path d="M5 33 A27 9.5 0 0 0 59 33" fill="none" stroke="${C.sun}" stroke-width="3.6"/></g>` +
    `<circle cx="56.2" cy="25.4" r="4.4" fill="${fg}"/>`,
  // C: two arches (an "m", two brain hemispheres) + spark.
  arches: (fg = C.ink) =>
    `<path d="M12 52 V31 a10 10 0 0 1 20 0 V52 M32 52 V31 a10 10 0 0 1 20 0 V52" fill="none" stroke="${fg}" stroke-width="8.5" stroke-linecap="round"/>` +
    `<circle cx="52" cy="13" r="5.5" fill="${C.sun}"/>`,
};

// ---------- Wordmark ----------
const fonts = {
  800: fontkit.openSync(`${root}node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2`),
  500: fontkit.openSync(`${root}node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-500-normal.woff2`),
  600: fontkit.openSync(`${root}node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff2`),
};

// Returns { d, width } for text set at fontSize px, baseline at y = 0, tracking in em.
const textPath = (text, weight, fontSize, tracking = -0.02) => {
  const font = fonts[weight];
  const scale = fontSize / font.unitsPerEm;
  const run = font.layout(text);
  let x = 0;
  const parts = [];
  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i];
    const d = glyph.path
      .scale(scale, -scale)
      .translate(x + pos.xOffset * scale, -pos.yOffset * scale)
      .toSVG();
    if (d) parts.push(d);
    x += pos.xAdvance * scale + tracking * fontSize;
  });
  return { d: parts.join(''), width: x - tracking * fontSize, capHeight: font.capHeight * scale };
};

// Horizontal lockup: icon + "GHL" (lighter) + "Megaminds" (ExtraBold). badge = [squircle, mark] colours for icon 'badge'.
export const lockup = ({ icon = 'peaksRound', fg = C.ink, ghlColor = fg, size = 64, iconFg, badge = [C.pine, C.canvas] } = {}) => {
  const fontSize = size * 0.58;
  const ghl = textPath('GHL', 600, fontSize, -0.004);
  const mega = textPath('Megaminds', 800, fontSize, -0.012);
  const gap = size * 0.3;
  const wordGap = fontSize * 0.26;
  const baseline = size / 2 + mega.capHeight / 2; // optically centre the caps on the icon
  const x0 = size + gap;
  const width = Math.ceil(x0 + ghl.width + wordGap + mega.width + 2);
  const iconMarkup = icon === 'badge' ? icons.badge(...badge) : icons[icon](iconFg ?? fg);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${size}" width="${width}" height="${size}" role="img" aria-label="GHL Megaminds">
  <g transform="scale(${size / 64})">${iconMarkup}</g>
  <path transform="translate(${x0} ${baseline})" d="${ghl.d}" fill="${ghlColor}"/>
  <path transform="translate(${x0 + ghl.width + wordGap} ${baseline})" d="${mega.d}" fill="${fg}"/>
</svg>`;
  return { svg, width, height: size };
};

const iconSvg = (markup, px = 64) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}">${markup}</svg>`;

const png = (svg, density = 72) => sharp(Buffer.from(svg), { density }).png().toBuffer();

// ---------- Concept sheet ----------
const conceptSheet = async () => {
  const names = ['peaksRound', 'peaksSharp', 'badge', 'orbit', 'arches'];
  const tiles = [];
  for (const [i, name] of names.entries()) {
    const light = await png(iconSvg(name === 'badge' ? icons.badge() : icons[name](C.ink), 220));
    const dark = await png(iconSvg(name === 'badge' ? icons.badge(C.canvas, C.ink) : icons[name](C.canvas), 220));
    const tiny = await png(iconSvg(name === 'badge' ? icons.badge() : icons[name](C.ink), 32), 72);
    const fav = await png(iconSvg(name === 'badge' ? icons.badge() : icons[name](C.ink), 16), 72);
    tiles.push({ input: await sharp({ create: { width: 260, height: 260, channels: 3, background: C.canvas } }).composite([{ input: light, left: 20, top: 20 }]).png().toBuffer(), left: i * 270, top: 0 });
    tiles.push({ input: await sharp({ create: { width: 260, height: 260, channels: 3, background: C.pine } }).composite([{ input: dark, left: 20, top: 20 }]).png().toBuffer(), left: i * 270, top: 270 });
    tiles.push({ input: await sharp({ create: { width: 260, height: 70, channels: 3, background: '#ffffff' } }).composite([{ input: tiny, left: 80, top: 19 }, { input: fav, left: 160, top: 27 }]).png().toBuffer(), left: i * 270, top: 540 });
  }
  const out = `${root}.captures/logo-concepts.png`;
  mkdirSync(`${root}.captures`, { recursive: true });
  await sharp({ create: { width: names.length * 270 - 10, height: 610, channels: 3, background: '#999999' } }).composite(tiles).png().toFile(out);
  // Lockups for the two strongest directions
  const lockTiles = [];
  for (const [i, opts] of [{ icon: 'peaksRound' }, { icon: 'badge' }, { icon: 'orbit' }].entries()) {
    const l = lockup({ ...opts, size: 96 });
    lockTiles.push({ input: await sharp({ create: { width: 900, height: 160, channels: 3, background: C.canvas } }).composite([{ input: await png(l.svg), left: 40, top: 32 }]).png().toBuffer(), left: 0, top: i * 170 });
  }
  await sharp({ create: { width: 900, height: 3 * 170 - 10, channels: 3, background: '#999999' } }).composite(lockTiles).png().toFile(`${root}.captures/logo-lockups.png`);
  console.log('concept sheets written to .captures/');
};

if (process.argv[2] === 'concepts') await conceptSheet();

// ---------- Final brand files ----------
const build = async () => {
  const dir = `${root}brand`;
  mkdirSync(dir, { recursive: true });
  const write = (name, svg) => writeFileSync(`${dir}/${name}`, svg.trim() + '\n');

  // Primary logo = the rising dots + name. The dots keep their colours on light and dark; only the name changes.
  const main = lockup({ icon: 'dots', fg: C.ink, size: 64 });
  const light = lockup({ icon: 'dots', fg: C.canvas, size: 64 });
  write('ghl-megaminds-logo.svg', main.svg);
  write('ghl-megaminds-logo-light.svg', light.svg);
  write('ghl-megaminds-mark.svg', iconSvg(icons.dots()));
  write('ghl-megaminds-app-icon.svg', iconSvg(icons.dotsTile()));
  // Site favicons: pine tile for the homepage, navy tile for the blue /v2 page.
  writeFileSync(`${root}public/favicon.svg`, iconSvg(icons.dotsTile()) + '\n');
  writeFileSync(`${root}public/favicon-blue.svg`, iconSvg(icons.dotsTile('#0f1d38')) + '\n');
  await sharp(Buffer.from(iconSvg(icons.dotsTile())), { density: (72 * 180) / 64 }).png().toFile(`${root}public/apple-touch-icon.png`);

  // PNG exports
  const big = (l, w) => sharp(Buffer.from(l.svg), { density: (72 * w) / l.width }).png();
  await big(main, 2000).toFile(`${dir}/ghl-megaminds-logo.png`);
  await big(light, 2000).toFile(`${dir}/ghl-megaminds-logo-light.png`);
  for (const px of [1024, 512, 180, 32]) {
    await sharp(Buffer.from(iconSvg(icons.dotsTile())), { density: (72 * px) / 64 }).png().toFile(`${dir}/ghl-megaminds-app-icon-${px}.png`);
  }

  // Brand preview board
  const W = 1600;
  const panel = async (bg, l, h = 300) => {
    const img = await sharp(Buffer.from(l.svg), { density: (72 * 900) / l.width }).png().toBuffer();
    const m = await sharp(img).metadata();
    return sharp({ create: { width: W, height: h, channels: 3, background: bg } }).composite([{ input: img, left: Math.round((W - m.width) / 2), top: Math.round((h - m.height) / 2) }]).png().toBuffer();
  };
  const icon = async (markup, px, bg) => {
    const img = await sharp(Buffer.from(iconSvg(markup, px)), { density: 72 }).png().toBuffer();
    return sharp({ create: { width: px + 80, height: px + 80, channels: 3, background: bg } }).composite([{ input: img, left: 40, top: 40 }]).png().toBuffer();
  };
  const row = [
    { input: await icon(icons.dotsTile(), 200, C.canvas), left: 60, top: 40 },
    { input: await icon(icons.dots(), 200, C.canvas), left: 400, top: 40 },
    { input: await icon(icons.dots(), 200, C.pine), left: 740, top: 40 },
    { input: await icon(icons.dotsTile(), 64, '#ffffff'), left: 1090, top: 108 },
    { input: await icon(icons.dotsTile(), 32, '#ffffff'), left: 1250, top: 124 },
    { input: await icon(icons.dotsTile(), 16, '#ffffff'), left: 1380, top: 132 },
  ];
  const iconsRow = await sharp({ create: { width: W, height: 360, channels: 3, background: '#ece9e1' } }).composite(row).png().toBuffer();
  const swatches = await sharp({ create: { width: W, height: 140, channels: 3, background: '#ece9e1' } })
    .composite(await Promise.all([C.ink, C.pine, DOTS.y, DOTS.b, DOTS.g].map(async (hex, i) => ({
      input: await sharp({ create: { width: 260, height: 80, channels: 3, background: hex } }).png().toBuffer(), left: 60 + i * 300, top: 30,
    })))).png().toBuffer();
  await sharp({ create: { width: W, height: 300 + 300 + 360 + 140, channels: 3, background: '#ece9e1' } })
    .composite([
      { input: await panel(C.canvas, main), left: 0, top: 0 },
      { input: await panel(C.pine, light), left: 0, top: 300 },
      { input: iconsRow, left: 0, top: 600 },
      { input: swatches, left: 0, top: 960 },
    ])
    .png().toFile(`${root}docs/brand-preview.png`);
  console.log('brand files written to brand/, preview at docs/brand-preview.png');
};

if (!process.argv[2]) await build();

// ---------- More options (comparison board) ----------
fonts[700] = fontkit.openSync(`${root}node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2`);

const optionIcons = {
  // B: M whose right half becomes a gold check mark: certified, done for you.
  certified: (fg) =>
    `<path d="M8 50 L18 20 L27 36 L36 20 L46 50" fill="none" stroke="${fg}" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="51" cy="13" r="9" fill="${C.sun}"/>` +
    `<path d="M46.6 13.2 L49.6 16.2 L55.4 9.8" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  // C: M drawn as a node network: automations, workflows, engineering.
  network: (fg) =>
    `<path d="M12 50 L22 18 L32 37 L42 18 L52 50" fill="none" stroke="${fg}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    [[12, 50], [22, 18], [42, 18], [52, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${fg}"/>`).join('') +
    `<circle cx="32" cy="37" r="7.5" fill="${C.sun}"/>`,
  // D: speech bubble holding the mark: white-label support.
  bubble: () =>
    `<path d="M20 6 H44 A14 14 0 0 1 58 20 V36 A14 14 0 0 1 44 50 H24 L12 59 L14 48.5 A14 14 0 0 1 6 36 V20 A14 14 0 0 1 20 6 Z" fill="${C.sun}"/>` +
    `<path d="M19 38 L25.5 19 L32 30 L38.5 19 L45 38" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  // E: rising steps with a gold sphere on top: growth, same language as the site's illustrations.
  steps: (fg) =>
    `<path d="M6 56 V44 A4 4 0 0 1 10 40 H20 V32 A4 4 0 0 1 24 28 H34 V20 A4 4 0 0 1 38 16 H54 A4 4 0 0 1 58 20 V56 Z" fill="${fg}"/>` +
    `<circle cx="46" cy="8" r="6.5" fill="${C.sun}"/>`,
  // F: shield holding the mark: trusted, certified, behind your brand.
  shield: () =>
    `<path d="M32 3 L55 11 V30 C55 45 45 55 32 61 C19 55 9 45 9 30 V11 Z" fill="${C.sun}"/>` +
    `<path d="M20 41 L26 22 L32 33 L38 22 L44 41" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  // G: light bulb with an M filament: ideas, "mega minds".
  bulb: (fg) =>
    `<path d="M32 4 A20 20 0 0 1 44 40 V44 A3 3 0 0 1 41 47 H23 A3 3 0 0 1 20 44 V40 A20 20 0 0 1 32 4 Z" fill="${fg}"/>` +
    `<rect x="22" y="50" width="20" height="5" rx="2.5" fill="${fg}"/><rect x="26" y="57.5" width="12" height="4.5" rx="2.25" fill="${fg}"/>` +
    `<path d="M22 34 L27 18 L32 28 L37 18 L42 34" fill="none" stroke="${C.sun}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// Wordmark styles. Each returns svg markup positioned with its left edge at x and the icon centred at size/2.
const wordStyles = {
  simple: (fg, size, x) => {
    const fs = size * 0.56, t = textPath('GHL Megaminds', 700, fs, -0.01), base = size / 2 + t.capHeight / 2;
    return { width: t.width, svg: `<path transform="translate(${x} ${base})" d="${t.d}" fill="${fg}"/>` };
  },
  current: (fg, size, x) => {
    const fs = size * 0.58, a = textPath('GHL', 600, fs, -0.004), b = textPath('Megaminds', 800, fs, -0.012), base = size / 2 + b.capHeight / 2;
    return { width: a.width + fs * 0.26 + b.width, svg: `<path transform="translate(${x} ${base})" d="${a.d}" fill="${fg}"/><path transform="translate(${x + a.width + fs * 0.26} ${base})" d="${b.d}" fill="${fg}"/>` };
  },
  bold: (fg, size, x) => {
    const fs = size * 0.56, t = textPath('GHL Megaminds', 700, fs, -0.01), base = size / 2 + t.capHeight / 2;
    return { width: t.width, svg: `<path transform="translate(${x} ${base})" d="${t.d}" fill="${fg}"/>` };
  },
  lower: (fg, size, x) => {
    const fs = size * 0.62, a = textPath('ghl', 700, fs, -0.01), b = textPath('megaminds', 700, fs, -0.015), xh = fs * 0.5, base = size / 2 + xh / 2;
    return { width: a.width + fs * 0.24 + b.width, svg: `<path transform="translate(${x} ${base})" d="${a.d}" fill="${fg === C.ink ? C.forest : C.sun}"/><path transform="translate(${x + a.width + fs * 0.24} ${base})" d="${b.d}" fill="${fg}"/>` };
  },
  stacked: (fg, size, x) => {
    const small = textPath('GHL', 600, size * 0.2, 0.2), big = textPath('Megaminds', 800, size * 0.52, -0.012);
    const top = size * 0.5 - (small.capHeight + size * 0.09 + big.capHeight) / 2;
    return { width: Math.max(small.width, big.width), svg: `<path transform="translate(${x + 2} ${top + small.capHeight})" d="${small.d}" fill="${fg === C.ink ? C.forest : C.sun}"/><path transform="translate(${x} ${top + small.capHeight + size * 0.09 + big.capHeight})" d="${big.d}" fill="${fg}"/>` };
  },
  upper: (fg, size, x) => {
    const fs = size * 0.46, t = textPath('GHL MEGAMINDS', 700, fs, 0.03), base = size / 2 + t.capHeight / 2;
    return { width: t.width, svg: `<path transform="translate(${x} ${base})" d="${t.d}" fill="${fg}"/>` };
  },
  tag: (fg, size, x) => {
    const fs = size * 0.56, b = textPath('Megaminds', 800, fs, -0.012), g = textPath('GHL', 700, fs * 0.5, 0.06), base = size / 2 + b.capHeight / 2;
    const padX = fs * 0.22, tagH = g.capHeight + fs * 0.32, tagW = g.width + padX * 2, tagY = size / 2 - tagH / 2;
    return { width: tagW + fs * 0.24 + b.width, svg: `<rect x="${x}" y="${tagY}" width="${tagW}" height="${tagH}" rx="${tagH / 2}" fill="${C.sun}"/><path transform="translate(${x + padX} ${size / 2 + g.capHeight / 2})" d="${g.d}" fill="${C.ink}"/><path transform="translate(${x + tagW + fs * 0.24} ${base})" d="${b.d}" fill="${fg}"/>` };
  },
  accent: (fg, size, x) => {
    const fs = size * 0.58, a = textPath('GHL', 800, fs, -0.012), b = textPath('Megaminds', 800, fs, -0.012), base = size / 2 + b.capHeight / 2;
    return { width: a.width + fs * 0.24 + b.width, svg: `<path transform="translate(${x} ${base})" d="${a.d}" fill="${fg === C.ink ? C.forest : C.sun}"/><path transform="translate(${x + a.width + fs * 0.24} ${base})" d="${b.d}" fill="${fg}"/>` };
  },
};

const optionList = [
  { id: 'A', name: 'Rising peaks (current)', idea: 'An M of two rising peaks with a gold spark: level up, minds, and a person with arms raised.', icon: (fg) => icons.peaksRound(fg), word: 'simple' },
  { id: 'B', name: 'Certified M', idea: 'The M with a gold verified tick: certified HighLevel admins, work you can trust.', icon: optionIcons.certified, word: 'simple' },
  { id: 'C', name: 'Network M', idea: 'The M drawn as a connected workflow, with a gold hub: automations and engineering.', icon: optionIcons.network, word: 'simple' },
  { id: 'D', name: 'Support bubble', idea: 'A gold speech bubble with an M: white-label support your clients can talk to.', icon: optionIcons.bubble, word: 'simple' },
  { id: 'E', name: 'Level-up steps', idea: 'Rising steps with a gold sphere on top: growth, matching the site illustrations.', icon: optionIcons.steps, word: 'simple' },
  { id: 'F', name: 'Shield', idea: 'A gold shield with an M: trusted, certified, working behind your brand.', icon: optionIcons.shield, word: 'simple' },
  { id: 'G', name: 'Idea bulb', idea: 'A light bulb with an M filament: ideas, the "mega minds" behind your agency.', icon: optionIcons.bulb, word: 'simple' },
];

const optionLockup = (opt, fg, size = 64) => {
  // Word-only options (icon returns '') start the name at the left edge.
  const gap = size * 0.3, x0 = opt.icon(fg) ? size + gap : 0;
  const w = wordStyles[opt.word](fg, size, x0);
  const width = Math.ceil(x0 + w.width + 2);
  return { width, height: size, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${size}" width="${width}" height="${size}" role="img" aria-label="GHL Megaminds"><g transform="scale(${size / 64})">${opt.icon(fg)}</g>${w.svg}</svg>` };
};

const optionsBoard = async () => {
  const dir = `${root}brand/options`;
  mkdirSync(dir, { recursive: true });
  mkdirSync(`${root}.captures`, { recursive: true });
  const b64 = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const cards = optionList.map((opt) => {
    const light = optionLockup(opt, C.ink), dark = optionLockup(opt, C.canvas);
    const iconOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${opt.icon(C.ink)}</svg>`;
    writeFileSync(`${dir}/option-${opt.id}-logo.svg`, light.svg + '\n');
    writeFileSync(`${dir}/option-${opt.id}-logo-light.svg`, dark.svg + '\n');
    writeFileSync(`${dir}/option-${opt.id}-icon.svg`, iconOnly + '\n');
    return `<article class="card">
      <header><span class="id">${opt.id}</span><div><h2>${opt.name}</h2><p>${opt.idea}</p></div></header>
      <div class="light"><img src="${b64(light.svg)}" style="height:84px"></div>
      <div class="row"><div class="dark"><img src="${b64(dark.svg)}" style="height:52px"></div>
      <div class="sizes"><img src="${b64(iconOnly)}" style="height:48px"><img src="${b64(iconOnly)}" style="height:32px"><img src="${b64(iconOnly)}" style="height:16px"></div></div>
    </article>`;
  }).join('');
  const font = (p) => readFileSync(p).toString('base64');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2`)}) format('woff2');font-weight:200 800}
@font-face{font-family:B;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2`)}) format('woff2');font-weight:300 900}
body{margin:0;background:#e9e6dd;font-family:B;color:#14211b;width:1600px}
h1{font:800 44px D;letter-spacing:-.03em;margin:0;padding:56px 56px 8px}
.sub{margin:0 56px 32px;font-size:18px;color:#4f5b55}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:0 56px 56px}
.card{background:#fbfaf7;border-radius:24px;padding:24px;box-shadow:inset 0 0 0 1px rgba(20,33,27,.08)}
.card:first-child{grid-column:1 / -1}
header{display:flex;gap:16px;align-items:flex-start;margin-bottom:18px}
.id{flex:none;width:40px;height:40px;border-radius:12px;background:#14211b;color:#f4f2ec;display:grid;place-items:center;font:800 20px D}
h2{margin:0;font:700 24px D;letter-spacing:-.02em}
header p{margin:4px 0 0;font-size:16px;line-height:1.45;color:#4f5b55}
.light{background:#f4f2ec;border-radius:16px;height:180px;display:grid;place-items:center}
.row{display:grid;grid-template-columns:1fr 200px;gap:12px;margin-top:12px}
.dark{background:#12271e;border-radius:16px;height:110px;display:grid;place-items:center}
.sizes{background:#fff;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:18px}
</style></head><body><h1>GHL Megaminds: logo options</h1><p class="sub">Same simple wordmark on every option, so you can compare the icons. Shown on light and dark, plus the icon at 48, 32 and 16px.</p><div class="grid">${cards}</div></body></html>`;
  const htmlPath = `${root}.captures/logo-options.html`;
  writeFileSync(htmlPath, html);
  console.log('board html written', htmlPath);
};

if (process.argv[2] === 'options') await optionsBoard();

// ---------- Finalists page (A + E) ----------
const appIconFor = (markup) => `<rect width="64" height="64" rx="16" fill="${C.pine}"/><g transform="translate(32 33) scale(0.74) translate(-32 -32)">${markup}</g>`;
const finalists = [
  { id: 'A', name: 'Rising peaks', idea: 'An M made of two rising peaks with a gold spark above the middle. It reads as the M of Megaminds, as growth (levelling up), and as a person with arms raised: the happy client.', icon: (fg) => icons.peaksRound(fg), word: 'current' },
  { id: 'E', name: 'Level-up steps', idea: 'Three rising steps with a gold sphere on the top step: agencies climbing to the next level with GHL Megaminds. It matches the clay illustrations used on the site.', icon: optionIcons.steps, word: 'upper' },
];

const finalistsPage = async () => {
  const dir = `${root}brand/finalists`;
  mkdirSync(dir, { recursive: true });
  const b64 = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const icon = (markup) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${markup}</svg>`;
  const sections = finalists.map((opt) => {
    const light = optionLockup(opt, C.ink), dark = optionLockup(opt, C.canvas);
    const iconInk = icon(opt.icon(C.ink)), iconLight = icon(opt.icon(C.canvas)), app = icon(appIconFor(opt.icon(C.canvas)));
    writeFileSync(`${dir}/option-${opt.id}-logo.svg`, light.svg + '\n');
    writeFileSync(`${dir}/option-${opt.id}-logo-light.svg`, dark.svg + '\n');
    writeFileSync(`${dir}/option-${opt.id}-icon.svg`, iconInk + '\n');
    writeFileSync(`${dir}/option-${opt.id}-app-icon.svg`, app + '\n');
    return `<section>
      <div class="head"><span class="id">${opt.id}</span><div><h2>${opt.name}</h2><p>${opt.idea}</p></div></div>
      <div class="hero light"><img src="${b64(light.svg)}" style="width:78%"></div>
      <div class="two">
        <div class="tile dark"><img src="${b64(dark.svg)}" style="width:76%"></div>
        <div class="tile gold"><img src="${b64(light.svg)}" style="width:76%"></div>
      </div>
      <div class="four">
        <div class="tile light sq"><img src="${b64(iconInk)}" style="height:96px"><span>Icon</span></div>
        <div class="tile dark sq"><img src="${b64(iconLight)}" style="height:96px"><span>Icon on dark</span></div>
        <div class="tile white sq"><img src="${b64(app)}" style="height:96px;border-radius:22px;box-shadow:0 18px 40px -18px rgba(18,39,30,.6)"><span>App icon</span></div>
        <div class="tile white sq sizes"><div><img src="${b64(app)}" style="height:48px"><img src="${b64(app)}" style="height:32px"><img src="${b64(app)}" style="height:16px"></div><span>Favicon 48 / 32 / 16</span></div>
      </div>
      <div class="mock">
        <div class="bar"><img src="${b64(light.svg)}" style="height:28px"><nav><i>Services</i><i>How we work</i><i>Projects</i><i>Team</i></nav><b>Book a discovery call</b></div>
        <div class="tab"><img src="${b64(app)}" style="height:16px"><span>GHL Megaminds | White-label HighLevel support</span></div>
      </div>
    </section>`;
  }).join('');
  const font = (p) => readFileSync(p).toString('base64');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2`)}) format('woff2');font-weight:200 800}
@font-face{font-family:B;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2`)}) format('woff2');font-weight:300 900}
body{margin:0;background:#e9e6dd;font-family:B;color:#14211b;width:1600px}
h1{font:800 48px D;letter-spacing:-.03em;margin:0;padding:64px 64px 10px}
.sub{margin:0 64px 40px;font-size:19px;color:#4f5b55}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;padding:0 64px 64px}
section{background:#fbfaf7;border-radius:28px;padding:28px;box-shadow:inset 0 0 0 1px rgba(20,33,27,.08);display:grid;gap:14px}
.head{display:flex;gap:16px;align-items:flex-start;margin-bottom:6px}
.id{flex:none;width:44px;height:44px;border-radius:13px;background:#14211b;color:#f4f2ec;display:grid;place-items:center;font:800 22px D}
h2{margin:0;font:700 28px D;letter-spacing:-.02em}
.head p{margin:6px 0 0;font-size:16px;line-height:1.5;color:#4f5b55}
.hero{height:230px;border-radius:18px;display:grid;place-items:center}
.two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}
.four{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.tile{border-radius:18px;height:130px;display:grid;place-items:center;position:relative}
.sq{height:190px;align-content:center;gap:10px}
.sq span{font-size:13px;color:#4f5b55;font-weight:600}
.dark.sq span{color:rgba(244,242,236,.7)}
.sizes div{display:flex;align-items:center;gap:14px}
.light{background:#f4f2ec}.dark{background:#12271e}.gold{background:#f6e7b4}.white{background:#fff;box-shadow:inset 0 0 0 1px rgba(20,33,27,.06)}
.mock{border-radius:18px;background:#f4f2ec;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(20,33,27,.08)}
.bar{display:flex;align-items:center;gap:18px;padding:18px 20px;border-bottom:1px solid rgba(20,33,27,.08)}
.bar nav{display:flex;gap:12px;margin-left:auto;font-size:12px;color:#4f5b55;white-space:nowrap}.bar nav i{font-style:normal}
.bar b{background:#14211b;color:#f4f2ec;font-size:12px;padding:9px 14px;border-radius:999px;white-space:nowrap}
.tab{display:flex;align-items:center;gap:8px;margin:12px 20px 14px;padding:8px 12px;background:#fff;border-radius:10px 10px 0 0;width:max-content;font-size:12px;color:#4f5b55;box-shadow:0 1px 0 rgba(20,33,27,.06)}
</style></head><body><h1>GHL Megaminds: the two finalists</h1><p class="sub">Option A and option E side by side: on light, dark and gold, as an icon, as an app icon and favicon, and in a website header.</p><div class="grid">${sections}</div></body></html>`;
  writeFileSync(`${root}.captures/logo-finalists.html`, html);
  console.log('finalists page written');
};

if (process.argv[2] === 'finalists') await finalistsPage();

// ---------- Tri-colour round (HighLevel ecosystem colours) ----------
// The HighLevel family (HighLevel, Extendly, HL Pro Tools, GHL Support) all use yellow / blue / green rising shapes.
// These marks use the same three colours in shapes of our own.
const T = { y: '#FFC800', b: '#2896FB', g: '#17C94B', navy: '#0b1220' };
const stroke = (d, color, w = 9.5) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const arrowHead = (x1, y1, x2, y2, size, color) => {
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, px = -uy, py = ux;
  const tip = [x2 + ux * size * 0.9, y2 + uy * size * 0.9];
  const a = [x2 - ux * size * 0.35 + px * size, y2 - uy * size * 0.35 + py * size];
  const b = [x2 - ux * size * 0.35 - px * size, y2 - uy * size * 0.35 - py * size];
  return `<path d="M${a.join(' ')} L${tip.join(' ')} L${b.join(' ')} Z" fill="${color}" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`;
};

const triIcons = {
  // T1: the current rising-peaks M, one colour per stroke.
  peaks: (fg) => stroke('M11 50 L22 20', T.y) + stroke('M42 20 L53 50', T.g) + stroke('M22 20 L32 36 L42 20', T.b) + `<circle cx="32" cy="9.5" r="5.4" fill="${fg}"/>`,
  // T2: a growth line that zigzags up and ends in an arrow: levelling up.
  growth: () => stroke('M8 52 L19 22', T.y, 8.5) + stroke('M19 22 L31 40', T.b, 8.5) + stroke('M31 40 L45 18', T.g, 8.5) + arrowHead(31, 40, 45, 18, 9, T.g),
  // T3: three rising steps, one per colour, with a dot (the mind) on top.
  steps: (fg) =>
    `<rect x="7" y="38" width="15" height="18" rx="4.5" fill="${T.y}"/><rect x="24.5" y="26" width="15" height="30" rx="4.5" fill="${T.b}"/>` +
    `<rect x="42" y="14" width="15" height="42" rx="4.5" fill="${T.g}"/><circle cx="49.5" cy="6.5" r="5" fill="${fg}"/>`,
  // T4: three linked rings: minds working together.
  rings: () =>
    `<circle cx="22" cy="25" r="12.5" fill="none" stroke="${T.y}" stroke-width="6"/><circle cx="42" cy="25" r="12.5" fill="none" stroke="${T.b}" stroke-width="6"/>` +
    `<circle cx="32" cy="42" r="12.5" fill="none" stroke="${T.g}" stroke-width="6"/>`,
  // T5: three stacked chevrons pointing up: the next level, then the next.
  chevrons: () => stroke('M14 54 L32 41 L50 54', T.y, 8) + stroke('M14 39 L32 26 L50 39', T.b, 8) + stroke('M14 24 L32 11 L50 24', T.g, 8),
  // T6: a chunky block M: yellow and green pillars joined by a blue V.
  blockM: () =>
    stroke('M13 16 L32 40 L51 16', T.b, 11) +
    `<rect x="5" y="10" width="14" height="46" rx="5" fill="${T.y}"/><rect x="45" y="10" width="14" height="46" rx="5" fill="${T.g}"/>`,
};

const triList = [
  { id: 'T1', name: 'Tri-colour peaks', idea: 'Your current rising-peaks M, with each stroke in a HighLevel colour. Keeps what you have, joins the HighLevel family.', icon: triIcons.peaks },
  { id: 'T2', name: 'Growth line', idea: 'A growth line that climbs in the three colours and ends in an arrow: GHL Megaminds levels agencies up.', icon: triIcons.growth },
  { id: 'T3', name: 'Level-up steps', idea: 'Three rising steps, one per colour, with a dot (the mind) on top. The colour version of option E.', icon: triIcons.steps },
  { id: 'T4', name: 'Linked minds', idea: 'Three linked rings: certified admins and engineers working as one team with your agency.', icon: triIcons.rings },
  { id: 'T5', name: 'Next level', idea: 'Three stacked chevrons pointing up: the next level, then the next. Simple at every size.', icon: triIcons.chevrons },
  { id: 'T6', name: 'Block M', idea: 'A bold block M: yellow and green pillars joined by a blue V. Reads instantly as the M of Megaminds.', icon: triIcons.blockM },
];

const triBoard = async (list = triList, out = 'logo-tricolor', heading = 'GHL Megaminds: logos in the HighLevel colours') => {
  const dir = `${root}brand/tricolor`;
  mkdirSync(dir, { recursive: true });
  const b64 = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const svg64 = (markup) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${markup}</svg>`;
  const tile = (markup) => svg64(`<rect width="64" height="64" rx="16" fill="${T.navy}"/><g transform="translate(32 32) scale(0.72) translate(-32 -32)">${markup}</g>`);
  const cards = list.map((opt) => {
    const word = opt.word ?? 'current';
    const light = optionLockup({ ...opt, word }, C.ink), dark = optionLockup({ ...opt, word }, '#ffffff');
    const app = opt.app ? svg64(opt.app()) : tile(opt.icon('#ffffff'));
    writeFileSync(`${dir}/option-${opt.id}-logo.svg`, light.svg + '\n');
    writeFileSync(`${dir}/option-${opt.id}-logo-light.svg`, dark.svg + '\n');
    writeFileSync(`${dir}/option-${opt.id}-icon.svg`, svg64(opt.icon(C.ink)) + '\n');
    writeFileSync(`${dir}/option-${opt.id}-app-icon.svg`, app + '\n');
    return `<article class="card">
      <header><span class="id">${opt.id}</span><div><h2>${opt.name}</h2><p>${opt.idea}</p></div></header>
      <div class="light"><img src="${b64(light.svg)}" style="height:80px"></div>
      <div class="row">
        <div class="dark"><img src="${b64(dark.svg)}" style="height:50px"></div>
        <div class="app"><img src="${b64(app)}" style="height:76px;border-radius:19px;box-shadow:0 14px 30px -16px rgba(11,18,32,.7)"></div>
        <div class="sizes"><img src="${b64(app)}" style="height:48px"><img src="${b64(app)}" style="height:32px"><img src="${b64(app)}" style="height:16px"></div>
      </div>
    </article>`;
  }).join('');
  const font = (p) => readFileSync(p).toString('base64');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2`)}) format('woff2');font-weight:200 800}
@font-face{font-family:B;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2`)}) format('woff2');font-weight:300 900}
body{margin:0;background:#e9e6dd;font-family:B;color:#14211b;width:1600px}
h1{font:800 44px D;letter-spacing:-.03em;margin:0;padding:56px 56px 8px}
.sub{margin:0 56px 20px;font-size:18px;color:#4f5b55;max-width:1100px;line-height:1.5}
.ref{margin:0 56px 32px;display:flex;gap:10px;align-items:center;font-size:15px;color:#4f5b55}
.ref i{width:26px;height:26px;border-radius:8px;display:inline-block}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;padding:0 56px 56px}
.card{background:#fbfaf7;border-radius:24px;padding:24px;box-shadow:inset 0 0 0 1px rgba(20,33,27,.08)}
header{display:flex;gap:16px;align-items:flex-start;margin-bottom:18px}
.id{flex:none;width:46px;height:40px;border-radius:12px;background:#14211b;color:#f4f2ec;display:grid;place-items:center;font:800 18px D}
h2{margin:0;font:700 24px D;letter-spacing:-.02em}
header p{margin:4px 0 0;font-size:16px;line-height:1.45;color:#4f5b55}
.light{background:#f4f2ec;border-radius:16px;height:170px;display:grid;place-items:center}
.row{display:grid;grid-template-columns:minmax(0,1fr) 120px 170px;gap:12px;margin-top:12px}
.dark{background:${T.navy};border-radius:16px;height:110px;display:grid;place-items:center}
.app,.sizes{background:#fff;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:16px;box-shadow:inset 0 0 0 1px rgba(20,33,27,.06)}
</style></head><body><h1>${heading}</h1>
<p class="sub">Like HighLevel, Extendly, HL Pro Tools and GHL Support, every option uses HighLevel's yellow, blue and green in a rising shape, with the same simple name beside it. Each is shown on light, on dark navy, as an app icon and at favicon sizes.</p>
<p class="ref"><i style="background:${T.y}"></i>Yellow ${T.y}<i style="background:${T.b}"></i>Blue ${T.b}<i style="background:${T.g}"></i>Green ${T.g}<i style="background:${T.navy}"></i>Navy ${T.navy}</p>
<div class="grid">${cards}</div></body></html>`;
  writeFileSync(`${root}.captures/${out}.html`, html);
  console.log('board written', out);
};

if (process.argv[2] === 'tricolor') await triBoard();

// ---------- Tri-colour round 2: ten more ideas (T7-T16) ----------
const TN = { yd: '#C99700', bd: '#1C58A0', gd: '#0E8A33' }; // darker shades, as HighLevel uses for depth

// Ellipse orbit split into three coloured arcs; the back half is drawn before the sphere, the front half after.
const orbit = (fg) => {
  const cx = 32, cy = 34, rx = 28, ry = 9, rot = (-18 * Math.PI) / 180, colors = [T.y, T.b, T.g];
  const pt = (t) => {
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
  };
  const arc = (a, b) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) pts.push(pt(a + ((b - a) * i) / 24).map((v) => v.toFixed(2)).join(' '));
    return `M${pts.join(' L')}`;
  };
  // Three arcs of 120deg starting at the far left; back = sin(t) < 0 (upper half after rotation).
  const segs = [0, 1, 2].map((i) => [Math.PI + (i * 2 * Math.PI) / 3, Math.PI + ((i + 1) * 2 * Math.PI) / 3]);
  const split = (front) =>
    segs.map(([a, b], i) => {
      const parts = [];
      const lo = front ? 0 : Math.PI, hi = front ? Math.PI : 2 * Math.PI; // front half: t in (0, PI) mod 2PI
      for (const off of [0, 2 * Math.PI, 4 * Math.PI]) {
        const s0 = Math.max(a, lo + off), s1 = Math.min(b, hi + off);
        if (s1 > s0) parts.push(stroke(arc(s0, s1), colors[i], 4.5));
      }
      return parts.join('');
    }).join('');
  return split(false) + `<circle cx="${cx}" cy="${cy}" r="14" fill="${fg}"/>` + split(true);
};

const cubeFaces = (top, left, right) =>
  `<g stroke-linejoin="round" stroke-width="2">` +
  `<path d="M32 6 L54.5 19 L32 32 L9.5 19 Z" fill="${top}" stroke="${top}"/>` +
  `<path d="M9.5 19 L32 32 L32 58 L9.5 45 Z" fill="${left}" stroke="${left}"/>` +
  `<path d="M32 32 L54.5 19 L54.5 45 L32 58 Z" fill="${right}" stroke="${right}"/></g>`;

const triIcons2 = {
  // T7: an M whose pillars are up-arrows: Megaminds + levelling up.
  arrowM: () =>
    stroke('M19 26 L32 44 L45 26', T.b, 9.5) +
    `<g stroke-linejoin="round" stroke-width="2.5"><path d="M8 25 H19 V56 H8 Z M2.5 27 L13.5 8 L24.5 27 Z" fill="${T.y}" stroke="${T.y}"/>` +
    `<path d="M45 25 H56 V56 H45 Z M39.5 27 L50.5 8 L61.5 27 Z" fill="${T.g}" stroke="${T.g}"/></g>`,
  // T8: a workflow: trigger, action, result, rising.
  workflow: (fg) =>
    `<path d="M12 50 C22 50 22 32 32 32 S42 14 52 14" fill="none" stroke="${fg}" stroke-width="4.5" stroke-linecap="round"/>` +
    `<circle cx="12" cy="50" r="8" fill="${T.y}"/><circle cx="32" cy="32" r="8" fill="${T.b}"/><circle cx="52" cy="14" r="8" fill="${T.g}"/>`,
  // T9: three stacked levels (isometric layers).
  layers: () =>
    `<g stroke-linejoin="round" stroke-width="2.5">` +
    [[46, T.y], [34, T.b], [22, T.g]].map(([y, c]) => `<path d="M8 ${y} L32 ${y - 12} L56 ${y} L32 ${y + 12} Z" fill="${c}" stroke="${c}"/>`).join('') + `</g>`,
  // T10: a mind (sphere) with a three-colour orbit, like the hero illustration.
  orbit: (fg) => orbit(fg),
  // T11: a support chat bubble with rising bars inside.
  bubble: (fg) =>
    `<path d="M15 9 H49 A9 9 0 0 1 58 18 V39 A9 9 0 0 1 49 48 H27 L15 57 V48 A9 9 0 0 1 6 39 V18 A9 9 0 0 1 15 9 Z" fill="none" stroke="${fg}" stroke-width="4.5" stroke-linejoin="round"/>` +
    `<rect x="17" y="31" width="7.5" height="9" rx="2.5" fill="${T.y}"/><rect x="28.25" y="25" width="7.5" height="15" rx="2.5" fill="${T.b}"/><rect x="39.5" y="18" width="7.5" height="22" rx="2.5" fill="${T.g}"/>`,
  // T13: three dots growing as they climb.
  dots: () => `<circle cx="13" cy="50" r="7" fill="${T.y}"/><circle cx="29.5" cy="35" r="9.5" fill="${T.b}"/><circle cx="48" cy="17" r="12" fill="${T.g}"/>`,
  // T14: a shield (trusted, certified) with level-up chevrons.
  shield: (fg) =>
    `<path d="M32 5 L54 13 V31 C54 45 44 54 32 59 C20 54 10 45 10 31 V13 Z" fill="none" stroke="${fg}" stroke-width="4.5" stroke-linejoin="round"/>` +
    stroke('M22 45 L32 38 L42 45', T.y, 5.5) + stroke('M22 35 L32 28 L42 35', T.b, 5.5) + stroke('M22 25 L32 18 L42 25', T.g, 5.5),
  // T15: a light bulb (ideas, mega minds) with a rising-bars filament.
  bulb: (fg) =>
    `<path d="M23 41 C15 36 12 28 13.5 21 C15.5 11 23.5 5.5 32 5.5 C40.5 5.5 48.5 11 50.5 21 C52 28 49 36 41 41 V45 H23 Z" fill="none" stroke="${fg}" stroke-width="4.5" stroke-linejoin="round"/>` +
    stroke('M25 51.5 H39', fg, 4.5) + stroke('M28 57.5 H36', fg, 4.5) +
    `<rect x="22.5" y="29" width="5.5" height="8" rx="2" fill="${T.y}"/><rect x="29.25" y="22.5" width="5.5" height="14.5" rx="2" fill="${T.b}"/><rect x="36" y="16" width="5.5" height="21" rx="2" fill="${T.g}"/>`,
  // T16: a cube: building blocks, systems that hold together.
  cube: () => cubeFaces(T.y, T.b, T.g),
};

// T12: the letters G, H and L in the three colours (no separate icon), like a monogram.
const ghlLetters = (size, x, base, weight = 800) => {
  const fs = size * 0.58;
  let cx = x, svg = '';
  for (const [ch, color] of [['G', T.y], ['H', T.b], ['L', T.g]]) {
    const t = textPath(ch, weight, fs, -0.01);
    svg += `<path transform="translate(${cx} ${base})" d="${t.d}" fill="${color}"/>`;
    cx += t.width + fs * 0.02;
  }
  return { svg, width: cx - x };
};
wordStyles.colourGhl = (fg, size, x) => {
  const fs = size * 0.58, mega = textPath('Megaminds', 800, fs, -0.012), base = size / 2 + mega.capHeight / 2;
  const g = ghlLetters(size, x, base);
  return { width: g.width + fs * 0.26 + mega.width, svg: g.svg + `<path transform="translate(${x + g.width + fs * 0.26} ${base})" d="${mega.d}" fill="${fg}"/>` };
};

const triList2 = [
  { id: 'T7', name: 'Arrow M', idea: 'An M whose two pillars are up-arrows, joined by a blue V: the M of Megaminds that also says "level up".', icon: triIcons2.arrowM },
  { id: 'T8', name: 'Workflow', idea: 'Three steps of an automation (trigger, action, result) linked by a rising line: what you build for agencies.', icon: triIcons2.workflow },
  { id: 'T9', name: 'Stacked levels', idea: 'Three stacked layers, yellow to green: each level built on the one below. Calm and very simple.', icon: triIcons2.layers },
  { id: 'T10', name: 'Orbit mind', idea: 'A mind (sphere) with a three-colour orbit, echoing the hero illustration on your homepage.', icon: triIcons2.orbit },
  { id: 'T11', name: 'Support bubble', idea: 'A chat bubble with rising bars inside: support that grows the agency. Says "support" at a glance.', icon: triIcons2.bubble },
  {
    id: 'T12', name: 'Colour GHL', idea: 'No separate icon: the letters G, H and L in the three colours, like GHL Support Services. The app icon is the letters on navy.',
    icon: () => '', word: 'colourGhl',
    app: () => { const g = ghlLetters(64, 0, 0); const t = textPath('GHL', 800, 64 * 0.58, -0.01); const sc = 44 / g.width; return `<rect width="64" height="64" rx="16" fill="${T.navy}"/><g transform="translate(${32 - (g.width * sc) / 2} ${32 + (t.capHeight * sc) / 2}) scale(${sc})">${g.svg}</g>`; },
  },
  { id: 'T13', name: 'Rising dots', idea: 'Three dots that grow as they climb: small agency to big agency. The simplest option here.', icon: triIcons2.dots },
  { id: 'T14', name: 'Certified shield', idea: 'A shield (trusted, certified admins) with three level-up chevrons inside.', icon: triIcons2.shield },
  { id: 'T15', name: 'Idea bulb', idea: 'A light bulb with a rising-bars filament: the "mega minds" behind your agency.', icon: triIcons2.bulb },
  { id: 'T16', name: 'Building block', idea: 'A cube with a face in each colour: solid systems built to hold your agency together.', icon: triIcons2.cube },
];

if (process.argv[2] === 'tricolor2') await triBoard(triList2, 'logo-tricolor-2', 'GHL Megaminds: ten more logos in the HighLevel colours');

// ---------- Professional round (P1-P9) ----------
// Marks on a 100-unit grid with depth (fold shades, gradients) and a Figtree wordmark.
// usage: node scripts/build-logo.mjs pro
fonts.f600 = fontkit.openSync(`${root}node_modules/@fontsource/figtree/files/figtree-latin-600-normal.woff2`);
fonts.f800 = fontkit.openSync(`${root}node_modules/@fontsource/figtree/files/figtree-latin-800-normal.woff2`);

const P = { y: '#FFC700', yd: '#D99A00', b: '#2896FB', bd: '#1A5FC4', g: '#1BC94F', gd: '#0C9136', navy: '#0b1220' };

// Thick polyline as polygons, one quad per segment, with bevelled outer joints returned as separate fold triangles.
const ribbon = (pts, w) => {
  const h = w / 2;
  const segs = pts.slice(1).map((p, i) => {
    const [ax, ay] = pts[i], dx = p[0] - ax, dy = p[1] - ay, len = Math.hypot(dx, dy);
    return { a: pts[i], b: p, d: [dx / len, dy / len], n: [-dy / len, dx / len] };
  });
  const off = (p, n, s) => [p[0] + n[0] * h * s, p[1] + n[1] * h * s];
  const meet = (p1, d1, p2, d2) => {
    const den = d1[0] * d2[1] - d1[1] * d2[0];
    const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den;
    return [p1[0] + d1[0] * t, p1[1] + d1[1] * t];
  };
  const quads = segs.map((s) => ({ start: { L: off(s.a, s.n, 1), R: off(s.a, s.n, -1) }, end: { L: off(s.b, s.n, 1), R: off(s.b, s.n, -1) } }));
  const folds = [];
  for (let k = 1; k < segs.length; k++) {
    const s0 = segs[k - 1], s1 = segs[k];
    const cross = s0.d[0] * s1.d[1] - s0.d[1] * s1.d[0];
    const inner = cross > 0 ? 'L' : 'R', outer = inner === 'L' ? 'R' : 'L', sign = inner === 'L' ? 1 : -1;
    const ip = meet(off(s0.a, s0.n, sign), s0.d, off(s1.a, s1.n, sign), s1.d);
    quads[k - 1].end[inner] = ip;
    quads[k].start[inner] = ip;
    folds.push({ k, pts: [quads[k - 1].end[outer], quads[k].start[outer], ip] });
  }
  const poly = (q) => [q.start.L, q.end.L, q.end.R, q.start.R];
  return { quads: quads.map(poly), folds };
};
const pathOf = (pts) => `M${pts.map((p) => p.map((v) => v.toFixed(2)).join(' ')).join(' L')} Z`;

// Polygon of a thick polyline with mitred joints (for clip paths and fills).
const thick = (pts, w) => {
  const r = ribbon(pts, w);
  const left = [r.quads[0][0], ...r.quads.map((q) => q[1])];
  const right = [r.quads[0][3], ...r.quads.map((q) => q[2])];
  // Close bevel gaps: insert fold points on the outer side.
  const outline = [];
  r.quads.forEach((q, i) => { outline.push(q[0], q[1]); const f = r.folds.find((x) => x.k === i + 1); if (f && !samePt(f.pts[2], q[1])) outline.push(f.pts[1]); });
  return { left, right, r };
};
const samePt = (a, b) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;

const grad = (id, stops, x2 = 1, y2 = 0) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

const proIcons = {
  // P1 Summit: two overlapping peaks; where they cross, the overlap turns blue. Two minds meeting at the top.
  summit: () => {
    const left = 'M10 88 L34 20 L58 88', right = 'M42 88 L66 20 L90 88';
    const line = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<defs><mask id="ml" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">${line(left, '#fff')}</mask></defs>` +
      line(left, P.y) + line(right, P.g) + `<g mask="url(#ml)">${line(right, P.b)}</g>`;
  },
  // P2 Gradient ribbon: one continuous M in a yellow-green-blue gradient.
  gradientM: () =>
    `<defs>${grad('gm', [[0, P.y], [0.5, P.g], [1, P.b]])}</defs>` +
    `<path d="M14 86 L14 18 L50 60 L86 18 L86 86" fill="none" stroke="url(#gm)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`,
  // P3 Rising line: three bars cut by one rising line, so together they draw a single upward slope.
  slope: () => {
    const y = (x) => 64 - (x - 6) * (52 / 88);
    const bar = (x0, x1, c) => `<path d="M${x0} 92 L${x0} ${y(x0).toFixed(2)} L${x1} ${y(x1).toFixed(2)} L${x1} 92 Z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`;
    return bar(8, 30, P.y) + bar(39, 61, P.b) + bar(70, 92, P.g);
  },
  // P4 Folded M: an M folded from one ribbon, with darker fold faces like HighLevel's shaded arrows.
  folded: () => {
    const rb = ribbon([[14, 90], [14, 14], [50, 58], [86, 14], [86, 90]], 18);
    const cols = [P.y, P.bd, P.b, P.g], foldCols = [P.yd, P.bd, P.gd];
    return rb.quads.map((q, i) => `<path d="${pathOf(q)}" fill="${cols[i]}"/>`).join('') +
      rb.folds.map((f, i) => `<path d="${pathOf(f.pts)}" fill="${foldCols[i]}"/>`).join('');
  },
  // P6 Split arrow: one upward arrow cut into three colours: one team, one direction.
  splitArrow: () => {
    const arrow = 'M50 6 L95 51 L64 51 L64 94 L36 94 L36 51 L5 51 Z';
    return `<defs><clipPath id="a1"><rect x="0" y="0" width="32" height="100"/></clipPath><clipPath id="a2"><rect x="35" y="0" width="30" height="100"/></clipPath><clipPath id="a3"><rect x="68" y="0" width="32" height="100"/></clipPath></defs>` +
      [['a1', P.y], ['a2', P.b], ['a3', P.g]].map(([id, c]) => `<path d="${arrow}" fill="${c}" stroke="${c}" stroke-width="6" stroke-linejoin="round" clip-path="url(#${id})"/>`).join('') +
      '';
  },
  // P7 Chat M: a support chat bubble in blue-to-green with the M and a yellow spark.
  chat: () =>
    `<defs>${grad('cb', [[0, P.b], [1, P.g]], 1, 1)}</defs>` +
    `<path d="M28 8 H72 A20 20 0 0 1 92 28 V58 A20 20 0 0 1 72 78 H42 L22 94 L24 78 A20 20 0 0 1 8 58 V28 A20 20 0 0 1 28 8 Z" fill="url(#cb)"/>` +
    `<path d="M28 62 L38 34 L50 50 L62 34 L72 62" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="50" cy="24" r="6.5" fill="${P.y}"/>`,
  // P9 Gradient tile: the current peaks M in white, cut out of a yellow-green-blue tile.
  tile: () =>
    `<defs>${grad('tg', [[0, P.y], [0.5, P.g], [1, P.b]], 1, 1)}</defs>` +
    `<rect x="4" y="4" width="92" height="92" rx="26" fill="url(#tg)"/>` +
    `<path d="M24 70 L37 34 L50 54 L63 34 L76 70" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="50" cy="22" r="7" fill="#fff"/>`,
};

// Wordmarks in Figtree.
const figWord = (fg, size, x, ghlColor = fg) => {
  const fs = size * 0.56, a = textPath('GHL', 'f600', fs, -0.01), b = textPath('Megaminds', 'f800', fs, -0.02), base = size / 2 + b.capHeight / 2;
  return { width: a.width + fs * 0.24 + b.width, svg: `<path transform="translate(${x} ${base})" d="${a.d}" fill="${ghlColor}"/><path transform="translate(${x + a.width + fs * 0.24} ${base})" d="${b.d}" fill="${fg}"/>` };
};
const megaWord = (fg, size, x) => {
  const fs = size * 0.6, b = textPath('Megaminds', 'f800', fs, -0.02), base = size / 2 + b.capHeight / 2;
  return { width: b.width, svg: `<path transform="translate(${x} ${base})" d="${b.d}" fill="${fg}"/>` };
};

// P8: "Megaminds" whose i is a stem topped with a tri-colour rising arrow.
const risingI = (fg, size, x) => {
  const fs = size * 0.6, font = fonts.f800, sc = fs / font.unitsPerEm, tr = -0.02 * fs;
  const run = font.layout('Megaminds');
  const capH = font.capHeight * sc, base = size / 2 + capH / 2, xh = font.xHeight * sc;
  const ghl = textPath('GHL', 'f600', fs * 0.93, -0.01);
  let cx = x + ghl.width + fs * 0.24, svg = `<path transform="translate(${x} ${base})" d="${ghl.d}" fill="${fg}"/>`;
  const lGlyph = font.layout('l').glyphs[0].bbox, stem = (lGlyph.maxX - lGlyph.minX) * sc;
  run.glyphs.forEach((g, i) => {
    const adv = run.positions[i].xAdvance * sc;
    if (g.codePoints[0] === 0x69) {
      const bb = g.bbox, mid = cx + ((bb.minX + bb.maxX) / 2) * sc;
      svg += `<rect x="${(mid - stem / 2).toFixed(2)}" y="${(base - xh).toFixed(2)}" width="${stem.toFixed(2)}" height="${xh.toFixed(2)}" fill="${fg}"/>`;
      const s = fs * 0.36, top = base - xh - fs * 0.07 - s * 1.05;
      svg += `<defs>${grad('ri', [[0, P.g], [0.5, P.b], [1, P.y]], 0, 1)}</defs><path d="M${mid} ${top} L${mid + s * 0.62} ${top + s * 0.62} L${mid + s * 0.22} ${top + s * 0.62} L${mid + s * 0.22} ${top + s * 1.05} L${mid - s * 0.22} ${top + s * 1.05} L${mid - s * 0.22} ${top + s * 0.62} L${mid - s * 0.62} ${top + s * 0.62} Z" fill="url(#ri)"/>`;
    } else {
      svg += `<path transform="translate(${cx} ${base})" d="${g.path.scale(sc, -sc).toSVG()}" fill="${fg}"/>`;
    }
    cx += adv + tr;
  });
  return { width: cx - tr - x, svg };
};

const proBadge = () =>
  `<defs>${grad('bg1', [[0, P.y], [0.5, P.g], [1, P.b]], 1, 1)}</defs><rect x="4" y="4" width="92" height="92" rx="24" fill="${P.navy}" stroke="url(#bg1)" stroke-width="7"/>` +
  (() => { const t = textPath('GHL', 'f800', 33, -0.01); return `<path transform="translate(${50 - t.width / 2} ${50 + t.capHeight / 2})" d="${t.d}" fill="#fff"/>`; })();

const proList = [
  { id: 'P1', name: 'Summit', idea: 'Two peaks that overlap into an M. Where they cross, yellow and green turn blue: your team and the agency meeting at the top.', icon: proIcons.summit },
  { id: 'P2', name: 'Gradient ribbon', idea: 'One continuous M in a yellow-to-green-to-blue gradient. Modern and confident, like a software brand.', icon: proIcons.gradientM },
  { id: 'P3', name: 'Rising line', idea: 'Three bars cut by one rising line: three colours, one upward direction. Clean at every size.', icon: proIcons.slope },
  { id: 'P4', name: 'Folded M', idea: 'An M folded from one ribbon, with darker fold faces, the same way HighLevel shades its arrows.', icon: proIcons.folded },
  { id: 'P5', name: 'GHL badge', idea: 'A navy badge with a three-colour edge and the GHL letters, beside the Megaminds name. Reads like a certified partner seal.', icon: proBadge, word: 'mega' },
  { id: 'P6', name: 'Split arrow', idea: 'One upward arrow cut into three colours: certified admins, engineers and your agency moving in one direction.', icon: proIcons.splitArrow },
  { id: 'P7', name: 'Support chat', idea: 'A blue-to-green chat bubble holding the M and a yellow spark. Says "support" first, the way Intercom or Crisp do.', icon: proIcons.chat },
  { id: 'P8', name: 'Rising i', idea: 'A wordmark whose i is topped with a three-colour arrow. The arrow-i alone becomes the app icon and favicon.', icon: () => '', word: 'risingI', app: 'risingI' },
  { id: 'P9', name: 'Gradient tile', idea: 'Your current peaks M in white on a yellow-green-blue tile. App-icon first, like the HighLevel app on a phone.', icon: proIcons.tile, tileIcon: true },
];

const proLockup = (opt, fg, size = 64) => {
  const has = !!opt.icon(), gap = size * 0.3, x0 = has ? size + gap : 0;
  const w = opt.word === 'mega' ? megaWord(fg, size, x0) : opt.word === 'risingI' ? risingI(fg, size, x0) : figWord(fg, size, x0);
  const width = Math.ceil(x0 + w.width + 2);
  return { width, height: size, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${size}" width="${width}" height="${size}" role="img" aria-label="GHL Megaminds">${has ? `<g transform="scale(${size / 100})">${opt.icon(fg)}</g>` : ''}${w.svg}</svg>` };
};

const proApp = (opt) => {
  const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;
  if (opt.id === 'P5' || opt.tileIcon) return svg(opt.icon('#fff'));
  if (opt.app === 'risingI') {
    const s = 26, mid = 50, top = 16;
    return svg(`<defs>${grad('ra', [[0, P.g], [0.5, P.b], [1, P.y]], 0, 1)}</defs><rect width="100" height="100" rx="24" fill="${P.navy}"/>` +
      `<path d="M${mid} ${top} L${mid + s * 0.62} ${top + s * 0.62} L${mid + s * 0.22} ${top + s * 0.62} L${mid + s * 0.22} ${top + s * 1.05} L${mid - s * 0.22} ${top + s * 1.05} L${mid - s * 0.22} ${top + s * 0.62} L${mid - s * 0.62} ${top + s * 0.62} Z" fill="url(#ra)"/>` +
      `<rect x="${mid - 8.5}" y="49" width="17" height="35" rx="2" fill="#fff"/>`);
  }
  return svg(`<rect width="100" height="100" rx="24" fill="${P.navy}"/><g transform="translate(50 50) scale(0.66) translate(-50 -50)">${opt.icon('#fff')}</g>`);
};

const proBoard = async () => {
  const dir = `${root}brand/pro`;
  mkdirSync(dir, { recursive: true });
  const b64 = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const cards = proList.map((opt) => {
    const light = proLockup(opt, P.navy), dark = proLockup(opt, '#ffffff'), app = proApp(opt);
    writeFileSync(`${dir}/${opt.id}-logo.svg`, light.svg + '\n');
    writeFileSync(`${dir}/${opt.id}-logo-light.svg`, dark.svg + '\n');
    writeFileSync(`${dir}/${opt.id}-app-icon.svg`, app + '\n');
    return `<article class="card">
      <header><span class="id">${opt.id}</span><div><h2>${opt.name}</h2><p>${opt.idea}</p></div></header>
      <div class="top">
        <div class="hero"><img src="${b64(light.svg)}" style="height:76px"></div>
        <div class="dark"><img src="${b64(dark.svg)}" style="height:54px"></div>
      </div>
      <div class="use">
        <div class="tile"><img src="${b64(app)}" class="appimg"><span>App icon</span></div>
        <div class="tile"><div class="favs"><img src="${b64(app)}" style="height:32px"><img src="${b64(app)}" style="height:20px"><img src="${b64(app)}" style="height:16px"></div><span>Favicon</span></div>
        <div class="tile"><div class="avatar"><img src="${b64(app)}"></div><span>Social avatar</span></div>
        <div class="site"><div class="bar"><img src="${b64(light.svg)}" style="height:26px"><nav><i>Services</i><i>How we work</i><i>Team</i></nav><b>Book a call</b></div><div class="tab"><img src="${b64(app)}" style="height:14px">GHL Megaminds | White-label HighLevel support</div></div>
        <div class="card-mock"><img src="${b64(dark.svg)}" style="height:30px"><small>White-label HighLevel support<br>ghlmegaminds.com</small></div>
      </div>
    </article>`;
  }).join('');
  const font = (p) => readFileSync(p).toString('base64');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2`)}) format('woff2');font-weight:200 800}
@font-face{font-family:B;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2`)}) format('woff2');font-weight:300 900}
body{margin:0;background:#e8ebf0;font-family:B;color:#0b1220;width:1600px}
h1{font:800 46px D;letter-spacing:-.03em;margin:0;padding:60px 64px 10px}
.sub{margin:0 64px 22px;font-size:18px;color:#4b5563;max-width:1150px;line-height:1.5}
.ref{margin:0 64px 34px;display:flex;gap:10px;align-items:center;font-size:15px;color:#4b5563}
.ref i{width:26px;height:26px;border-radius:8px;display:inline-block}
.list{display:grid;gap:26px;padding:0 64px 64px}
.card{background:#fff;border-radius:28px;padding:28px;box-shadow:0 1px 0 rgba(11,18,32,.04),inset 0 0 0 1px rgba(11,18,32,.06)}
header{display:flex;gap:16px;align-items:flex-start;margin-bottom:20px}
.id{flex:none;width:48px;height:40px;border-radius:12px;background:${P.navy};color:#fff;display:grid;place-items:center;font:800 18px D}
h2{margin:0;font:700 26px D;letter-spacing:-.02em}
header p{margin:5px 0 0;font-size:16px;line-height:1.45;color:#4b5563;max-width:1000px}
.top{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px}
.hero{background:#f6f7f9;border-radius:20px;height:200px;display:grid;place-items:center}
.dark{background:${P.navy};border-radius:20px;height:200px;display:grid;place-items:center}
.use{display:grid;grid-template-columns:130px 130px 130px minmax(0,1fr) 300px;gap:14px;margin-top:14px}
.tile{background:#f6f7f9;border-radius:20px;height:150px;display:grid;place-items:center;align-content:center;gap:10px}
.tile span{font-size:12.5px;font-weight:600;color:#6b7280}
.appimg{height:70px;border-radius:17px;box-shadow:0 14px 28px -14px rgba(11,18,32,.6)}
.favs{display:flex;align-items:center;gap:10px}
.avatar{width:70px;height:70px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px #fff,0 0 0 4px rgba(11,18,32,.1)}.avatar img{width:100%;height:100%;transform:scale(1.18)}
.site{background:#f6f7f9;border-radius:20px;height:150px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
.bar{display:flex;align-items:center;gap:14px;padding:18px 18px;background:#fff;margin:14px 14px 0;border-radius:14px;box-shadow:0 8px 20px -14px rgba(11,18,32,.3)}
.bar nav{display:flex;gap:12px;margin-left:auto;font-size:11.5px;color:#4b5563;white-space:nowrap}.bar nav i{font-style:normal}
.bar b{background:${P.navy};color:#fff;font-size:11.5px;padding:8px 12px;border-radius:999px;white-space:nowrap}
.tab{display:flex;align-items:center;gap:8px;margin:0 14px 14px;padding:7px 11px;background:#fff;border-radius:10px;width:max-content;font-size:11.5px;color:#4b5563}
.card-mock{background:${P.navy};border-radius:20px;height:150px;display:flex;flex-direction:column;justify-content:center;gap:16px;padding:0 26px;box-shadow:0 18px 30px -20px rgba(11,18,32,.7)}
.card-mock img{align-self:flex-start}.card-mock small{color:rgba(255,255,255,.6);font-size:11.5px;line-height:1.5}
</style></head><body><h1>GHL Megaminds: professional logo directions</h1>
<p class="sub">Nine directions in HighLevel's colours, built on a precise grid with depth and gradients, and a cleaner Figtree wordmark. Each is shown the way you would use it: on white and navy, as an app icon, favicon and social avatar, in the website header and on a business card.</p>
<p class="ref"><i style="background:${P.y}"></i>Yellow ${P.y}<i style="background:${P.b}"></i>Blue ${P.b}<i style="background:${P.g}"></i>Green ${P.g}<i style="background:${P.navy}"></i>Navy ${P.navy}</p>
<div class="list">${cards}</div></body></html>`;
  writeFileSync(`${root}.captures/logo-pro.html`, html);
  console.log('pro board written');
};

if (process.argv[2] === 'pro') await proBoard();

// ---------- Catalog: every logo from every round, in the presentation style ----------
// usage: node scripts/build-logo.mjs catalog
// Writes .captures/logo-catalog.html (one card per logo) and brand/catalog/<round>/<logo>/ with SVG + PNG files.
const catalogItems = () => {
  const svg64 = (markup) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${markup}</svg>`;
  const navyTile = (markup) => svg64(`<rect width="64" height="64" rx="16" fill="${T.navy}"/><g transform="translate(32 32) scale(0.72) translate(-32 -32)">${markup}</g>`);
  const rounds = [];
  rounds.push({
    folder: '1 - First options (green and gold)', title: 'Round 1: first options', note: 'Green and gold, from the original GM badge colours. Same simple wordmark on each so the icons can be compared.', dark: C.pine,
    items: optionList.map((o) => ({ id: o.id, name: o.name.replace(' (current)', ''), idea: o.idea, light: optionLockup(o, C.ink).svg, dark: optionLockup(o, C.canvas).svg, app: svg64(appIconFor(o.icon(C.canvas))) })),
  });
  rounds.push({
    folder: '2 - Finalists and the live logo', title: 'Round 2: finalists and the logo on the site now', note: 'The two you picked from round 1, with refined wordmarks, and the app-icon lockup that is live on the homepage.', dark: C.pine,
    items: [
      ...finalists.map((o) => ({ id: `F-${o.id}`, name: `Finalist ${o.id}: ${o.name}`, idea: o.idea, light: optionLockup(o, C.ink).svg, dark: optionLockup(o, C.canvas).svg, app: svg64(appIconFor(o.icon(C.canvas))) })),
      { id: 'Live', name: 'Live logo (on the homepage now)', idea: 'Option A as an app icon (pine rounded square, rising-peaks M, gold spark) followed by the name.', light: lockup({ icon: 'badge', fg: C.ink }).svg, dark: lockup({ icon: 'badge', fg: C.canvas, badge: [C.canvas, C.pine] }).svg, app: svg64(icons.badge()) },
    ],
  });
  const tri = (o) => {
    const word = o.word ?? 'current';
    return { id: o.id, name: o.name, idea: o.idea, light: optionLockup({ ...o, word }, C.ink).svg, dark: optionLockup({ ...o, word }, '#ffffff').svg, app: o.app ? svg64(o.app()) : navyTile(o.icon('#ffffff')) };
  };
  rounds.push({ folder: '3 - HighLevel colours (T1-T16)', title: 'Round 3: HighLevel colours', note: "HighLevel's yellow, blue and green in rising shapes, like HighLevel, Extendly, HL Pro Tools and GHL Support.", dark: T.navy, items: [...triList, ...triList2].map(tri) });
  rounds.push({
    folder: '4 - Professional directions (P1-P9)', title: 'Round 4: professional directions', note: 'Built on a precise grid with depth and gradients, and a cleaner Figtree wordmark.', dark: P.navy,
    items: proList.map((o) => ({ id: o.id, name: o.name, idea: o.idea, light: proLockup(o, P.navy).svg, dark: proLockup(o, '#ffffff').svg, app: proApp(o) })),
  });
  return rounds;
};

const catalog = async () => {
  const rounds = catalogItems();
  const b64 = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const outRoot = `${root}brand/catalog`;
  rmSync(outRoot, { recursive: true, force: true });
  let n = 0;
  const sections = [];
  for (const round of rounds) {
    const cards = [];
    for (const it of round.items) {
      n += 1;
      const num = String(n).padStart(2, '0');
      const folder = `${outRoot}/${round.folder}/${num} ${it.id} ${it.name.replace(/[:/]/g, ' -').replace(/\s+/g, ' ')}`;
      mkdirSync(folder, { recursive: true });
      writeFileSync(`${folder}/logo.svg`, it.light + '\n');
      writeFileSync(`${folder}/logo-on-dark.svg`, it.dark + '\n');
      writeFileSync(`${folder}/app-icon.svg`, it.app + '\n');
      const widthOf = (svg) => Number(svg.match(/viewBox="0 0 ([\d.]+)/)[1]);
      await sharp(Buffer.from(it.light), { density: (72 * 2000) / widthOf(it.light) }).png().toFile(`${folder}/logo.png`);
      await sharp(Buffer.from(it.dark), { density: (72 * 2000) / widthOf(it.dark) }).png().toFile(`${folder}/logo-on-dark.png`);
      await sharp(Buffer.from(it.app), { density: (72 * 1024) / widthOf(it.app) }).png().toFile(`${folder}/app-icon.png`);
      const dark = round.dark;
      cards.push(`<article class="card" data-num="${num}">
      <header><span class="id">${it.id}</span><div><h2>${it.name}</h2><p>${it.idea}</p></div><span class="num">${num} / TOTAL</span></header>
      <div class="top">
        <div class="hero"><img src="${b64(it.light)}" style="height:76px"></div>
        <div class="dark" style="background:${dark}"><img src="${b64(it.dark)}" style="height:54px"></div>
      </div>
      <div class="use">
        <div class="tile"><img src="${b64(it.app)}" class="appimg"><span>App icon</span></div>
        <div class="tile"><div class="favs"><img src="${b64(it.app)}" style="height:32px"><img src="${b64(it.app)}" style="height:20px"><img src="${b64(it.app)}" style="height:16px"></div><span>Favicon</span></div>
        <div class="tile"><div class="avatar"><img src="${b64(it.app)}"></div><span>Social avatar</span></div>
        <div class="site"><div class="bar"><img src="${b64(it.light)}" style="height:26px"><nav><i>Services</i><i>How we work</i><i>Team</i></nav><b style="background:${dark}">Book a call</b></div><div class="tab"><img src="${b64(it.app)}" style="height:14px">GHL Megaminds | White-label HighLevel support</div></div>
        <div class="card-mock" style="background:${dark}"><img src="${b64(it.dark)}" style="height:30px"><small>White-label HighLevel support<br>ghlmegaminds.com</small></div>
      </div>
    </article>`);
    }
    sections.push(`<section><h3>${round.title}</h3><p class="note">${round.note}</p><div class="list">${cards.join('')}</div></section>`);
  }
  const font = (p) => readFileSync(p).toString('base64');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>GHL Megaminds logos</title><style>
@font-face{font-family:D;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2`)}) format('woff2');font-weight:200 800}
@font-face{font-family:B;src:url(data:font/woff2;base64,${font(`${root}node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2`)}) format('woff2');font-weight:300 900}
body{margin:0;background:#e8ebf0;font-family:B;color:#0b1220;width:1600px}
h1{font:800 46px D;letter-spacing:-.03em;margin:0;padding:60px 64px 10px}
.sub{margin:0 64px 10px;font-size:18px;color:#4b5563;max-width:1150px;line-height:1.5}
h3{font:800 32px D;letter-spacing:-.02em;margin:0;padding:44px 64px 4px}
.note{margin:0 64px 22px;font-size:16px;color:#4b5563}
.list{display:grid;gap:26px;padding:0 64px 20px}
.card{background:#fff;border-radius:28px;padding:28px;box-shadow:0 1px 0 rgba(11,18,32,.04),inset 0 0 0 1px rgba(11,18,32,.06)}
header{display:flex;gap:16px;align-items:flex-start;margin-bottom:20px}
.id{flex:none;min-width:48px;padding:0 10px;box-sizing:border-box;height:40px;border-radius:12px;background:#0b1220;color:#fff;display:grid;place-items:center;font:800 17px D}
.num{margin-left:auto;font-size:13px;font-weight:700;color:#9ca3af;white-space:nowrap;padding-top:6px}
h2{margin:0;font:700 26px D;letter-spacing:-.02em}
header p{margin:5px 0 0;font-size:16px;line-height:1.45;color:#4b5563;max-width:1000px}
.top{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px}
.hero{background:#f6f7f9;border-radius:20px;height:200px;display:grid;place-items:center}
.dark{border-radius:20px;height:200px;display:grid;place-items:center}
.hero img,.dark img{max-width:86%}
.use{display:grid;grid-template-columns:130px 130px 130px minmax(0,1fr) 300px;gap:14px;margin-top:14px}
.tile{background:#f6f7f9;border-radius:20px;height:150px;display:grid;place-items:center;align-content:center;gap:10px}
.tile span{font-size:12.5px;font-weight:600;color:#6b7280}
.appimg{height:70px;border-radius:17px;box-shadow:0 14px 28px -14px rgba(11,18,32,.6)}
.favs{display:flex;align-items:center;gap:10px}
.avatar{width:70px;height:70px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px #fff,0 0 0 4px rgba(11,18,32,.1)}.avatar img{width:100%;height:100%;transform:scale(1.18)}
.site{background:#f6f7f9;border-radius:20px;height:150px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
.bar{display:flex;align-items:center;gap:14px;padding:18px 18px;background:#fff;margin:14px 14px 0;border-radius:14px;box-shadow:0 8px 20px -14px rgba(11,18,32,.3)}
.bar img{max-width:46%}
.bar nav{display:flex;gap:12px;margin-left:auto;font-size:11.5px;color:#4b5563;white-space:nowrap}.bar nav i{font-style:normal}
.bar b{color:#fff;font-size:11.5px;padding:8px 12px;border-radius:999px;white-space:nowrap}
.tab{display:flex;align-items:center;gap:8px;margin:0 14px 14px;padding:7px 11px;background:#fff;border-radius:10px;width:max-content;font-size:11.5px;color:#4b5563}
.card-mock{border-radius:20px;height:150px;display:flex;flex-direction:column;justify-content:center;gap:16px;padding:0 26px;box-shadow:0 18px 30px -20px rgba(11,18,32,.7)}
.card-mock img{align-self:flex-start;max-width:100%}.card-mock small{color:rgba(255,255,255,.6);font-size:11.5px;line-height:1.5}
</style></head><body><h1>GHL Megaminds: every logo so far</h1>
<p class="sub">All ${n} logos from the four rounds, each shown on white and dark, as an app icon, favicon and social avatar, in the website header and on a business card.</p>
${sections.join('').replaceAll('/ TOTAL', `/ ${n}`)}<div style="height:60px"></div></body></html>`;
  writeFileSync(`${root}.captures/logo-catalog.html`, html);
  console.log(`catalog: ${n} logos, files in brand/catalog/`);
};

if (process.argv[2] === 'catalog') await catalog();
