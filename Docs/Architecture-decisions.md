# Architecture Decisions — The Afternoon Diaries (TAD)

Date: 2026-10-19
Related: [Initial-app-setup.md](./Initial-app-setup.md), [Implementation-plan.md](./Implementation-plan.md), [Brand-name-and-direction.md](./Brand-name-and-direction.md)

This document records the main architectural decisions taken while planning TAD, and why they were taken. The other docs say *what* to build; this one says *why it looks the way it does*.

---

## Guiding constraints

Every decision below follows from five constraints:

1. **Completely free.** Nothing should cost money, now or by surprise later. No service may require a credit card, even for a free tier.
2. **Simple to maintain.** One person runs this site. The author should spend more time writing than maintaining infrastructure.
3. **Fast for readers.** Pages should load instantly, with no waiting for a server to wake up.
4. **Good for learning.** The stack should teach good, transferable practices, without overengineering.
5. **Hosted services over self-hosted ones.** Where the site needs stored data, use a managed service with a free, hard-capped tier (Firebase) instead of running our own server or database. This keeps maintenance to a minimum.

---

## ADR-1. Static-first, with articles as `.md` files (no self-hosted backend or database)

### Decision

There is no backend server and no database. Articles are Markdown files in `content/articles/`, committed to the Git repository. Next.js reads them at build time and generates static pages, which Vercel serves.

"No backend" means no server that we write, host or keep awake. Reader data for engagement (comments, accounts, views) will later use a hosted service; see ADR-5.

### Options considered

| Option | Why it was not chosen |
| --- | --- |
| Separate backend (Node/Express) + database (MongoDB Atlas, PostgreSQL, MySQL free tiers) | The database free tiers were fine, but the backend needs its own host. Free hosts such as Render put the service to sleep after about 15 minutes of inactivity, and waking it takes a long time. A visitor arriving after a quiet period would wait on a cold start and probably leave. |
| Backend inside Next.js (API routes / server actions) + database | Viable, and it avoids the separate host. It was not chosen because, for learning purposes, mixing a backend into the frontend app was not the pattern the author wanted to practise. It also still adds a database, connection handling and a free tier to watch. |
| **Static site from Markdown files in the repo** | **Chosen.** |

### Why

- **Costs nothing and cannot surprise-bill.** Only GitHub and Vercel Hobby are used, and both are already required.
- **No cold starts.** Pages are pre-built HTML served from Vercel's CDN, so the first visitor after a quiet day gets the same speed as everyone else.
- **Nothing to keep alive.** No server to monitor, no database to back up, migrate or secure, no connection strings or secrets.
- **Git is the CMS.** Every article is versioned, diffable, and backed up with the code. Publishing is: write a file, commit, push.
- **Content is portable.** Plain `.md` files can be moved to any other platform later without an export step.

### Trade-offs accepted

- No in-browser editor; writing and publishing happens through files and Git.
- No runtime features such as comments, likes or view counters in v1. They are wanted later, to hear what readers think. ADR-5 plans how to add them without a backend server.
- Build time grows with the number of articles. This is acceptable for a personal blog and is documented in the setup doc as something to measure before changing the architecture.

---

## ADR-2. Plain Markdown (`.md`), not MDX

### Decision

Articles are written in plain Markdown and rendered on the server with `react-markdown` + `remark-gfm`. MDX is deferred until it is actually needed.

### Why

- **MDX is more powerful, but more than this blog needs.** MDX allows JSX and custom React components inside articles. TAD's articles are text, headings, quotes, lists, code, tables, a cover image and an optional table of contents. Plain Markdown with GitHub Flavored Markdown covers all of that.
- **Writing should flow freely.** MDX is stricter: it treats `<` and `{` as code, so ordinary prose (for example "a < b" or a stray curly brace) can break the build. Plain Markdown is forgiving, which suits a personal diary-style blog where the writing comes first.
- **Fewer dependencies, smaller surface.** No MDX compiler, no component mapping to maintain, fewer things to break on upgrades.
- **Safer by default.** Raw HTML in Markdown is not rendered, and no code runs from inside an article.
- **Works everywhere.** `.md` files preview correctly on GitHub, in VS Code, and in any Markdown editor, so drafts can be written anywhere.
- **Readers get plain HTML.** Rendering happens in a Server Component at build time, so no Markdown parser is shipped to the browser.

### Keeping the door open

Rendering sits behind one `<ArticleContent>` component. If MDX is ever needed (for example, an interactive demo inside an article), only that component changes. Existing `.md` articles do not need to be rewritten.

Streamdown was also considered and dropped: it is a client-only renderer built for streaming LLM output, and would send each article's full text and the parser to the browser.

---

## ADR-3. Images stored in the repo and served with `next/image` on Vercel

### Decision

Article images are committed to `public/images/` and served through `next/image`, using Vercel's built-in image optimization. No external image storage or CDN for now.

### Options considered

| Option | Outcome |
| --- | --- |
| Cloudflare R2 (storage) + ImageKit (delivery) | Rejected. Cloudflare asks for a payment method before R2 can be enabled, even within the free tier, and R2 bills overages instead of blocking them. That breaks the "not a single rupee" constraint. It also adds a sync script, access keys and two extra dashboards. |
| ImageKit (storage, transformations and delivery in one) | Kept as the future option. Its free plan needs no credit card and stops at hard limits rather than billing. Not needed yet. |
| **Images in the GitHub repo, optimized by Vercel** | **Chosen for now.** |

### Why

- **Quick to start and test.** No extra account, no setup. Images live next to the articles, are versioned with them, and work in local development immediately.
- **Free with a safe failure mode.** Vercel Hobby includes 5,000 image transformations per month, counted per cache miss, not per visitor. If the quota is ever exceeded, only not-yet-optimized images fail; Hobby never bills overages.
- **Right-sized for an uncertain future.** It is not yet known how long or how much the author will write here. Building for large scale now would be overengineering. This choice was checked against Vercel's documented limits before being adopted.

### Known downside and how it is contained

Git keeps every committed image forever, so the repository can grow. This is managed by:

- Compressing images before committing (WebP, roughly 200–500 KB, at most ~2,400px wide).
- Treating images as immutable (a changed image gets a new file name), which also allows a long 31-day image cache.
- Serving WebP only, to keep transformation counts low.
- Routing every image through one `<ArticleImage>` component, so switching to ImageKit later only changes that component and `next.config.ts`, never the articles.

### When to revisit

- Image transformations stay above ~3,500/month (70% of the quota) for consecutive months.
- `public/images/` approaches ~1 GB, or clones and builds become slow.
- The site becomes commercial (Vercel Hobby is for personal, non-commercial use).

Full details are in section 12 of [Initial-app-setup.md](./Initial-app-setup.md).

---

## ADR-4. Next.js + React + TypeScript (not Vite or another tool)

### Decision

The site is built with Next.js (App Router), React and TypeScript in strict mode, deployed on Vercel.

### Why

- **First-class fit with the free host.** Vercel builds and maintains Next.js, so static generation, image optimization and deployment work on Vercel Hobby with no extra configuration.
- **Server Components send plain HTML.** Pages are rendered on the server (here, at build time) and the browser receives finished HTML instead of a JavaScript bundle that builds the page. Readers see content faster, less JavaScript is downloaded, and search engines can read every page.
- **Static generation is built in.** Article, tag, category and archive pages are generated at build time, which is exactly what the static-first architecture (ADR-1) needs.
- **SEO tools are built in.** The Metadata API, sitemap, robots and route handlers (for RSS) come with the framework.
- **React and TypeScript are the industry standard for frontend work.** They are the most transferable skills to practise, and strict TypeScript catches mistakes (for example, in article frontmatter types) before they reach readers.

### Why not Vite (React SPA)

A plain Vite + React app renders pages in the browser. For a blog that means slower first paint, weaker SEO, and having to add routing, static pre-rendering, image optimization and metadata handling by hand. Next.js provides all of these out of the box.

Content-focused tools such as Astro or Hugo would also suit a static blog. Next.js was preferred because it builds React and TypeScript experience directly and integrates most smoothly with Vercel.

---

## ADR-5. Engagement (comments, view counts) with Firebase — planned, not in v1

Status: **Proposed.** First feature to build once v1 is live and articles are being published.

### Context

Engagement is what keeps the author writing. Comments, replies and view counts show what readers think and what they want to share, and turn the blog into a conversation. Readers must be able to comment, and the author (and other readers) must be able to **reply in threads, Reddit-style**. The goal is to handle **at least 100,000 comments and more than 10,000 reader accounts**, while keeping the guiding constraints: free, no credit card, no server to keep alive, and no cold starts.

### Decision

Use **Firebase on the free Spark plan**:

- **Firebase Authentication** for reader accounts (Google sign-in, optionally email).
- **Cloud Firestore** for comments and view counts.

The browser talks to Firebase directly through the Firebase client SDK. There is still no backend server: the article pages stay static, and the comments section is a small client component loaded below the article.

### How this fits ADR-1 ("no backend, no database")

Firebase **is** a backend and a database, offered as a service (Backend-as-a-Service, BaaS) that Google hosts and runs. We do not build a custom backend or database; we rely on Firebase for both. ADR-1 rejected a backend that *we* write, host and keep awake. Firebase keeps what ADR-1 cared about:

- No server code to write or deploy, and no API routes in Next.js.
- Nothing that sleeps or has cold starts.
- Free, with no card.

The rule becomes: **articles stay static files in Git; only reader-generated data (accounts, comments, views) lives in Firebase.** If Firebase is down or over quota, articles still load; only comments are affected.

How it works without a server of our own:

1. **Sign-in:** the Firebase Auth SDK opens a Google sign-in popup in the browser. Firebase keeps the session in the browser and gives it a signed ID token.
2. **Reading and writing:** the browser calls Firestore directly with that token.
3. **Permission checks:** Firestore Security Rules run on Google's servers for every request and allow or deny it based on who is signed in (`request.auth.uid`). The rules are the backend logic.
4. **Pages:** `/account` and `/inbox` are static page shells. A client component loads the data after sign-in. Hiding a page does not protect it; the rules do. A stranger who opens `/inbox` sees an empty page, because Firestore refuses to give them the data.

### Pages and who needs to sign in

| Page / feature | Sign-in needed? | What it does |
| --- | --- | --- |
| Reading articles and comments | **No** | Comments are public to read (rules allow public reads of visible comments). |
| Posting a comment, replying, liking | Yes | Sign-in prompt appears when a reader clicks "Reply" or "Comment". |
| `/inbox` | Yes (every reader) | Replies to my comments, newest first, with new ones highlighted and a reply box in place. **The author's inbox also shows every new comment across all articles**, with a "hide" action. |
| `/account` | Yes (every reader) | Settings only: display name and photo, my comments, sign out, delete my account. |

Deleting an account removes the Firebase Auth user and marks that reader's comments as "[deleted]", so threads stay readable.

### Options considered

| Option | Outcome |
| --- | --- |
| **Firebase (Auth + Firestore, Spark plan)** | **Chosen.** Free with no card. Spark stops at its limits instead of billing. No server to host, and it never sleeps. |
| Giscus (comments stored in GitHub Discussions) | Simplest to set up and fully free, but every commenter needs a GitHub account. TAD is not only a developer blog, so most readers of personal essays would not be able to comment. No view counts. |
| Supabase (Postgres + Auth, free plan) | Good data model and 50K monthly active users free, but free projects **pause after about a week of inactivity** and must be resumed by hand. A quiet blog would go offline, the same problem as Render in ADR-1. |
| Disqus | Free plan shows ads and tracks readers. Conflicts with the brand. |
| Self-hosted (Remark42, Isso, own API) | Needs a server, which breaks ADR-1. |

### Will it handle the target scale?

Spark plan limits for Firestore (check the official Firebase pricing page before building; these change):

| Limit | Spark plan | What it means for TAD |
| --- | --- | --- |
| Stored data | 1 GiB | A comment is about 1 KB, so 100,000 comments is about 100 MB. **Fits easily.** |
| Document reads | 50,000 / day | **The real constraint.** Every comment shown counts as one read. |
| Document writes | 20,000 / day | Covers new comments plus view-count increments (about 20,000 page views a day). |
| Accounts | Standard email and social sign-in is free on Spark | 10,000+ accounts is fine. |

Storage and account count are not the problem. **Daily reads are.** If each article page loaded 100 comments, the free tier would cover only 500 page views a day. Keep reads low by design:

- Load comments only when the reader scrolls to them or clicks "Show comments".
- Paginate: load about 20 comments at a time.
- Store `commentCount` and `views` on the article document, so lists and counters cost one read, not one per comment.

If the limits are reached, Spark stops serving for the rest of the day instead of billing. Comments become unavailable until the reset; the articles themselves are unaffected, because they are static.

### Data model (sketch)

```
articles/{slug}                 { views, commentCount }
articles/{slug}/comments/{id}   { uid, displayName, body, createdAt, status,
                                  parentId, parentUid, rootId, depth, replyCount, likeCount }
articles/{slug}/comments/{id}/likes/{uid}   {}   # optional, one per reader
users/{uid}                     { displayName, photoURL, createdAt, lastSeenRepliesAt }
```

### Threaded replies (Reddit-style)

All comments, top-level or reply, live in one `comments` collection per article. Threading comes from three fields:

- `parentId`: the comment being replied to (`null` for a top-level comment).
- `rootId`: the top-level comment of the thread (its own id for a top-level comment). A whole thread loads with **one query** (`where rootId == X`) and is arranged into a tree in the browser.
- `depth`: 0 for top-level, +1 per reply level.

How it behaves:

- **Limit nesting to about 4 levels.** Deeper replies attach at the last level and start with "@name", as Reddit and YouTube do on mobile. This keeps threads readable on small screens.
- **Load lazily.** Show top-level comments 20 at a time with their `replyCount` ("View 12 replies"); load a thread's replies only when it is opened. Replies cost reads like any comment, so this matters.
- **Author badge.** Comments whose `uid` is the author's are shown with an "Author" label, so readers can spot the author's replies. The author's uid is stored in `src/lib/site.ts` and in the Security Rules.
- **Deleted comments keep their place.** If a comment with replies is deleted, it is shown as "[deleted]" (`status: "deleted"`, body cleared) so the replies below it still make sense.
- **Likes (optional).** One `likes/{uid}` document per reader prevents double likes, and `likeCount` is kept on the comment. Each like costs about two writes, so add this after comments and replies work.

### Knowing when someone replies

Notifications are what make replying a conversation. Sending emails or push notifications needs a server or Cloud Functions, and Cloud Functions require the paid Blaze plan. So v1 of engagement uses in-app notifications only:

One `/inbox` page serves everyone; what it shows depends on who is signed in:

- **Readers** see replies to their own comments: a collection-group query on `comments` where `parentUid == me`, newest first. This covers replies from the author and from other readers.
- **The author** sees the same, plus every new comment across all articles (a collection-group query on `comments`, newest first). Security Rules allow that wider query only for the author's uid.
- **Unread badge.** The header shows a small count ("3") next to an inbox icon for signed-in readers: replies created after `lastSeenRepliesAt`. Opening `/inbox` updates `lastSeenRepliesAt`. Keep the inbox to the latest ~20 items per page to limit reads.
- **Email notifications later.** If they become important, revisit: a free email service called from the browser, or the Blaze plan with Cloud Functions (which would break the "no card" constraint).

### Security and moderation

With no backend, **Firestore Security Rules do the backend's job**:

- Only signed-in readers can create comments, and only as themselves (`uid` must match the signed-in user).
- Readers can edit or delete only their own comments.
- A reply must point to an existing comment in the same article, and `depth` must be its parent's depth + 1 (capped at the nesting limit).
- Enforce body length and field types in the rules.
- The author's account can hide (`status: "hidden"`) any comment.
- Turn on **Firebase App Check** to block requests that do not come from the real site.
- Do not let readers upload images. That needs Cloud Storage for Firebase, which recent reports say now requires the paid Blaze plan (confirm before building).

### View counts for the author only

For private reading stats (which articles are read, where readers come from), Vercel Web Analytics is simpler than a database counter and is available on Hobby. Use the Firestore `views` field only if a **public** view count is shown on the page.

### When to revisit

- Daily reads regularly approach 50,000 or writes approach 20,000.
- Spam becomes too much to handle with rules and App Check alone.
- The site becomes commercial.

---

## ADR-6. Architecture review (senior engineer / tech lead perspective)

Date: 2026-10-19

### Verdict

The architecture is good. It is sized for a one-person blog, it costs nothing, and it does not trap the project. **Approved**, with four changes worth making before or while engagement (ADR-5) is built.

### What's strong

- **The core is static.** Articles are Markdown in Git and pages are pre-built HTML. That is the cheapest, fastest and most reliable setup a blog can have, and it is the part that matters most.
- **Engagement is kept separate from content.** If Firebase breaks, runs out of quota or gets replaced, only comments are affected. Most blogs get this wrong by putting everything in one database.
- **There are planned swap points.** `<ArticleContent>` and `<ArticleImage>` mean that moving to MDX or ImageKit changes one component, not every article.
- **The free tiers stop instead of billing.** Vercel Hobby and Firebase Spark fail safely. That is better than "free tier plus a credit card", which is how hobby projects end up with surprise bills.
- **Each decision says when to revisit it.** It is rare to see that written down.

### How hard each decision is to change later

| Decision | Cost to change | Why |
| --- | --- | --- |
| Markdown → MDX | **Low** | Only `<ArticleContent>` changes. Most `.md` files are already valid MDX; fix the odd `<` or `{`. |
| No backend → adding one | **Low** | Next.js can add route handlers at any time. Nothing has to be undone. |
| Vercel → another host | **Low–medium** | The static pages move easily. Image optimization would need a replacement loader. |
| Images in Git → ImageKit | **Low for new images, medium for old ones** | New images: change the loader. Removing old images from Git history means rewriting history and force-pushing. |
| Next.js → Astro or similar | **Medium–high** | The UI would be rewritten, but the articles move untouched. |
| **Firebase → Supabase or own backend** | **Highest** | Export the data, migrate reader accounts, rewrite all data access, and turn Security Rules into another permission system. |

The pattern: **content is fully portable; engagement data is where lock-in builds up.** That is the right place for it, but it should be contained on purpose.

### Required changes

1. **Keep Firebase inside one folder.** Put every Firestore and Auth call in `src/lib/engagement/`, behind functions like `getThread()`, `postReply()` and `getInbox()`, and import no Firebase code in components. That turns the highest-cost row above into a medium one.
2. **Test the Security Rules.** With no server of our own, the rules are the only thing stopping a stranger from editing or deleting someone else's comment. Test them with the Firebase Emulator and `@firebase/rules-unit-testing` before launch.
3. **Plan for spam early.** Rules cannot easily limit how often someone posts. To cover it:
   - App Check blocks requests that do not come from the site.
   - A per-user `lastCommentAt`, checked in the rules, stops someone posting every second.
   - A maximum comment length limits giant posts.
   - The "hide" action in the author's inbox handles the rest.
4. **Watch the daily read limit, and plan for backups.**
   - Use Firestore `count()` queries for the unread badge and comment counts. They are far cheaper than loading the documents.
   - Exporting 100,000 comments one by one would use about two days of read quota. Write a small backup script early and run it now and then, while the data is still small.

### Smaller points

- **Privacy:** once readers have accounts, the site needs a short privacy page saying what is stored and how to delete it. Account deletion is already planned. India's DPDP Act applies to collecting personal data such as emails.
- **Learning trade-off:** Firebase teaches data modelling and permission rules, not building a server. A backend inside Next.js was avoided partly for learning reasons (ADR-1), so this is worth being aware of. It is still the right call for the constraints.
- **Out-of-date docs:** [Initial-app-setup.md](./Initial-app-setup.md) still says "no database… authentication server" and asks for a build-generated JSON index. The implementation plan deliberately dropped that index. Both points conflicted with ADR-5 and the plan. **Resolved 2026-10-19:** the setup doc now describes a static-first site with Firebase for engagement (section 13), and records the no-index-file decision.

### Bottom line

Most of these decisions are cheap to change later. The one that is not is Firebase, and wrapping it in its own folder plus testing the rules keeps that manageable. Build v1 as planned, then add engagement with those two safeguards from the start.

---

## Summary

| Area | Decision | Main reason |
| --- | --- | --- |
| Architecture | Static-first; no self-hosted backend or database (Firebase BaaS for reader data only) | Free, no cold starts, minimal maintenance |
| Content format | Plain Markdown (`.md`) | Simple, forgiving writing; enough for this blog |
| Images | In the repo, optimized by Vercel | Free, quick to start, easy to move later |
| Framework | Next.js + React + TypeScript | Native Vercel fit, server-rendered HTML, industry-standard skills |
| Engagement (first after v1) | Firebase Auth + Firestore, Spark plan; threaded replies, in-app notifications | Free with no card, no server, never sleeps, scales to 100K+ comments |
