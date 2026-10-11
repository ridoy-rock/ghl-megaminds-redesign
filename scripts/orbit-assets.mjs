// Builds the layers for the animated hero (OrbitArt.astro) from the AI-made clean plate and pieces (white
// backgrounds): white -> transparent (keeping soft glows), the plate split into a sun layer (back) and a body layer
// (sphere + pedestal, front), and the gear / gold bead / dark bead cut out as separate sprites.
// usage: node scripts/orbit-assets.mjs <plate.png> <sprites.png>   (then: node scripts/recolor-art.mjs for /v2)
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}src/assets/illustrations`;
const [platePath, spritesPath] = process.argv.slice(2);

// White background -> alpha. "Deficit" = how far the darkest channel is from white.
// - Near-white specks (deficit < 14: noise in the AI image's background) become fully transparent, so no faint veil
//   shows on dark pages.
// - Neutral greys below shadowFromRow (the soft ground shadow) become black at matching opacity, so they darken any
//   background instead of turning into a pale smudge on navy. Higher up, near-white pixels belong to the sun's glow.
// - Coloured soft edges and glows are un-mixed from white so they keep their hue on any background.
const D = 90;
const DEAD = 14;
const unwhite = (data, width, shadowFromRow = Infinity) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const deficit = 255 - Math.min(r, g, b);
    if (deficit < DEAD) { data[i + 3] = 0; continue; }
    if (deficit >= D) continue;
    if (Math.max(r, g, b) - Math.min(r, g, b) < 18 && Math.floor(i / 4 / width) >= shadowFromRow) {
      data[i] = data[i + 1] = data[i + 2] = 0;
      data[i + 3] = Math.round(deficit);
      continue;
    }
    const a = (deficit - DEAD) / (D - DEAD);
    for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.round(255 - (255 - data[i + c]) / Math.max(a, 0.05)));
    data[i + 3] = Math.round(a * 255);
  }
};

const hsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};

// Plate -> sun (yellow pixels and their glow) and body (everything else, including the sun/sphere boundary).
{
  const { data, info } = await sharp(platePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  unwhite(data, info.width, Math.round(info.height * 0.62));
  const sun = Buffer.from(data), body = Buffer.from(data);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const [h, s] = hsl(data[i], data[i + 1], data[i + 2]);
    // The sun sits in the top part of the picture; yellowish pixels lower down belong to the body.
    const isSun = h >= 25 && h <= 62 && s > 0.35 && Math.floor(p / info.width) < info.height * 0.45;
    if (isSun) body[i + 3] = 0;
    else sun[i + 3] = 0;
  }
  const raw = { raw: { width: info.width, height: info.height, channels: 4 } };
  await sharp(sun, raw).png({ compressionLevel: 9 }).toFile(`${out}/hero-sun.png`);
  await sharp(body, raw).png({ compressionLevel: 9 }).toFile(`${out}/hero-body.png`);
  console.log('plate', info.width, info.height);
}

// Sprites: cut the three objects (left to right: gear, gold bead, dark bead) at their bounding boxes.
{
  const { data, info } = await sharp(spritesPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  unwhite(data, info.width);
  const { width, height } = info;
  const colHas = new Array(width).fill(false);
  for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) if (data[(y * width + x) * 4 + 3] > 40) { colHas[x] = true; break; }
  const runs = [];
  for (let x = 0; x < width; x++) {
    if (colHas[x] && (x === 0 || !colHas[x - 1])) runs.push([x, x]);
    if (colHas[x]) runs[runs.length - 1][1] = x;
  }
  const objects = runs.filter(([a, b]) => b - a > 40);
  if (objects.length !== 3) throw new Error(`expected 3 objects, found ${objects.length}`);
  const names = ['hero-gear', 'hero-bead-gold', 'hero-bead-dark'];
  const img = sharp(data, { raw: { width, height, channels: 4 } });
  for (const [k, [x0, x1]] of objects.entries()) {
    let y0 = height, y1 = 0;
    for (let y = 0; y < height; y++) for (let x = x0; x <= x1; x++) if (data[(y * width + x) * 4 + 3] > 40) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const pad = 4, left = Math.max(0, x0 - pad), top = Math.max(0, y0 - pad);
    const w = Math.min(width - left, x1 - x0 + 1 + pad * 2), h = Math.min(height - top, y1 - y0 + 1 + pad * 2);
    const side = Math.max(w, h);
    await img.clone().extract({ left, top, width: w, height: h })
      .extend({ top: Math.floor((side - h) / 2), bottom: Math.ceil((side - h) / 2), left: Math.floor((side - w) / 2), right: Math.ceil((side - w) / 2), background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 }).toFile(`${out}/${names[k]}.png`);
    console.log(names[k], side);
  }
}
