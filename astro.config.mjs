import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';


import netlify from '@astrojs/netlify';

import tunnel from 'astro-tunnel';

// https://astro.build/config
export default defineConfig({
  site: 'https://robertventures.com',
  integrations: [mdx(), sitemap({
    exclude: [
      '/questions',
      '/webinar-follow-up',
      '/webinar-thank-you',
      '/call-thank-you',
      '/404'
    ],
  }), tunnel()],
  server: {
    port: 4321
  },
  devToolbar: {
    enabled: false
  },
  output: 'server',
  adapter: netlify({
    functionPerRoute: true,
    external: ['gsap']
  })
});
