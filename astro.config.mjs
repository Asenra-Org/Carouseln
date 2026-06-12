import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

// Dynamic adapter selection: Vercel serverless in cloud, Node standalone locally
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

// https://astro.build/config
export default defineConfig({
  site: 'https://carouseln.com',

  integrations: [
    react(),
    sitemap({
      // Exclude authenticated app pages from the public sitemap
      filter: (page) => ![
        'https://carouseln.com/dashboard/',
        'https://carouseln.com/generator/',
        'https://carouseln.com/settings/',
        'https://carouseln.com/onboarding/',
      ].includes(page),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: isVercel ? vercel({
    webAnalytics: { enabled: true }
  }) : node({
    mode: 'standalone',
  }),
});