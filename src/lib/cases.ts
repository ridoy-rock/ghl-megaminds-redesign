// Case study helpers shared by the list and the detail pages.
import { getCollection, type CollectionEntry } from 'astro:content';

export type CaseStudy = CollectionEntry<'caseStudies'>;

/** Published case studies in their set order. Drafts show up only in `astro dev`. */
export const getCases = async (): Promise<CaseStudy[]> =>
  (await getCollection('caseStudies', (c) => import.meta.env.DEV || !c.data.draft)).sort((a, b) => a.data.order - b.data.order);

/** "01", "02", ... for the case number shown on cards. */
export const caseNumber = (c: CaseStudy): string => String(c.data.order).padStart(2, '0');

/** Panel colours per tint; pine panels are dark and keep light text in both themes (.on-dark). */
export const tintClass = {
  sage: 'bg-sage',
  butter: 'bg-butter',
  stone: 'bg-stone',
  pine: 'on-dark bg-pine text-canvas',
} as const;
