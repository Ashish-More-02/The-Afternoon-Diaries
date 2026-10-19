/**
 * Single source of truth for site-wide settings and author details.
 * Everything here is placeholder copy — edit freely. Social links left as an
 * empty string are hidden automatically.
 */

export type SocialLink = {
  label: string;
  href: string;
  icon: "github" | "x" | "linkedin" | "instagram" | "mastodon" | "email" | "website";
};

export const site = {
  name: "The Afternoon Diaries",
  shortName: "ATD",
  tagline: "A little corner of the internet, for everything on my mind.",
  secondaryTagline: "Thoughts, ideas, and everything in between.",
  intro:
    "An independent corner of the internet for thoughts, ideas, experiments, and everything in between. Some days it's code. Other days, something entirely different.",
  welcome:
    "Hi, and welcome. Pull up a chair — this is where I write things down so I can think them through.",
  /** Set NEXT_PUBLIC_SITE_URL in the environment once the site is hosted. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  locale: "en",
  /** Number of articles per archive page. */
  pageSize: 12,
  /** Number of articles included in the RSS feed. */
  rssLimit: 20,
  /** First year shown in the footer copyright. */
  startYear: 2026,

  author: {
    name: "Your Name",
    bio: "A short line about who you are and what you write about. Edit this in src/lib/site.ts.",
    /** Optional image in /public, e.g. "/images/avatar.webp". */
    avatar: "",
    email: "",
  },

  social: [
    { label: "GitHub", href: "", icon: "github" },
    { label: "X", href: "", icon: "x" },
    { label: "LinkedIn", href: "", icon: "linkedin" },
    { label: "Instagram", href: "", icon: "instagram" },
  ] as SocialLink[],
} as const;

/** Social links that have a URL filled in, plus email when set. */
export function activeSocialLinks(): SocialLink[] {
  const links = site.social.filter((link) => link.href.trim() !== "");
  if (site.author.email) {
    links.push({ label: "Email", href: `mailto:${site.author.email}`, icon: "email" });
  }
  return links;
}

/** Absolute URL for a site path, e.g. absoluteUrl("/blog") */
export function absoluteUrl(path = "/"): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
