import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import netlify from "@astrojs/netlify";

import tunnel from "astro-tunnel";

// https://astro.build/config
export default defineConfig({
  site: "https://robertventures.com",
  image: {
    quality: 85,
  },
  build: {
    inlineStylesheets: "always",
  },
  integrations: [
    mdx(),
    sitemap({
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
    functionPerRoute: true,
    external: ["gsap"],
  }),
});
