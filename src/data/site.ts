import type { ImageMetadata } from 'astro';

import onboardingArt from '../assets/illustrations/offer-onboarding.png';
import supportArt from '../assets/illustrations/offer-support.png';
import engineeringArt from '../assets/illustrations/offer-engineering.png';
import onboardingHomeArt from '../assets/services/onboarding.png';
import supportHomeArt from '../assets/services/support.png';
import engineeringHomeArt from '../assets/services/engineering.png';
import stepCallArt from '../assets/illustrations/step-call.png';
import stepPlugArt from '../assets/illustrations/step-plug.png';
import stepScaleArt from '../assets/illustrations/step-scale.png';

// Background-removed portraits, re-framed to the same head size and eye line (760x900) for a matched set.
import mehediPhoto from '../assets/team/mehedi-sharif-portrait.png';
import farhadPhoto from '../assets/team/farhad-hossen-portrait.png';
import somratPhoto from '../assets/team/somrat-sorkar-portrait.png';
import tuhinPhoto from '../assets/team/tariquzzaman-tuhin-portrait.png';
import muradPhoto from '../assets/team/murad-uzzaman-portrait.png';
import redwanurPhoto from '../assets/team/redwanur-rahman-portrait.png';

// SAMPLE video testimonials: stock clips used as placeholders (public/videos/sample-client-N.mp4).
// They are flagged sample: true, so they only render locally and on review builds, never on the live site.
import leoPoster from '../assets/testimonials/leo-rastogi.jpg';
import barryPoster from '../assets/testimonials/barry-stamos.jpg';
import sergioPoster from '../assets/testimonials/sergio-prado.jpg';
import jamesPoster from '../assets/testimonials/james-barton.jpg';
import bernhardPoster from '../assets/testimonials/bernhard-buhlmann.jpg';

import automarkHero from '../assets/projects/automark-hero.jpg';
import automarkMobile from '../assets/projects/automark-mobile.jpg';

// HighLevel embeds on the white-label domain (same calendar and form the live site uses).
export const BOOKING_EMBED_URL = 'https://links.ghlmegaminds.com/widget/booking/b40dt1YgHIrDlJDWZd1D';
export const BOOKING_EMBED_ID = 'b40dt1YgHIrDlJDWZd1D_1790652759354';
export const FORM_EMBED_SCRIPT = 'https://links.ghlmegaminds.com/js/form_embed.js';
export const GTM_ID = 'GTM-WV2CRCZ7';

// HighLevel booking page for the discovery call (opens in a new tab).
export const BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/b40dt1YgHIrDlJDWZd1D';
// The live site has its own /discovery and /contact pages. This repo only holds the homepage, so review builds send
// the /discovery buttons straight to the booking page instead of a 404.
const reviewBuild = import.meta.env.PUBLIC_REVIEW_BUILD === 'true';
export const DISCOVERY_HREF = reviewBuild ? BOOKING_URL : '/discovery';
export const CONTACT_HREF = '/contact';
// /v2 still scrolls to its embedded calendar.
export const BOOK_HREF = '#book';
export const BOOK_LABEL = 'Book a discovery call';
export const PLANS_HREF = '#offers';
export const PLANS_LABEL = 'See plans';

export const site = {
  name: 'GHL Megaminds',
  url: 'https://ghlmegaminds.com',
  title: 'White-Label GoHighLevel Support & Onboarding for Agencies | GHL Megaminds',
  description:
    'We handle the onboarding, setup, and daily white-label support so you can scale your HighLevel agency without wrestling with the tech.',
};

export const nav = [
  { label: 'Services', href: '/#offers' },
  { label: 'How we work', href: '/#how-it-works' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Case studies', href: '/case-studies/' },
  { label: 'Team', href: '/#team' },
  { label: 'Contact', href: '/contact' },
];

export const heroStats = [
  { value: '10+ yrs', label: 'building software for global businesses' },
  { value: '< 48 hrs', label: 'from client sign-up to a fully integrated account' },
  { value: '7-day', label: '100% money-back guarantee' },
  { value: '322', label: 'installs of our HighLevel Marketplace apps' },
];

// Homepage hero: three facts under the headline.
export const heroFacts = [
  { value: 'Certified Admins', label: 'HighLevel expertise with full-stack depth.' },
  { value: '40+ years', label: 'Combined development experience.' },
  { value: 'One engineering bench', label: 'Architecture, build, QA, and support.' },
];

export type Integration = { name: string; logo: 'highlevel' | 'stripe' | 'quickbooks' | 'google' | 'slack' | 'teams' | 'n8n' | 'telegram' };

export const integrations: Integration[] = [
  { name: 'GoHighLevel', logo: 'highlevel' },
  { name: 'Stripe', logo: 'stripe' },
  { name: 'QuickBooks Online', logo: 'quickbooks' },
  { name: 'Google Business Profile', logo: 'google' },
  { name: 'Slack', logo: 'slack' },
  { name: 'Microsoft Teams', logo: 'teams' },
  { name: 'n8n', logo: 'n8n' },
  { name: 'Telegram', logo: 'telegram' },
];

export const usualOptions = [
  {
    title: 'Hire offshore inexperienced VAs',
    tag: 'Hand-holding',
    body: 'Low cost, but requires constant hand-holding, lacks real engineering experience, and breaks down when native GoHighLevel features hit a limit.',
  },
  {
    title: 'Hire expensive full-time employees',
    tag: 'High overhead',
    body: 'High overhead, long recruiting cycles, and expensive salaries that eat into your profit margins while slowing down your agency agility.',
  },
  {
    title: 'Hire massive white-label agencies',
    tag: 'Ticket queue',
    body: "They juggle hundreds of clients, so you're just another ticket number in their queue. You get canned replies, slow turnaround, and low-priority treatment.",
  },
];

export const megamindsPoints = [
  'Certified HighLevel admins backed by 10+ years of software engineering',
  'Advanced workflows, webhooks, and APIs built without hand-holding',
  'Flat monthly pricing: no salaries, payroll taxes, or recruiting',
  'Capped client intake, so you get direct partner access',
  "Delivered under your agency's brand; clients never see us",
  '7-day, 100% money-back guarantee',
];

export const workflowSteps = [
  { label: 'Form submitted', icon: 'note-pencil' },
  { label: 'Webhook → middleware', icon: 'flow-arrow' },
  { label: 'Enrich via API', icon: 'database' },
  { label: 'Update GHL contact', icon: 'user-circle-check' },
];

export type Offer = {
  id: string;
  kicker: string;
  title: string;
  blurb: string;
  price: string;
  /** Regular price, struck through. Leave out for quote-only offers. */
  was?: string;
  /** Small pill next to the price. */
  badge?: string;
  terms: string;
  cta: { label: string; href: string };
  items: string[];
  art: ImageMetadata;
  artAlt: string;
  /** Homepage illustration; /v2 keeps `art` (and its recoloured versions). */
  homeArt: ImageMetadata;
  homeArtAlt: string;
};

export const offers: Offer[] = [
  {
    id: 'onboarding',
    kicker: 'Onboarding',
    title: 'Client Onboarding & Setup',
    blurb: 'Turn new client sign-ups into fully integrated accounts in under 48 hours.',
    price: '$900',
    was: '$1,500',
    badge: 'Start here',
    terms: '50 hours/mo. 2-month minimum. Single setup available at $497/client.',
    cta: { label: BOOK_LABEL, href: DISCOVERY_HREF },
    items: [
      'Sub-Account & Intake Setup',
      'Staff Permissions Configuration',
      'Stripe, QBO, GMB Integrations',
      'Snapshot Loading & Custom Fields',
      'Domain Setup & SSL',
      'A2P 10DLC Compliance',
      'SMTP & Domain Authentication',
      '1-on-1 White-Label Walkthrough',
    ],
    art: onboardingArt,
    artAlt: 'Clay illustration of a small green house with a glowing doorway and a golden key',
    homeArt: onboardingHomeArt,
    homeArtAlt: 'Clay illustration of a laptop showing a completed setup checklist, with a small golden rocket lifting off',
  },
  {
    id: 'support',
    kicker: 'Support',
    title: 'Ongoing Tech Support',
    blurb: 'Answer daily client questions and fix broken workflows before clients think about canceling.',
    price: '$600',
    was: '$1,000',
    terms: '50 hours/mo support coverage. 2-month minimum commitment.',
    cta: { label: BOOK_LABEL, href: DISCOVERY_HREF },
    items: [
      'White-Label Help Desk Mgmt',
      'Direct Troubleshooting',
      'Daily System Monitoring',
      'Workflow Health Audits',
      'Trigger & Updates Repair',
      'Escalation Management',
      'Weekly Performance Reports',
    ],
    art: supportArt,
    artAlt: 'Clay illustration of two speech bubbles with a checkmark',
    homeArt: supportHomeArt,
    homeArtAlt: 'Clay illustration of a support headset next to a chat bubble with a checkmark',
  },
  {
    id: 'engineering',
    kicker: 'Engineering',
    title: 'Custom App & Wrapper Dev',
    blurb: 'Build private HighLevel marketplace apps, middleware, and custom portals.',
    price: 'Custom quote',
    terms: 'Custom app and wrapper projects are priced based on scope. Contact us to discuss your requirements.',
    cta: { label: 'Contact us for a quote', href: CONTACT_HREF },
    items: [
      'Marketplace & Private Apps',
      'White-Label Client Portals',
      'Internal Operations Dashboards',
      'Custom Webhooks & Middleware',
      'Third-Party API Bridges',
      'Legacy System Integrations',
      'Custom JavaScript, CSS, and UI tweaks',
    ],
    art: engineeringArt,
    artAlt: 'Clay illustration of interlocking puzzle pieces joined by a cable',
    homeArt: engineeringHomeArt,
    homeArtAlt: 'Clay illustration of a smartphone with app tiles, a code block and a golden gear',
  },
];

export const steps = [
  {
    n: '01',
    meta: '30 min',
    title: 'Book a scoping call',
    body: "We review your agency's current bottleneck, client volume, and technical requirements.",
    art: stepCallArt,
  },
  {
    n: '02',
    meta: 'Integration',
    title: 'Plug us in',
    body: 'We integrate with your Slack, Teams, or ticketing tool under your custom brand identity.',
    art: stepPlugArt,
  },
  {
    n: '03',
    meta: 'Ongoing',
    title: 'Hand off & scale',
    body: 'You close clients. We execute onboarding, build custom apps, and manage support behind the scenes.',
    art: stepScaleArt,
  },
];

export type Project = {
  type: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  installs?: number;
  /** Short facts shown as chips under the description (wide cards). */
  tags?: string[];
  visual:
    | {
        kind: 'shot';
        /** Top of the live site (wide crop), shown in a window that rises out of the bottom of the card. */
        image: ImageMetadata;
        alt: string;
        /** Phone screenshot of the same site, shown in a phone beside the window. */
        mobile?: { image: ImageMetadata; alt: string };
        /** Tinted panel behind the screenshots; none lets the card show through. */
        tint?: 'sage' | 'stone' | 'butter';
      }
    | { kind: 'table'; tint: 'sage' | 'stone' | 'butter' }
    | { kind: 'logo'; logo: 'n8n' | 'telegram' }
    | { kind: 'glyph'; glyph: string; mono?: boolean };
};

export const projects: Project[] = [
  {
    type: 'GoHighLevel Custom App',
    title: 'Integration middleware for GHL & n8n',
    body: 'Connect self-hosted n8n to GoHighLevel in minutes. Packed with 40 pre-built actions and 32 triggers to eliminate manual API calls.',
    href: 'https://marketplace.gohighlevel.com/integration/69eef1cd71a26a0956e537b8',
    cta: 'View on GHL Marketplace',
    installs: 196,
    visual: { kind: 'logo', logo: 'n8n' },
  },
  {
    type: 'Web Application',
    title: 'My CRM Pricing',
    body: 'Show prospects how many subscriptions your CRM replaces and exactly what they save every month. Interactive comparison tables built for SaaS resellers.',
    href: 'https://hlcomparisontable.ghlmegaminds.com/',
    cta: 'Live Demo',
    visual: { kind: 'table', tint: 'sage' },
  },
  {
    type: 'GoHighLevel Custom App',
    title: 'llms.txt Generators app for GHL websites',
    body: 'We solved the missing llms.txt gap for HighLevel long before native rollouts. Generates clean markdown files to prepare client sites for AI crawlers.',
    href: 'https://marketplace.gohighlevel.com/integration/69e86cb705f1a96f1879c857',
    cta: 'View on GHL Marketplace',
    installs: 116,
    visual: { kind: 'glyph', glyph: 'llms.txt', mono: true },
  },
  {
    type: 'GoHighLevel Custom App',
    title: 'Telegram Bridge',
    body: 'HighLevel does not support Telegram natively yet. Use this app to connect multiple Telegram bots and manage real-time conversations from one place.',
    href: 'https://marketplace.gohighlevel.com/integration/6a58a65894c6752231c8b84a/',
    cta: 'View on GHL Marketplace',
    installs: 3,
    visual: { kind: 'logo', logo: 'telegram' },
  },
  {
    type: 'GoHighLevel Custom App',
    title: 'Local currency payments for Bangladesh',
    body: 'HighLevel defaults to global gateways that do not fit every region. We built this custom integration to let Bangladeshi businesses accept local payments directly in GHL checkouts.',
    href: 'https://marketplace.gohighlevel.com/integration/6a4364d3054791173e2b5f5a/',
    cta: 'View on GHL Marketplace',
    installs: 7,
    visual: { kind: 'glyph', glyph: '৳' },
  },
  {
    type: 'Headless Template',
    title: 'Astro + GoHighLevel Website Template',
    body: 'Native HighLevel sites are slow. We built this template to prove you never have to settle for sluggish pages. Get full design control with Astro while HighLevel powers your backend.',
    href: 'https://automark-astro.vercel.app/',
    cta: 'Live Demo',
    visual: {
      kind: 'shot',
      image: automarkHero,
      alt: 'Astro + GoHighLevel Website Template screenshot',
      mobile: { image: automarkMobile, alt: 'The same template on a phone' },
    },
  },
];

// Closing card of the projects grid: the agency platform still in the works.
export const privateProject = {
  type: 'Private Project',
  title: 'Custom GoHighLevel Agency Ops & Client Portal',
  body: 'You cannot run your whole agency and client delivery inside GHL alone. We are building a single dashboard to connect all your external tools, delivery workflows, and client views in one place.',
  cta: 'Book a call',
};

export const team = [
  {
    name: 'Mehedi Sharif',
    role: 'Founder & Strategist',
    years: '13+ yrs',
    certified: true,
    profile: 'https://directory.gohighlevel.com/bangladesh/dhaka/certified-admins/mehedi-sharif',
    photo: mehediPhoto,
    alt: 'Mehedi Sharif - Founder & Strategist and Certified GoHighLevel Admin at GHL Megaminds',
  },
  {
    name: 'Farhad Hossen',
    role: 'Marketing Engineer',
    years: '6+ yrs',
    certified: true,
    profile: 'https://directory.gohighlevel.com/bangladesh/dhaka/certified-admins/farhad-hossen',
    photo: farhadPhoto,
    alt: 'Farhad Hossen - Certified GoHighLevel Admin & Marketing Engineer at GHL Megaminds',
  },
  {
    name: 'Somrat Sorkar',
    role: 'Senior Software Engineer',
    years: '9+ yrs',
    certified: false,
    photo: somratPhoto,
    alt: 'Somrat Sorkar - Senior Software Engineer at GHL Megaminds',
  },
  {
    name: 'Tariquzzaman Tuhin',
    role: 'Delivery & Client Success Lead',
    years: '7+ yrs',
    certified: false,
    photo: tuhinPhoto,
    alt: 'Tariquzzaman Tuhin - Delivery & Client Success Lead at GHL Megaminds',
  },
  {
    name: 'Murad Uzzaman',
    role: 'Frontend & Automation Engineer',
    years: '4+ yrs',
    certified: false,
    photo: muradPhoto,
    alt: 'Murad Uzzaman - Frontend & Automation Engineer at GHL Megaminds',
  },
  {
    name: 'Redwanur Rahman',
    role: 'Systems & Content Specialist',
    years: '2+ yrs',
    certified: false,
    photo: redwanurPhoto,
    alt: 'Redwanur Rahman - Systems & Content Specialist at GHL Megaminds',
  },
];

// Team totals, worked out from the list above so the numbers stay right as people join.
export const combinedTeamYears = team.reduce((sum, member) => sum + parseInt(member.years, 10), 0);
export const certifiedAdmins = team.filter((member) => member.certified).length;

export const projectStats = [
  { value: '322', label: 'installs of our GHL Marketplace apps' },
  { value: '4', label: 'custom apps live on the Marketplace' },
  { value: '6', label: 'products shipped for HighLevel agencies' },
  { value: `${combinedTeamYears}+ yrs`, label: `combined engineering experience, ${certifiedAdmins} certified admins` },
];

/*
  Testimonials carousel. Add as many as you like, in display order.
  - text:  quote + name + role (+ optional photo)
  - video: name + role + video (YouTube, Vimeo or a direct .mp4 URL) + optional poster image and short quote.
           aspect is the video's shape: '16/9' (landscape, default) or '9/16' (vertical phone video).
           A video entry without a video URL renders as a "coming soon" slot.
*/
export type Testimonial =
  | { kind: 'text'; quote: string; name: string; role: string; photo?: ImageMetadata; sample?: boolean }
  | {
      kind: 'video';
      /** Placeholder content: shown locally and on review builds only, never on the live site. */
      sample?: boolean;
      name: string;
      role: string;
      video?: string;
      poster?: ImageMetadata;
      quote?: string;
      aspect?: '16/9' | '9/16';
      /** Where the poster's subject sits (CSS object-position), so the portrait card crop keeps the face in view. */
      posterFocus?: string;
    };

export const testimonials: Testimonial[] = [
  {
    kind: 'video',
    name: 'Leo Rastogi',
    role: 'CEO, SoulSpring',
    video: '/videos/review-leo-rastogi.mp4',
    poster: leoPoster,
    aspect: '9/16',
  },
  {
    kind: 'video',
    name: 'Barry Stamos',
    role: 'CEO, Supernova',
    video: '/videos/review-barry-stamos.mp4',
    poster: barryPoster,
    aspect: '16/9',
  },
  {
    kind: 'video',
    name: 'Sergio Prado',
    role: 'CEO, Embedded Labworks',
    video: '/videos/review-sergio-prado.mp4',
    poster: sergioPoster,
    aspect: '16/9',
  },
  {
    kind: 'video',
    name: 'James Barton',
    role: 'CEO, Pascom',
    video: '/videos/review-james-barton.mp4',
    poster: jamesPoster,
    aspect: '16/9',
    posterFocus: '69% 50%',
  },
  {
    kind: 'video',
    name: 'Bernhard Bühlmann',
    role: 'CEO, Eliza',
    video: '/videos/review-bernhard-buhlmann.mp4',
    poster: bernhardPoster,
    aspect: '16/9',
    posterFocus: '39% 50%',
  },
];

export const faqs = [
  {
    q: 'Will my clients know you exist?',
    a: "No. We work under your agency's brand, inside your Slack, Teams or ticketing tool. Your clients only ever see your team.",
  },
  {
    q: 'What does a monthly plan include?',
    a: 'Each plan covers 50 hours a month of certified HighLevel admin or senior developer time, with a 2-month minimum commitment.',
  },
  {
    q: 'Can I order a single client setup?',
    a: 'Yes. A one-off client onboarding and setup is $497 per client. Custom builds outside a plan are priced on scope.',
  },
  {
    q: 'How fast can you onboard a new client?',
    a: 'Our target is under 48 hours from client sign-up to a fully integrated account: sub-account, integrations, domain, A2P compliance and a white-label walkthrough.',
  },
  {
    q: 'What if it does not work out?',
    a: 'Every plan has a 7-day, 100% money-back guarantee. If we cannot deliver the quality, speed and precision we promise in your first week, you get a full refund.',
  },
  {
    q: 'Why do you cap client intake?',
    a: 'So every agency gets direct partner access, fast turnarounds and dedicated support instead of a ticket number in a queue.',
  },
];

export const footerColumns = [
  {
    title: 'Services',
    links: [
      { label: 'Client Onboarding & Setup', href: '/#offers' },
      { label: 'Ongoing Tech Support', href: '/#offers' },
      { label: 'Custom App & Wrapper Dev', href: '/#offers' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'For Business Owners', href: '/business-owners' },
      { label: 'For Resellers', href: '/resellers' },
      { label: 'Apps & Tools', href: '/tools' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Case studies', href: '/case-studies/' },
      { label: 'Blog', href: '/blog/' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

// Footer newsletter form: posts `email` + `source` (form-encoded) to this webhook. For now it is a DUMMY HighLevel
// inbound-webhook URL with placeholder ids, so the form behaves end to end but nothing is stored. To go live, paste the
// real webhook from HighLevel (Automation > Workflow > Inbound Webhook trigger) and set SUBSCRIBE_DUMMY to false.
// Production builds print a warning while the dummy is in place.
export const SUBSCRIBE_URL = 'https://services.leadconnectorhq.com/hooks/DUMMY_LOCATION_ID/webhook-trigger/DUMMY_WEBHOOK_ID';
export const SUBSCRIBE_DUMMY = true;

// Footer social links (also used as the Organization's sameAs). Dummy entries point at the network's home page until
// the real profile URLs arrive: they show in dev and review builds only and stay out of sameAs, so the live site
// never links to the wrong place. Replace href with the profile URL and drop `dummy` to go live.
export const socials: { label: string; icon: string; href: string; dummy?: boolean }[] = [
  { label: 'X', icon: 'x-logo-bold', href: 'https://x.com/', dummy: true },
  { label: 'Facebook', icon: 'facebook-logo-fill', href: 'https://www.facebook.com/', dummy: true },
  { label: 'LinkedIn', icon: 'linkedin-logo-fill', href: 'https://www.linkedin.com/', dummy: true },
];
