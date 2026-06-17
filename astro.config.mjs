// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
const isDeploy = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  site: 'https://houjunhao93.github.io',
  base: isDeploy ? '/my-site' : '/',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
