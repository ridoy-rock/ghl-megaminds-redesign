// Builds a client review package: the homepage as files that open straight from disk (double-click index.html),
// plus screenshots and a START HERE note, zipped into review/.
// usage: npm run review-zip
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const buildDir = path.join(root, '.review-build');
const date = new Date().toISOString().slice(0, 10);
const name = 'GHL-Megaminds-Homepage-Review';
const outRoot = path.join(root, 'review');
const pkgDir = path.join(outRoot, name);
const zipPath = path.join(outRoot, `${name}-${date}.zip`);

const run = (cmd, args, opts = {}) => {
  const res = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', ...opts });
  if (res.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
};

// 1. Production build without GTM / chat widget, so review visits don't reach analytics.
rmSync(buildDir, { recursive: true, force: true });
run('npx', ['astro', 'build', '--outDir', buildDir], { env: { ...process.env, PUBLIC_REVIEW_BUILD: 'true' } });
// The package is the classic homepage only; the blue /v2 page isn't rewritten for file:// and would open broken.
rmSync(path.join(buildDir, 'v2'), { recursive: true, force: true });
rmSync(path.join(buildDir, 'favicon-blue.svg'), { force: true });

// 2. Make it work from file://: relative asset paths, fonts embedded (browsers block font files on file:// pages).
const assetsDir = path.join(buildDir, '_astro');
const htmlPath = path.join(buildDir, 'index.html');
let html = readFileSync(htmlPath, 'utf8');
html = html
  .replace(/<link rel="preload"[^>]*as="font"[^>]*>/g, '')
  .replace(/(["'\s,(])\/_astro\//g, '$1./_astro/')
  .replace(/(["'])\/(favicon\.svg|apple-touch-icon\.png)/g, '$1./$2')
  .replace(/(["'])\/videos\//g, '$1./videos/');
writeFileSync(htmlPath, html);

for (const file of readdirSync(assetsDir).filter((f) => f.endsWith('.css'))) {
  const cssPath = path.join(assetsDir, file);
  let css = readFileSync(cssPath, 'utf8').replace(/url\(\/_astro\//g, 'url(./');
  // Embed the Latin subsets (the only ones this page uses) and the Satoshi title weights; other subsets keep their
  // relative URLs.
  css = css.replace(/url\(\.\/((?:(?:bricolage-grotesque|figtree)-latin-(?:opsz|wght)-normal|Satoshi-Variable)\.[\w-]+\.woff2)\)/g, (match, font) => {
    const data = readFileSync(path.join(assetsDir, font)).toString('base64');
    return `url(data:font/woff2;base64,${data})`;
  });
  writeFileSync(cssPath, css);
}

// 3. Assemble the package.
rmSync(pkgDir, { recursive: true, force: true });
mkdirSync(path.join(pkgDir, 'screenshots'), { recursive: true });
cpSync(buildDir, path.join(pkgDir, 'site'), { recursive: true });
const shots = {
  'hero-desktop.jpg': '1 - Hero (desktop).jpg',
  'homepage-desktop.jpg': '2 - Full homepage (desktop).jpg',
  'homepage-mobile.jpg': '3 - Full homepage (mobile).jpg',
  'animation-frames.jpg': '4 - Animation frames.jpg',
};
for (const [from, to] of Object.entries(shots)) {
  const src = path.join(root, 'docs', from);
  if (existsSync(src)) cpSync(src, path.join(pkgDir, 'screenshots', to));
}
writeFileSync(path.join(pkgDir, 'START HERE.txt'), readFileSync(path.join(root, 'scripts', 'review-start-here.txt'), 'utf8'));

// 4. Zip it (without macOS metadata) and clean up.
rmSync(zipPath, { force: true });
run('zip', ['-rq', '-X', zipPath, name, '-x', '*.DS_Store'], { cwd: outRoot });
rmSync(buildDir, { recursive: true, force: true });
console.log(`\nReview package: ${zipPath}`);
