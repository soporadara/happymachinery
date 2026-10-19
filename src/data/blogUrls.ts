import type { BlogPost } from '../pages/adminData'

export const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

export const getBlogPostSlug = (post: Pick<BlogPost, 'title' | 'slug'>) =>
  post.slug?.trim() || slugify(post.title)

export const getBlogPostPath = (post: Pick<BlogPost, 'title' | 'slug'>) =>
  `/blog/${getBlogPostSlug(post)}`
