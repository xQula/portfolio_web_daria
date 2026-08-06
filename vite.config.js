import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Lightning CSS (Vite's default CSS minifier) rewrites `max-width` media
    // queries into range syntax (`width<=1024px`) regardless of the
    // `css.lightningcss.targets` option under this bundler — some mobile
    // browser engines (e.g. Yandex Browser) don't parse range syntax and
    // silently drop the whole block. esbuild's CSS minifier only compresses
    // tokens/whitespace and doesn't rewrite media query syntax, so it avoids
    // the bug while still cutting the shipped CSS size roughly in half.
    cssMinify: 'esbuild'
  }
});
