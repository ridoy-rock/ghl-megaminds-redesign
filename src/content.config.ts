// Blog posts: one Markdown file per post in src/content/blog. The file name is the URL (/blog/<file-name>).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      /** Must match a name in `team` (src/data/site.ts) so the author card can show their photo and role. */
      author: z.string(),
      category: z.string(),
      /**
       * Cover: a real image, or one of the drawn covers (BlogCover.astro) when a post has no artwork yet.
       */
      cover: z
        .union([
          z.object({ image: image(), alt: z.string() }),
          z.object({ art: z.enum(['comparison', 'gateway']) }),
        ])
        .optional(),
      /** Hidden from the blog until set to false. */
      draft: z.boolean().default(false),
    }),
});

// Case studies: one Markdown file per study in src/content/case-studies, all in the frontmatter (no body).
const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      summary: z.string(),
      /** List order (1 = first). */
      order: z.number(),
      /** "Industry / who it was for", e.g. "Home services / Business owner". */
      kind: z.string(),
      /** Short tag on the cover. */
      label: z.string(),
      /** Full-width card on the list page. */
      wide: z.boolean().default(false),
      cover: z.object({ image: image(), alt: z.string(), fit: z.enum(['cover', 'contain']).default('cover') }),
      tint: z.enum(['sage', 'butter', 'stone', 'pine']),
      results: z.array(z.object({ value: z.string(), label: z.string() })).length(3),
      problem: z.object({ heading: z.string(), points: z.array(z.object({ title: z.string(), body: z.string() })) }),
      build: z.object({ heading: z.string(), intro: z.string(), items: z.array(z.string()), process: z.array(z.string()) }),
      outcome: z.object({
        heading: z.string(),
        rows: z.array(z.object({ measure: z.string(), before: z.string(), after: z.string() })),
      }),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog, caseStudies };
