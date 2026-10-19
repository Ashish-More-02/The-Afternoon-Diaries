# Build a Scalable, Frontend-Only Blog with Next.js

Act as a senior Next.js engineer and software architect. Build a production-quality personal developer blog using Next.js, TypeScript, Markdown/MDX, and static hosting on Vercel.

Before writing code, inspect the existing repository, identify the current framework and structure, and provide a brief implementation plan. Preserve existing functionality and design where possible. If the repository is empty, initialize the project.

## 1. Core Requirements

Build a static, SEO-friendly blog with these principles:

- Next.js with the App Router and TypeScript.
- Frontend-only infrastructure: no database, custom backend, API routes, server actions, authentication server, or external CMS.
- Articles stored as `.md` or `.mdx` files inside the Git repository.
- Static site generation (SSG) wherever appropriate.
- Compatible with deployment on Vercel.
- Support hundreds or thousands of articles without requiring a fundamental architectural rewrite.
- Clean, maintainable, modular, strongly typed code.
- No unnecessary dependencies or overengineering.

Important distinction: Next.js build-time code may run in Node.js during the build. This is acceptable. The deployed application must not depend on a custom runtime backend, database, or dynamic server rendering.

## 2. Technology Stack

Use the following stack unless there is a compelling compatibility reason not to:

- Next.js App Router
- TypeScript with strict mode
- Tailwind CSS
- MDX for rich article content
- A reliable Markdown/MDX frontmatter parser and content-processing library
- `gray-matter` or an equivalent parser for metadata
- `remark-gfm` for GitHub Flavored Markdown
- A syntax-highlighting solution such as Shiki
- ESLint and Prettier
- React-icons for icons, if needed

Select compatible, maintained packages. Avoid installing multiple libraries that solve the same problem.

## 3. Content Storage Architecture

Store articles in a structure similar to:

content/
  articles/
    javascript-closures.mdx
    understanding-react-hooks.mdx
    building-ai-agents.mdx

Each article must contain frontmatter, for example:

---
title: "Understanding JavaScript Closures"
slug: "javascript-closures"
description: "A practical guide to closures in JavaScript."
date: "2026-10-16"
updatedAt: "2026-10-17"
tags:
  - JavaScript
  - Programming
category: "Web Development"
published: true
featured: false
coverImage: "/images/javascript-closures.webp"
readingTime: 8
---

Article content goes here.

Requirements:

- Use the slug as the canonical URL identifier.
- Validate required metadata and types.
- Reject duplicate slugs.
- Validate dates, tags, and publication status.
- Support drafts through `published: false`.
- Exclude drafts from public listings, search, RSS, and sitemap.
- Derive reading time automatically when possible instead of requiring manual maintenance.
- Generate descriptions and other useful metadata consistently.
- Handle missing, invalid, or malformed frontmatter with clear build-time error messages.
- Support Markdown and MDX, including code blocks, tables, links, images, and lists.
- Do not execute arbitrary MDX supplied by visitors. Content is authored and reviewed by the site owner.

## 4. Article Index and Content Processing

Build a centralized content layer responsible for discovering, validating, parsing, and indexing articles.

Create a lightweight article index containing only the metadata needed for listing pages:

- Slug
- Title
- Description
- Publication date
- Updated date
- Tags
- Category
- Reading time
- Cover image
- Featured status

Keep full article bodies separate from listing metadata.

Requirements:

1. Generate the index from the source files during the build.
2. Sort published articles by publication date, newest first.
3. Use a stable secondary sort order for articles with identical dates.
4. Ensure the index is generated from the source of truth rather than manually maintained.
5. Never load every complete article body just to display a list of posts.
6. Avoid reading and parsing all article files repeatedly during individual page renders.
7. Keep the content-processing code separate from React components.
8. Use a typed article metadata interface and validate frontmatter at build time.
9. Make the index generation deterministic and suitable for incremental improvements later.
10. Do not add a database or introduce a runtime indexing service.

For the initial implementation, use a build-generated JSON index or an equivalent efficient typed metadata manifest. Ensure the generated file is not committed as a second source of truth.

## 5. Pages and Features

Implement the following pages:

### Home page

- Personal blog introduction.
- Featured articles.
- Recent articles.
- Topic/category links.
- Clear navigation to the complete article archive.

### Article archive

- Paginated article listing.
- Configurable page size, initially 12 articles per page.
- Newest articles first.
- Search/filter functionality over the article metadata.
- Category and tag filtering.
- Useful empty states when no articles match.
- URL-based pagination and filters where practical.

**Do not render thousands of article cards on a single page.**

### Few UI elements to also include 
- sidebar for easy navigation from page.

### Individual article page

Use the route:

`/blog/[slug]`

Include:

- Article title, description, publication date, updated date, and reading time.
- Rendered MDX content.
- Syntax-highlighted code blocks.
- Table of contents generated from headings.
- Responsive typography and accessible heading structure.
- Related articles based on shared tags or category.
- Previous/next article navigation.
- Social sharing metadata and canonical URL.
- A useful not-found page for nonexistent slugs.

### Additional routes

- `/tags/[tag]`
- `/categories/[category]`
- `/about`
- `/blog/page/[page]` or another consistent pagination URL scheme.
- `/rss.xml`
- `/sitemap.xml`
- `/robots.txt`

Ensure every route is consistent with the static-only architecture.

## 6. Static Generation and Scalability

The number of articles is unknown. Design for growth without prematurely optimizing.

Requirements:

- Generate static article pages at build time.
- Avoid runtime SSR, dynamic server dependencies, and database queries.
- Do not assume that 10,000 pages will build efficiently without testing.
- Keep metadata indexing efficient.
- Avoid importing every MDX article into the homepage or archive.
- Use pagination for archive pages.
- Avoid shipping all article content to the browser.
- Keep search limited to the lightweight article metadata initially.
- Avoid sending a huge JSON index to the browser. If the index becomes large, use a build-generated search index, a small client-side search library, or a static search index loaded on demand.
- Separate content discovery, metadata generation, and article rendering so they can be optimized independently.
- Avoid adding ISR, SSR, API endpoints, or server infrastructure merely for hypothetical future needs.

For the initial implementation, choose a simple and reliable build-time approach. Explain the trade-offs if the repository grows to thousands or tens of thousands of posts, particularly build duration, memory consumption, deployment limits, and static output size.

Do not claim that 10,000 pages will automatically be fast or inexpensive. Document how to measure build performance before changing the architecture.

## 7. Design and User Experience

Build a polished, modern developer blog with:

- Responsive desktop and mobile layouts.
- Clean typography and comfortable reading widths.
- Light and dark themes.
- Accessible navigation and semantic HTML.
- Good contrast and keyboard navigation.
- A responsive article card component.
- A readable code-block design with a copy-code button.
- Breadcrumbs and a table of contents on article pages.
- Appropriate loading, error, and empty states.
- Minimal JavaScript on static pages.

Use a restrained, professional visual style suitable for a software engineer writing about programming, AI, system design, projects, and technical lessons.

Do not overdesign the interface or introduce heavy animation libraries unnecessarily.

## 8. SEO and Performance

Implement:

- Per-article metadata using the Next.js Metadata API.
- Canonical URLs.
- Open Graph and Twitter/X card metadata.
- XML sitemap containing published articles only.
- RSS feed containing recent published articles.
- Robots directives appropriate for a public blog.
- Semantic HTML and accessible links.
- Optimized image handling compatible with static deployment, as described in section 12.
- Sensible internal links and related articles.
- Pagination metadata and discoverable archive navigation.
- Correct 404 handling.

Avoid generating duplicate URLs for the same article or exposing draft articles in public indexes.

## 9. Developer Experience

Provide:

- Clear project folder organization.
- Reusable React components.
- Strong TypeScript types.
- Centralized content utilities.
- A documented process for creating a new article.
- An article template that can be copied.
- A validation script that detects malformed metadata and duplicate slugs.
- A command to validate content before deployment.
- Useful error messages.
- A README with local development, article creation, validation, build, and deployment instructions.
- A `.gitignore` that excludes build output and generated artifacts appropriately.

Example workflow:

1. Create a new `.mdx` file inside `content/articles/`.
2. Add valid frontmatter and write the article.
3. Add any new images, compressed, to `public/images/` (see section 12).
4. Run the content validation command.
5. Run the development server and preview the article.
6. Commit and push to GitHub.
7. Let Vercel build and deploy the static site.

## 10. Testing and Verification

Add tests for the important content utilities and validation rules.

At minimum, verify:

- Valid Markdown and MDX parsing.
- Invalid frontmatter detection.
- Duplicate slug detection.
- Draft exclusion.
- Article sorting.
- Pagination boundaries.
- Missing article handling.
- Correct generation of sitemap and RSS entries.
- Search and filtering behavior.

After implementation:

1. Run linting.
2. Run TypeScript checks.
3. Run tests.
4. Run a production build.
5. Fix errors rather than merely reporting them.
6. Inspect representative pages and mobile layouts if browser tooling is available.
7. Summarize the architecture, files created, commands executed, and any remaining limitations.

## 11. Implementation Discipline

Work incrementally:

1. Inspect the repository and propose the architecture.
2. Set up the content model and validation.
3. Implement the metadata index.
4. Build archive and article pages.
5. Add search, tags, categories, and pagination.
6. Add SEO, sitemap, RSS, and robots handling.
7. Implement visual polish and accessibility.
8. Test and verify the production build.
9. Document the publishing workflow.

Do not stop after generating a plan. Once the plan is clear, implement the application in the repository.

Prioritize a working, maintainable static blog over unnecessary abstractions. If a requested feature conflicts with static-only deployment, explain the trade-off and implement a static-compatible alternative.

At the end, provide a concise summary of what was implemented, how to add an article, and how the architecture can evolve if the blog eventually reaches 10,000 posts.

## 12. Image Storage and Delivery

**Decision:** Commit article images to the repository under `public/images/` and serve them with `next/image`, using Vercel's built-in image optimization. Do not add an external image CDN or storage service for the initial implementation.

### Why

- **No external accounts or payment details.** Everything runs on GitHub and Vercel Hobby, which are already required.
- **Simplest workflow.** Images live next to the articles, are versioned with them, and appear in local development with no extra setup.
- **The free quota is enough for a personal blog.** Vercel Hobby includes 5K image transformations per month. A transformation is counted only on a cache miss or stale entry (one source image × width × format × quality), not per visitor. At about 6 variants per image, that covers roughly 800 distinct images viewed per month.
- **Graceful failure.** If the quota is exceeded, only images not yet optimized fail (HTTP 402). Previously cached images keep working, and Hobby never bills overages.

### Implementation rules

- Store article images in `public/images/` and reference them by root-relative paths, for example `coverImage: "/images/javascript-closures.webp"` or `![Alt text](/images/diagram.webp)` in MDX.
- Route every article and cover image, including images rendered from MDX, through one image component (for example `<ArticleImage>`) wrapping `next/image`. If image delivery changes later, only this component and `next.config` change, never the articles.
- Use a sensible `sizes` attribute on every image to limit the number of generated variants.
- Treat images as immutable: when an image changes, give it a new file name instead of overwriting it.
- Because images are immutable, raise `images.minimumCacheTTL` well above the Next.js 16 default of 4 hours (for example 31 days) so cached images are not re-optimized unnecessarily. Confirm the option against `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`.
- Serve WebP only initially. Enabling AVIF roughly doubles the number of transformations.

### Image hygiene (prevents repository bloat)

Git keeps every committed image in history permanently, even after deletion, so keep images small before committing:

- Export at no more than about 2,400px wide.
- Compress to roughly 200–500 KB, preferring WebP.
- Do not commit raw camera or screenshot originals. Keep those outside the repository.
- The content validation command must check that every `coverImage` and inline image path in article content points to an existing file in `public/images/` with an allowed extension (`.webp`, `.avif`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`). It should warn when an image exceeds a configurable size threshold (for example 1 MB).

At these sizes the repository can hold roughly 2,000–3,000 images before reaching about 1 GB.

### When to revisit

Revisit this decision if any of the following happens:

- Vercel's usage dashboard shows more than about 3,500 image transformations per month (about 70% of the quota) for consecutive months.
- `public/images/` approaches about 1 GB, or clones and Vercel builds become noticeably slow.
- The site becomes commercial. Vercel Hobby is limited to non-commercial personal use.

### Future options (no payment card required)

Apply these in order, and only when a trigger above is reached:

1. **Quota pressure only: ImageKit in front of the deployed site.** Images stay in the repository. ImageKit's free plan uses the deployed Vercel site as a "web folder" origin and handles resizing and delivery, with about 20–25 GB of bandwidth per month. Switch by adding a custom `images.loaderFile`. The free plan has hard limits and needs no credit card, so it cannot generate a bill.
2. **Repository bloat: ImageKit media library storage.** Move new images out of the repository into ImageKit's included storage (about 5 GB on the free plan). Keep the same `/images/...` paths in articles so only the loader changes. Keep a local backup of originals, because ImageKit then holds the only hosted copy.

Removing images that are already committed from Git history requires rewriting history (for example with `git filter-repo`) and a force-push. Treat that as a separate, deliberate maintenance task.

### Rejected: Cloudflare R2 storage with ImageKit delivery

Storing originals in a private Cloudflare R2 bucket (10 GB free, free egress) and delivering them through ImageKit was considered first. It offers the strongest long-term ownership of originals, because R2 is portable S3-compatible storage.

It was rejected because:

- **Cloudflare asks for a payment method before R2 can be enabled**, even for usage within the free tier. This project requires that no payment card is attached to any service.
- **R2 bills overages instead of blocking them**, unlike ImageKit and Vercel Hobby, which stop at their free limits. That adds a small but real risk of unexpected charges.
- **It adds operational overhead too early:** a sync script, access keys to manage, and two external dashboards, for a blog that does not yet have enough images to need them.
