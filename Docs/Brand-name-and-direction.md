# Brand and Editorial Direction — The Afternoon Diaries (TAD)

The website's name is **The Afternoon Diaries**, abbreviated as **TAD**.

## The Idea

This isn't just a developer blog. It's a personal corner of the internet where the author can share ideas, thoughts, experiences, technical discoveries, personal essays, observations, and whatever else feels worth writing about.

The website should feel like opening someone's personal diary — thoughtful, calm, expressive, and distinctly human.

Technology is one subject, not the entire identity of the website.

The author should have complete creative freedom to publish anything from a detailed software engineering article to a short reflection about life, creativity, ambition, productivity, or an unexpected idea.

Avoid making the website look like a corporate engineering portfolio, a documentation site, or a generic SEO-driven content farm.

## Brand Identity

- Full name: The Afternoon Diaries
- Short name: TAD
- Possible tagline: "A little corner of the internet, for everything on my mind."
- Alternative tagline: "Thoughts, ideas, and everything in between."
- Brand personality: personal, introspective, curious, creative, understated, and authentic.

Use "The Afternoon Diaries" prominently in the site header and browser metadata. TAD may be used for a compact logo, favicon, or mobile navigation.

Do not force afternoon imagery, clocks, coffee cups, or diary illustrations into every part of the design. The name should inspire the mood without becoming a literal visual gimmick.

## Visual Direction

Create a warm, editorial, personal reading experience.

Design principles:

- Beautiful typography with a clear distinction between titles, body text, quotations, and code.
- Comfortable reading widths and generous whitespace.
- A calm, understated color palette.
- A subtle paper-like warmth in light mode, balanced by a carefully designed dark mode.
- Minimal visual clutter.
- Responsive layouts that feel intentional on both desktop and mobile.
- Restrained animations and transitions.
- Accessible contrast and keyboard navigation.

The website should feel like a publication designed by an individual with taste, rather than a prebuilt SaaS dashboard.

Avoid excessive gradients, glowing cards, unnecessary glassmorphism, and oversized decorative elements.

## Content Categories

Support flexible categories and tags rather than rigidly defining the author's interests.

Possible initial categories:

- Technology
- Personal Essays
- Ideas & Observations
- Learning & Growth
- Projects & Experiments
- Miscellaneous

These are examples, not mandatory permanent categories. The author should be able to create new categories and tags through article metadata without changing application code.

Some articles may not need a category at all.

## Homepage Experience

The homepage should communicate the site's personality immediately.

Include:

1. A simple introduction to The Afternoon Diaries.
2. A short, personal welcome message.
3. A curated featured article or latest entry.
4. A chronological list of recent writing.
5. A way to explore categories and tags.
6. A link to the complete archive.
7. A quiet footer with the site name and copyright.

Possible introduction:

"An independent corner of the internet for thoughts, ideas, experiments, and everything in between. Some days it's code. Other days, something entirely different."

Treat this as placeholder copy that can be edited later.

The homepage should prioritize the writing itself. Avoid dashboards, analytics counters and popularity rankings on the homepage.

Conversation with readers matters. Comments with threaded replies, and view counts on articles, are planned as the first feature after v1 (see ADR-5 in [Architecture-decisions.md](./Architecture-decisions.md)). They should feel like a quiet conversation under the article, not a social-media feed.

## Article Reading Experience

Reading is the primary interaction.

Each article page should support:

- Elegant title and metadata presentation.
- Optional cover image.
- Comfortable typography and line height.
- Properly styled headings, lists, blockquotes, links, tables, and horizontal rules.
- Syntax-highlighted code blocks for technical articles.
- Inline images and captions where appropriate.
- An optional table of contents for longer articles.
- Reading time.
- A simple link back to the archive.
- Related writing where useful.

Do not make every article look like a technical tutorial. Personal essays should feel natural, and code-heavy articles should remain technically readable.

The article format should allow the author to experiment with structure and tone.

## Markdown Rendering

**Decision (2026-10-19):** Articles are written in plain Markdown (`.md`) and rendered on the server with `react-markdown` + `remark-gfm`, with `rehype-slug` for heading links and `rehype-pretty-code`/Shiki for code highlighting. The browser gets finished HTML. MDX is deferred until it is actually needed.

Why:

- Plain Markdown covers what the site needs now: text, headings, images, quotes, lists, links, tables and code blocks.
- It is forgiving to write. MDX treats `<` and `{` as code, which can break the build in ordinary prose.
- Fewer dependencies, so the author spends more time writing than maintaining.

Streamdown was considered and dropped: `streamdown@2.7.1` is a client-only (`"use client"`) renderer built for streaming LLM output. It would send each article's full text and the parser to the browser.

Rules for the renderer:

1. It must support GitHub Flavored Markdown, tables, lists, links, images, blockquotes and syntax-highlighted code blocks.
2. Images go through the shared `<ArticleImage>` component.
3. Keep it behind one reusable `<ArticleContent>` component, so moving to MDX later changes only that component.

Keep content authored locally in `.md` files, with validated frontmatter and the static-generation architecture described in the main specification.

## Editorial Freedom

Do not impose a mandatory article structure.

An article can be a short note, a long essay, a technical walkthrough, a project journal, a list of ideas, or an experiment in writing.

Support optional metadata such as:

- Title
- Slug
- Description
- Publication date
- Updated date
- Tags
- Category
- Cover image
- Featured status
- Published/draft status

Only title, slug, publication date, and publication status need to be essential, with sensible validation rules for the others.

The site should support both polished articles and informal writing without requiring unnecessary fields.

## Final Product Principle

The Afternoon Diaries is a personal publication, not a product trying to maximize engagement.

Optimize for creative freedom, thoughtful presentation, comfortable reading, discoverability, and long-term ownership of the content.

Keep the architecture simple enough for one developer to maintain. The author should spend more time writing than maintaining the publishing infrastructure.