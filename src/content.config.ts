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

export const collections = { blog };
