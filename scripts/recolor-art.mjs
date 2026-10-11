// Recolours the clay illustrations for the /v2 page (navy edition): light (sage) clay becomes the logo green, dark
// green clay becomes deep navy, gold becomes the logo yellow, and warm pale backgrounds turn cool.
// Shapes, shading, texture and transparency are untouched. Output: src/assets/illustrations/blue/*.png
// usage: node scripts/recolor-art.mjs
import { mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = fileURLToPath(new URL('..', import.meta.url));
const src = `${root}src/assets/illustrations`;
const out = `${src}/blue`;
mkdirSync(out, { recursive: true });

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const toHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};

const toRgb = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// Each pixel is mapped fully to its new colour, then blended with the original in RGB by how strongly it belongs to
// a family. Blending in RGB (not hue) matters: a halfway hue between yellow and blue would be green.
// Per-image overrides for single objects lit by yellow light, so they come out one clean colour: the hero sphere
// (hero-body) and its dark beads go navy, the onboarding house goes green (matching its leaves).
const allBlue = new Set(['hero-body.png', 'hero-bead-dark.png']);
const allGreen = new Set(['offer-onboarding.png']);
// Images whose pale background is itself sage (so colour alone can't tell clay from background): the green clay is the
// largest connected patch of darker green, grown a few pixels to take in its own highlights. Everything else that is
// greenish (background, soft ground shadow) follows the background to blue instead of turning into a green smudge.
const clayObject = { 'offer-support.png': { maxL: 0.66, grow: 18, maxGrowL: 0.855 } };

const largestPatch = (mask, width, height) => {
  const label = new Int32Array(mask.length).fill(-1);
  let best = -1, bestSize = 0, id = 0;
  const stack = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || label[start] !== -1) continue;
    let size = 0;
    stack.push(start);
    label[start] = id;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % width, y = (p - x) / width;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1]) {
        if (q >= 0 && mask[q] && label[q] === -1) { label[q] = id; stack.push(q); }
      }
    }
    if (size > bestSize) { bestSize = size; best = id; }
    id++;
  }
  return label.map((v) => (v === best ? 1 : 0));
};

// Which green clay is "light" (sage -> logo green) and which is "dark" (-> logo blue)? Clear pixels decide by hue and
// lightness; unclear ones (shadows of sage clay, yellow light bouncing onto dark clay) take the side of the clay
// around them, found by blurring the two clear masks. So a green object keeps green shadows and a blue one stays blue.
const classify = async (data, width, height, file) => {
  const n = width * height, sage = Buffer.alloc(n), dark = Buffer.alloc(n), state = new Uint8Array(n); // 0 none, 1 sage, 2 dark, 3 unclear
  for (let p = 0; p < n; p++) {
    const [h, s, l] = toHsl(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    if (data[p * 4 + 3] < 16 || h < 52 || h > 200) continue;
    if (allBlue.has(file)) { state[p] = 2; continue; }
    if (allGreen.has(file)) { sage[p] = 255; state[p] = 1; continue; }
    if (clayObject[file]) { state[p] = 4; continue; } // decided below, by shape
    // Soft cut-out edges and near-grey pixels are never "clear": they follow the clay next to them.
    if (data[p * 4 + 3] < 235 || s < 0.12) state[p] = 3;
    else if (h >= 62 && h <= 98 && l > 0.38) { sage[p] = 255; state[p] = 1; }
    else if (h >= 108) { dark[p] = 255; state[p] = 2; }
    else state[p] = 3;
  }
  if (clayObject[file]) {
    const { maxL, grow, maxGrowL } = clayObject[file];
    const hsl = (p) => toHsl(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    const core = new Uint8Array(n);
    for (let p = 0; p < n; p++) if (state[p] === 4) { const [, s, l] = hsl(p); core[p] = l < maxL && s > 0.08 ? 1 : 0; }
    let clay = largestPatch(core, width, height);
    // Highlights sit on the clay's upper side; below its middle it may only grow a couple of pixels, so it never
    // spreads into the ground shadow underneath.
    let cy = 0, cn = 0;
    for (let p = 0; p < n; p++) if (clay[p]) { cy += Math.floor(p / width); cn++; }
    cy /= cn;
    for (let k = 0; k < grow; k++) {
      const next = Uint8Array.from(clay);
      for (let p = 0; p < n; p++) {
        if (clay[p] || state[p] !== 4) continue;
        if (k >= 2 && Math.floor(p / width) > cy) continue;
        const x = p % width;
        if ((x > 0 && clay[p - 1]) || (x < width - 1 && clay[p + 1]) || clay[p - width] || clay[p + width]) next[p] = hsl(p)[2] < maxGrowL ? 1 : 0;
      }
      clay = next;
    }
    for (let p = 0; p < n; p++) if (state[p] === 4) { if (clay[p]) { sage[p] = 255; state[p] = 1; } else { dark[p] = 255; state[p] = 2; } }
  }
  const sigma = Math.max(4, width / 110);
  // sharp may hand the blurred mask back with more than one channel, so read it at its own stride.
  const blur = async (buf) => {
    const { data: b, info } = await sharp(buf, { raw: { width, height, channels: 1 } }).blur(sigma).raw().toBuffer({ resolveWithObject: true });
    return (p) => b[p * info.channels];
  };
  const [bs, bd] = await Promise.all([blur(sage), blur(dark)]);
  const light = new Float32Array(n);
  for (let p = 0; p < n; p++) {
    if (state[p] === 1) light[p] = 1;
    else if (state[p] === 3) {
      const a = bs(p), b = bd(p);
      // No clear clay nearby: fall back to hue (sage sits below ~105deg).
      light[p] = a + b < 6 ? 1 - smooth(100, 110, toHsl(data[p * 4], data[p * 4 + 1], data[p * 4 + 2])[0]) : a / (a + b);
    }
  }
  return light;
};

const recolor = (rgb, light) => {
  const [h, s, l] = toHsl(...rgb);
  // Greens start just above 60deg; gold sits at 35-45deg, so the switch happens in between.
  const green = smooth(52, 60, h) * (1 - smooth(185, 200, h));
  // Warm, pale, low-saturation pixels: the beige studio backgrounds.
  const beige = (1 - green) * smooth(25, 32, h) * (1 - smooth(58, 66, h)) * (1 - smooth(0.24, 0.34, s)) * smooth(0.62, 0.76, l);
  const gold = (1 - green) * (1 - beige) * smooth(25, 32, h) * (1 - smooth(52, 58, h));

  let out = rgb;
  if (green > 0) {
    // Logo green (#17C94B, ~137deg) for sage clay; deep navy (~211deg) for dark clay. Pale, near-grey pixels get a
    // gentler boost so soft shadows don't turn into coloured smudges.
    const boost = (k, c) => (s < 0.12 ? s * 2 : Math.min(c, s * k + 0.12));
    const toGreen = toRgb(137, boost(2.1, 0.78), l);
    const toBlue = toRgb(211, boost(1.9, 0.86), l < 0.5 ? l * 1.14 : l);
    out = mix(out, mix(toBlue, toGreen, light), green);
  }
  if (beige > 0) out = mix(out, toRgb(214, s * 0.8, l), beige);
  // Gold -> the logo's yellow (#FFC800, ~47deg).
  if (gold > 0) out = mix(out, toRgb(Math.min(48, h + 7), Math.min(1, s * 1.1), Math.min(0.95, l * 1.02)), gold);
  return out;
};

for (const file of readdirSync(src).filter((f) => f.endsWith('.png'))) {
  const { data, info } = await sharp(`${src}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const light = await classify(data, info.width, info.height, file);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const [r, g, b] = recolor([data[i], data[i + 1], data[i + 2]], light[p]);
    data[i] = Math.round(r);
    data[i + 1] = Math.round(g);
    data[i + 2] = Math.round(b);
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(`${out}/${file}`);
  console.log('recoloured', file);
}
