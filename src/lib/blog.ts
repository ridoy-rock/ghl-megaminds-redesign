// Blog helpers shared by the blog list and the post pages.
import { getCollection, type CollectionEntry } from 'astro:content';
import { team } from '../data/site';

export type Post = CollectionEntry<'blog'>;

/** Published posts, newest first. Drafts show up only in `astro dev`. */
export const getPosts = async (): Promise<Post[]> =>
  (await getCollection('blog', (p) => import.meta.env.DEV || !p.data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

/** Minutes to read, at about 230 words a minute (HTML tags and Markdown syntax left out). */
export const readingTime = (body = ''): number => {
  const words = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*`>|_[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
};

/** The team member who wrote the post (photo, role, certification), if the name matches. */
export const authorOf = (name: string) => team.find((member) => member.name === name);

/** Posts are dated by month: "October 2026". */
export const postMonth = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** ISO year-month for structured data and <time> (the exact day is not published). */
export const postMonthIso = (date: Date): string => date.toISOString().slice(0, 7);

export const categoriesOf = (posts: Post[]): string[] => [...new Set(posts.map((p) => p.data.category))];
