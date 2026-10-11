# GHL Megaminds: homepage redesign

A new homepage for [ghlmegaminds.com](https://ghlmegaminds.com), built with the same stack as the live site (Astro + Tailwind, deployable to Vercel). Phase 1 covers the homepage only; the other pages come next, once this design is approved.

Previews: [`docs/hero-desktop.jpg`](docs/hero-desktop.jpg), [`docs/homepage-desktop.jpg`](docs/homepage-desktop.jpg) and [`docs/homepage-mobile.jpg`](docs/homepage-mobile.jpg). The booking calendar shows up blank in these captures because it is a cross-origin iframe; in a browser it loads normally.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321 (in Claude: the "ghl-megaminds" preview on port 8899)
npm run build      # static output in dist/
npm run preview    # serve the production build
npm run review-zip # client review package in review/ (opens by double-clicking, no analytics)
npm run review-link # update the client review link on Vercel (see below)
```

## Client review link

**https://ghl-megaminds-redesign.vercel.app** is the shareable review copy. It lives in a separate Vercel project, `ghl-megaminds-redesign` (team "Ridoy Rock's projects"), not the client's live site. It is a review build: no GTM or chat widget, and `noindex` so search engines skip it.

- To update it after changes, run `npm run review-link`. That deploys to this review project's own production alias, which is the public URL.
- A plain `vercel deploy` creates a preview URL protected by Vercel Authentication (visitors hit a Vercel login), so don't send those to the client.
- The booking calendar on it is the client's live HighLevel calendar, so bookings there are real.

Node 22.12 or newer.

## Where things live

| What | Where |
| --- | --- |
| All copy, prices, links, FAQ, team, projects | `src/data/site.ts` |
| One component per section | `src/components/*.astro` (page order in `src/pages/index.astro`) |
| Design tokens, buttons, motion | `src/styles/global.css` |
| `<head>`: SEO, JSON-LD, fonts, GTM | `src/layouts/Base.astro` |
| Illustrations and photos (optimized at build) | `src/assets/` |
| Full-page headless captures for QA | `node scripts/capture.mjs <url> <width> <name> [sliceHeight] [mobile=1]` |

## Adding testimonials

Testimonials live in `testimonials` in `src/data/site.ts` and show up in the carousel in that order.

- **Text:** `{ kind: 'text', quote, name, role, photo }`, where photo is an image imported from `src/assets/`.
- **Video:** `{ kind: 'video', name, role, video, poster, quote, aspect }`.
  - `video` can be a YouTube link, a Vimeo link or a direct `.mp4` URL.
  - `aspect` is `'16/9'` for landscape (the default) or `'9/16'` for vertical phone videos.
  - Clicking the card plays the video in a popup.
- **Slots:** a video entry without a `video` URL shows as a "Video testimonial, coming soon" slot.
- **Placeholders:** mark any entry with `sample: true`. Samples appear in local preview and on review builds (the review link and the zip) but are dropped automatically from the normal production build, so placeholder testimonials can't reach the live site. The three current illustrated videos are samples.

## Navy edition (/v2)

`/v2` is a second version of the homepage with its own look, built from the logo's colours: a dark navy hero (with the track-record stats and integrations inside it), a light side-by-side comparison for the problem, navy / yellow / green tiles in the solution grid, a featured navy middle plan (the "Recommended" badge is a placeholder to confirm), and testimonials on navy (How it works and the light footer keep the homepage layout). Main buttons are the logo green with navy text and sweep to yellow on hover. The illustrations are recoloured to navy, green and yellow by `node scripts/recolor-art.mjs` (rerun it after changing any illustration; output in `src/assets/illustrations/blue/`).

How it is built: `src/pages/v2.astro` uses the redesigned sections in `src/components/v2/` (Hero, Problem, Solution, Offers) plus the shared ones; Header, Footer and Testimonial take a `dark` prop. Colour tokens are swapped by `:root[data-theme="blue"]` in `src/styles/global.css`, and `src/lib/theme.ts` picks the theme, illustrations and same-page links from the URL. `/v2` is noindex with its canonical on the homepage, and it is left out of the review zip.

## Animated hero art

The hero illustration moves on both pages (`src/components/OrbitArt.astro`): gears and beads orbit the clay sphere on two golden rings, slip behind it and come round the front slightly larger, the gears spin, and the scene tilts toward the pointer. Under "reduce motion" it stays still. It is built from layers: `hero-sun.png` (back), the two ring halves drawn in SVG, `hero-body.png` (sphere + pedestal) and the piece sprites `hero-gear.png`, `hero-bead-gold.png`, `hero-bead-dark.png`. `node scripts/orbit-assets.mjs <plate.png> <sprites.png>` makes them from the AI-edited clean plate and pieces (white backgrounds); `node scripts/recolor-art.mjs` then makes the navy /v2 versions. Ring sizes, tilts, speeds and piece positions are at the top of `OrbitArt.astro`. The original still illustration is kept in `src/assets/source/hero-mind.png`.

## Design system

- **Type:** Bricolage Grotesque (display, variable with optical sizing) and Figtree (text), self-hosted through Fontsource, so there are no Google Fonts requests.
- **Colour:** canvas `#f4f2ec`, ink `#14211b`, pine `#12271e` (dark panels), one accent, sun `#f3bd33` (taken from the GM logo), plus butter, sage and stone tints. Leaf green `#2f8a55` is only used for "done/included" checks.
- **Shape:** buttons and chips are pills, containers are 24px, anything nested in a container is 16px.
- **Logo:** three dots in HighLevel yellow (`#FFC800`), blue (`#2896FB`) and green (`#17C94B`) that grow as they climb (small agency to big agency), followed by the name: "GHL" in Bricolage SemiBold and "Megaminds" in Bricolage ExtraBold, converted to outlines. The dots keep their colours on light and dark; only the name switches to light. The app icon and favicon put the dots on a pine rounded tile (navy on `/v2`). The files are in `brand/`: the horizontal logo (for light and dark backgrounds), the bare mark, and the app icon as SVG plus PNGs (2000px logo; 1024, 512, 180 and 32px icons). `node scripts/build-logo.mjs` rebuilds them and also writes `public/favicon.svg`, `public/favicon-blue.svg` and `public/apple-touch-icon.png`. All logo options explored so far are in `review/GHL-Megaminds-Logos-2026-10-05.zip` (`node scripts/build-logo.mjs catalog`). The site uses `Logo.astro` (lockup), `LogoMark.astro` (the dots) and `AppIcon.astro` (dots on a tile).
- **Icons:** Phosphor (inlined at build time). Integration logos come from Simple Icons, Phosphor's brand set (Slack, Teams) and HighLevel's official arrow mark.
- **Illustrations:** 10 soft clay 3D illustrations generated for this site (Higgsfield, GPT Image 2.5). Team portraits have their backgrounds removed so all three sit on palette tints.
- **Motion:** the hero headline slides in word by word, followed by the gold marker swipe and the artwork scaling in (which then drifts as you scroll). Section labels, titles and text stagger in. Stats count up from 0. The problem comparison slides in from both sides and its checklist ticks in. Cards pop in and lift on hover. The How it works line draws itself and the steps pop in sequence. Illustrations float or tilt with scroll, and the footer wordmark rises in. Buttons fill with a gold-to-green gradient from where the cursor enters. Everything is CSS plus one IntersectionObserver, scroll-linked effects only run in browsers with scroll timelines, and it all switches off under `prefers-reduced-motion`. Frames: [`docs/animation-frames.jpg`](docs/animation-frames.jpg).

## HighLevel and tracking

- Every **Book a discovery call** button scrolls to `#book`, which embeds the same HighLevel booking calendar the live contact page uses (`b40dt1YgHIrDlJDWZd1D` on `links.ghlmegaminds.com`), plus HighLevel's `form_embed.js` for auto-height. There is also a fallback "open in a new tab" link.
- **Google Tag Manager** (`GTM-WV2CRCZ7`) is only included in production builds, so local testing doesn't send analytics. The HighLevel chat widget arrives through GTM, as it does today.
- The calendar widget's own accent colour (currently green) is set in HighLevel's calendar settings. Switch it to `#12271e` or `#f3bd33` there to match the site.
- The **footer newsletter form** posts `email` and `source` to `SUBSCRIBE_URL` in `src/data/site.ts`. It is a dummy HighLevel inbound-webhook URL for now, so nothing is stored. Before launch, paste the real webhook (HighLevel: Automation > Workflow > Inbound Webhook trigger) and set `SUBSCRIBE_DUMMY` to `false`.
- The **footer social icons** (X, Facebook, LinkedIn) are dummy links to each network's home page, marked `dummy: true` in `socials` in `src/data/site.ts`. They show only locally and on review builds. Replace each `href` with the real profile URL and remove `dummy` to put them on the live site (they then also feed the Organization `sameAs`).

## Not done yet (next phase)

- Other pages: `/contact`, `/about`, `/business-owners`, `/resellers`, `/case-studies`, `/tools`, `/blog`, `/privacy`, `/terms`. Nav and footer links keep the live URLs, so they will 404 locally until these are built.
- Dark mode (the live site has a system/light/dark switch; this redesign is light only for now).
- An Open Graph share image (the live site doesn't have one either).

## Issues found on the live site

- The contact page's HighLevel form (`Fognmtp89XFcCAgplgVJ`) renders **"Not found"**: the form was deleted or the ID changed.
- The HighLevel chat widget loader is injected **three times** (three `chat-widget` elements), most likely duplicate tags in GTM.
