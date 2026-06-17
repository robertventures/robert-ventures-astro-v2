import { defineConfig } from "astro/config";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import netlify from "@astrojs/netlify";

import tunnel from "astro-tunnel";

// Articles render via SSR (see src/pages/articles/[...slug].astro), so their URLs
// are not known to the sitemap integration at build time. We list them explicitly
// from the content directory. Slug = filename, matching Astro's content collection default.
const articlesDir = fileURLToPath(new URL("./src/content/articles", import.meta.url));
const articlePages = readdirSync(articlesDir)
  .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
  .map((file) => `https://robertventures.com/articles/${file.replace(/\.mdx?$/, "")}/`);

// https://astro.build/config
export default defineConfig({
  site: "https://robertventures.com",
  image: {
    quality: 85,
  },
  build: {
    inlineStylesheets: "auto",
  },
  integrations: [
    mdx(),
    sitemap({
      customPages: articlePages,
      filter: (page) =>
        !page.includes("/webinar-follow-up") &&
        !page.includes("/call-thank-you") &&
        !page.includes("/404"),
    }),
    tunnel(),
  ],
  server: {
    port: 4321,
  },
  devToolbar: {
    enabled: false,
  },
  output: "server",
  adapter: netlify({
    external: ["gsap"],
  }),
});
