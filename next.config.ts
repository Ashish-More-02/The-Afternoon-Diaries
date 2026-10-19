import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Article images are immutable (a changed image gets a new file name), so
  // optimized variants can be cached for a long time. WebP only keeps the
  // number of transformations low on Vercel Hobby.
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 2678400, // 31 days
  },
  // Markdown files are read with fs at render time; make sure they ship with
  // the server output for any route rendered on demand (e.g. unknown slugs).
  outputFileTracingIncludes: {
    "/*": ["./content/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
