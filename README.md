# The Afternoon Diaries (TAD)

> A little corner of the internet, for everything on my mind.

A personal blog for essays, ideas, experiments and code. Articles are plain Markdown files in this repository, built into a static site with Next.js and served on Vercel. Comments and threaded replies will be added after v1, using Firebase.

## Status

**v1 in progress.** Phase 1 (setup) is done. Next: the content layer, then pages. See the build order in [Docs/Implementation-plan.md](Docs/Implementation-plan.md).

## Architecture at a glance

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, `@tailwindcss/typography` |
| Articles | Plain Markdown (`.md`) in `content/articles/`, frontmatter validated with `zod` |
| Rendering | `react-markdown` + `remark-gfm` on the server; `shiki` for code highlighting at build time |
| Images | Committed to `public/images/`, served with `next/image` |
| Hosting | Vercel Hobby (static pages, no server of our own) |
| Reader engagement (after v1) | Firebase Auth + Firestore as a Backend-as-a-Service (comments, replies, view counts) |

Everything runs on free plans with no payment card. Articles never depend on Firebase: if it is down, only comments are affected.

Why each choice was made: [Docs/Architecture-decisions.md](Docs/Architecture-decisions.md).

## Getting started

Requires **Node.js 24** or later.

```bash
npm install
cp .env.example .env.local   # optional locally; set NEXT_PUBLIC_SITE_URL in Vercel
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run check` | Lint + type check |

`validate` (content checks) and `test` (`node:test`) are added with the content layer.

## Project structure

```
content/articles/   Markdown articles (the source of truth)
public/images/      Article images (compressed, immutable file names)
src/app/            Routes and layouts
src/components/     UI components
src/lib/site.ts     Site name, taglines, author and social links
src/lib/content/    Content layer: read, validate and query articles
Docs/               Planning and decision docs
```

## Writing an article

Once the content layer is in place:

1. Create `content/articles/<slug>.md` with frontmatter (`title`, `slug`, `date`, `published` are required).
2. Add images, compressed to WebP (about 200–500 KB, at most ~2,400px wide), to `public/images/`.
3. Run `npm run validate`, then preview with `npm run dev`.
4. Commit and push. Vercel builds and deploys the site.

Drafts use `published: false` and are left out of listings, the sitemap and RSS.

## Docs

- [Architecture-decisions.md](Docs/Architecture-decisions.md): why the site is built this way (ADR-1 to ADR-6)
- [Implementation-plan.md](Docs/Implementation-plan.md): v1 plan, packages, folder structure, build order
- [Initial-app-setup.md](Docs/Initial-app-setup.md): full requirements spec
- [Brand-name-and-direction.md](Docs/Brand-name-and-direction.md): brand, tone and design direction
