// Colour themes. The homepage (/) uses the classic green + gold theme; /v2 is the same page in the blue theme taken
// from the HighLevel logo (navy, blue, yellow, green). Components read the theme from the page URL, so every section
// stays shared and only colours, illustrations and same-page links change.
import type { ImageMetadata } from 'astro';

export type Theme = 'classic' | 'blue';

export const BLUE_PATH = '/v2';

export const themeOf = (url: URL): Theme => (url.pathname.replace(/\/$/, '') === BLUE_PATH ? 'blue' : 'classic');

// Blue versions of the clay illustrations (built by scripts/recolor-art.mjs), keyed by the classic image object.
// Keyed by reference on purpose: reading an image's `src` makes Astro ship its full-size original in the build.
const classic = import.meta.glob<ImageMetadata>('../assets/illustrations/*.png', { eager: true, import: 'default' });
const blue = import.meta.glob<ImageMetadata>('../assets/illustrations/blue/*.png', { eager: true, import: 'default' });
const blueFor = new Map(
  Object.entries(classic).map(([path, img]) => [img, blue[path.replace('/illustrations/', '/illustrations/blue/')]]),
);

export const art = (img: ImageMetadata, url: URL): ImageMetadata =>
  themeOf(url) === 'blue' ? (blueFor.get(img) ?? img) : img;

// Same-page links ("/", "/#team") stay on the page being viewed, so /v2 visitors don't jump back to the classic page.
export const pageHref = (href: string, url: URL): string => {
  if (themeOf(url) !== 'blue') return href;
  if (href === '/') return BLUE_PATH;
  return href.startsWith('/#') ? `${BLUE_PATH}${href.slice(1)}` : href;
};
