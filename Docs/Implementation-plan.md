# Implementation Plan — The Afternoon Diaries (TAD)

Status: **Approved — v1 (plain Markdown, minimal dependencies)**
Date: 2026-10-19 · Updated: 2026-10-19
Sources: [Initial-app-setup.md](./Initial-app-setup.md), [Brand-name-and-direction.md](./Brand-name-and-direction.md), [Architecture-decisions.md](./Architecture-decisions.md)

Goal of v1: **something working, quickly, to test ideas.** Start small and add a library only when we actually miss it.

---

## 0. Current state of the repository

| Item | Finding |
| --- | --- |
| Framework | Next.js **16.4.2**, React 19.3, App Router, `src/` directory |
| Styling | Tailwind CSS v4 (via `@tailwindcss/turbopack` loader rule in `next.config.ts`) |
| TS | `strict: true` |
| Lint | ESLint 9 flat config with `eslint-config-next` |
| next.config | `cacheComponents: true`, `partialPrefetching: true`, `experimental.agentFeedback: true` |
| Runtime | Node 24.13 (runs `.ts` files natively, with built-in `node:test`) |

### Next.js 16 constraints that shape the design

1. **Cache Components is on.**
   - `dynamicParams`, `dynamic`, `revalidate` segment configs are not available.
   - `generateStaticParams` must return **at least one** entry.
   - `searchParams` is per-request data, so reading it makes a page dynamic. Filters therefore use their own static routes, not `?query` parameters.
   - Unknown slugs are rendered on first request. The page calls `notFound()` for them.
2. **Synchronous file reads (`fs.readFileSync`) are prerendered automatically.** The content layer can read Markdown files directly during the build, with no separate indexing step.

---

## 1. Decisions

### D1. Plain Markdown, rendered on the server

- Articles are `.md` files in `content/articles/`.
- Rendered with **`react-markdown` + `remark-gfm`** in a Server Component. Readers get finished HTML; no Markdown parser is shipped to the browser.
- Raw HTML inside Markdown is **not** rendered (safe default).
- Rendering sits behind one `<ArticleContent>` component. Moving to MDX later changes only that component, not the articles.
- **Dropped:** Streamdown (client-only, built for streaming LLM output) and MDX (stricter to write, not needed yet).

### D2. Dependencies — small, well-maintained libraries; hand-write only trivial things

| Need | v1 approach |
| --- | --- |
| Frontmatter parsing | `gray-matter` |
| Frontmatter validation | `zod` schema, with clear build-time errors |
| Markdown → HTML | `react-markdown` (server-side) |
| Tables, strikethrough, task lists, footnotes | `remark-gfm` |
| Heading ids | `rehype-slug` |
| Table of contents | Extract h2/h3 headings; `github-slugger` makes ids that match `rehype-slug` |
| Syntax highlighting | `rehype-pretty-code` + `shiki`, done at build time (light/dark themes) |
| Article typography | `@tailwindcss/typography` (`prose`), tuned to the brand |
| Icons | `react-icons` |
| Reading time | Hand-written: words ÷ 200, rounded up |
| Light/dark theme | Hand-written: a tiny inline script plus a toggle button |
| Tests | Node's built-in `node:test` |

**Deferred (add when needed):** MDX, Prettier, Vitest, client-side search.

### D3. Content layer (no database, no generated index file)

- `src/lib/content/` reads `content/articles/*.md` with `fs.readFileSync`. It parses and validates **frontmatter only**, once per process (cached at module scope).
- It produces a typed, sorted list of article metadata (newest first; slug as tie-breaker) for every list page.
- Article bodies are read only by the article page, one file per slug.
- Invalid frontmatter or a duplicate slug **fails the build**, with the file name and field in the error.
- `npm run validate` runs the same checks on their own (via Node's native TypeScript support).
- `next.config.ts` sets `outputFileTracingIncludes` so `content/` is deployed with the server functions (needed for the 404 path on unknown slugs).

### D4. Frontmatter schema

Required: `title`, `slug`, `date` (`YYYY-MM-DD`), `published` (boolean).
Optional: `description`, `updatedAt`, `tags` (default `[]`), `category`, `featured` (default `false`), `coverImage`, `coverAlt`, `readingTime` (overrides the computed value).

Rules:
- Slug is kebab-case, unique, and must match the file name.
- Dates must be real dates, and `updatedAt ≥ date`.
- Tags are non-empty strings, de-duplicated.
- `description` falls back to an excerpt of the first paragraph.
- Image paths must start with `/images/` and point to an existing file with an allowed extension. Files over 1 MB trigger a warning.

Drafts (`published: false`) are excluded from listings, sitemap and RSS.

### D5. Site config in one place — `src/lib/site.ts`

Holds the site name, short name, both taglines, intro copy, site URL, archive page size (12), and author info (name, bio, avatar, social links). **Placeholders for now.** An empty social link is hidden automatically. The header, footer, `/about`, RSS and metadata all read from here.

- Primary tagline (header, home, default description): "A little corner of the internet, for everything on my mind."
- Secondary tagline (footer, RSS): "Thoughts, ideas, and everything in between."
- Site URL: `NEXT_PUBLIC_SITE_URL`, falling back to `http://localhost:3000`. Set it in Vercel once the site is hosted.

### D6. Images

As in section 12 of the setup doc:
- Images live in `public/images/`.
- One `<ArticleImage>` component wraps `next/image`; Markdown images go through it too.
- `images.minimumCacheTTL` is set to 31 days, and only WebP is generated.

### D7. Fonts

Keep the current **Geist** + **Geist Mono**. Revisit after seeing the design in use.

### D8. Reader engagement — Firebase as a Backend-as-a-Service (after v1)

Not part of v1, but v1 must not block it. Full reasoning in ADR-5 and ADR-6 of [Architecture-decisions.md](./Architecture-decisions.md).

- **Firebase Auth** (Google sign-in) and **Cloud Firestore** on the free Spark plan. No payment card, no server of our own.
- Comments with Reddit-style threaded replies, view counts, `/inbox` (every signed-in reader; the author also sees all new comments) and `/account` (settings).
- Articles stay static and never read from Firebase. The comments section is a client component loaded lazily below the article.
- All Firebase code lives in `src/lib/engagement/`; Security Rules in `firestore.rules`, tested with the emulator.
- Package added at that point: `firebase` (client SDK). Dev: `firebase-tools`, `@firebase/rules-unit-testing`.

What v1 does to prepare: leave space below the article for the comments section, and keep `site.ts` ready to hold the author's Firebase uid.

---

## 2. Packages

| Package | What it does | How it's used |
| --- | --- | --- |
| `gray-matter` | Separates the `---` frontmatter block from the body. | Returns `{ data, content }` for each article file. |
| `zod` | Checks data against a schema. | The frontmatter rules are defined once. Each article is checked during the build, and a bad field fails the build with its file and field name. The TypeScript type comes from the same schema. |
| `react-markdown` | Turns Markdown into React elements. | Runs in a Server Component, so readers get static HTML. Lets us swap elements: `img` → `<ArticleImage>`, `pre` → code block with copy button. Uses `MarkdownAsync` because Shiki is async. |
| `remark-gfm` | GitHub Flavored Markdown. | Tables, strikethrough, task lists, autolinks, footnotes. |
| `rehype-slug` | Adds an `id` to every heading. | Lets table-of-contents links and shared `#section` links jump to a heading. |
| `github-slugger` | GitHub-style slugs (the library `rehype-slug` uses internally). | Builds table-of-contents ids that match the heading ids exactly. Also makes tag and category URLs. |
| `shiki` | Syntax highlighter using VS Code grammars and themes. | Colours code at build time; no highlighter JavaScript in the browser. |
| `rehype-pretty-code` | Connects Shiki to the Markdown pipeline. | Adds dual light/dark code themes, line highlighting and code block titles. |
| `@tailwindcss/typography` (dev) | Default styling for long-form HTML. | The `prose` classes style headings, lists, quotes, tables and links. We customise them to the TAD look. |
| `react-icons` | Icon sets as React components. | Only the icons we import are bundled. |

## 3. Folder structure

```
content/
  articles/                 # *.md — the source of truth
  templates/article.md      # copy-me template
public/images/              # article images (immutable filenames)
scripts/validate-content.ts # `npm run validate`
src/
  app/
    layout.tsx  page.tsx  not-found.tsx  globals.css
    about/page.tsx
    blog/page.tsx                    # archive page 1
    blog/page/[page]/page.tsx        # archive pages 2..n
    blog/[slug]/page.tsx             # article
    tags/page.tsx  tags/[tag]/page.tsx
    categories/page.tsx  categories/[category]/page.tsx
    rss.xml/route.ts  sitemap.ts  robots.ts
  components/               # Header, Footer, ThemeToggle, ArticleCard, ArticleList,
                            # ArticleMeta, ArticleContent, ArticleImage, CodeBlock,
                            # TableOfContents, Pagination, Breadcrumbs, Sidebar, …
  lib/
    site.ts                 # all site/author config
    content/                # types, validate, parse, queries, toc, paginate
    seo.ts                  # metadata helpers, absolute URLs
    engagement/             # after v1: the only place that imports Firebase (D8)
tests/                      # node:test
firestore.rules             # after v1: Security Rules (D8)
```

---

## 4. Build order

**Phase 1 — Setup**
- Install the packages from §2.
- Add the `validate`, `typecheck`, `test` and `check` scripts.
- Configure images and file tracing in `next.config.ts`.
- Add `.env.example` and `site.ts`.
- Remove the starter page and assets.

**Phase 2 — Content layer**
- Types, validation, parsing, queries (all, by slug, featured, by tag/category, taxonomies with counts, related, prev/next), pagination.
- Sample articles (technical, personal essay, short note, draft) and the template.

**Phase 3 — Layout & pages**
- Theme tokens (warm paper light, calm dark), header, footer, theme toggle.
- Home, archive with pagination and sidebar, article page (breadcrumbs, table of contents, related, prev/next), tags, categories, about, 404.

**Phase 4 — SEO**
- Per-page metadata, canonical URLs, Open Graph/Twitter, sitemap, robots, RSS.

**Phase 5 — Verify**
- `node:test` tests for the content layer.
- Lint, type check, production build, check pages.

**Phase 6 — Docs**
- README (dev, writing an article, validate, deploy), [Writing-an-article.md](./Writing-an-article.md).

**Phase 7 — Reader engagement (first feature after v1, see D8)**
- Firebase project on the Spark plan; config in `.env.example` as `NEXT_PUBLIC_FIREBASE_*`.
- `src/lib/engagement/`: auth, threads, replies, inbox, view counts.
- `firestore.rules` with emulator tests; App Check.
- Comments section on article pages, `/inbox`, `/account`, header unread badge, privacy page.
- Backup script.

**Later:** search, MDX, Prettier, generated OG images, likes on comments, email notifications, scaling notes for thousands of posts.
