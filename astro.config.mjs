import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';


import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://robertventures.com',
  integrations: [mdx(), sitemap({
    exclude: ['/test'], // Exclude the /test page from the sitemap
  })],
  devToolbar: {
    enabled: false
  },
  output: 'static',
  adapter: netlify()
});


