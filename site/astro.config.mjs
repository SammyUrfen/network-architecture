// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  site: 'https://sammyurfen.github.io',
  // Placeholder base for the later GitHub Pages deploy. It is set now so the
  // preview gate catches a link that skips the base (docs/PLAN.md section 4).
  base: '/network-architecture/',
  trailingSlash: 'always',
  integrations: [mdx(), preact()],
});
