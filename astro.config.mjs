import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  // Netlify setzt URL beim Build auf die Hauptdomain; dient für absolute Links (z. B. Vorschaubild).
  site: process.env.URL || 'https://elternratlaubegg.netlify.app',
});
