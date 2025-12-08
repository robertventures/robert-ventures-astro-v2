import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';


import netlify from '@astrojs/netlify';

import tunnel from 'astro-tunnel';

// https://astro.build/config
export default defineConfig({
  site: 'https://robertventures.com',
  integrations: [mdx(), sitemap({
    exclude: ['/test', '/test2'], // Exclude the /test page from the sitemap
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
