import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Lightning CSS (default CSS minifier) rewrites `max-width` media
    // queries into range syntax (`width<=1024px`) regardless of the
    // `css.lightningcss.targets` option under this bundler — some mobile
    // browser engines (e.g. Yandex Browser) don't parse range syntax and
    // silently drop the whole block. CSS here is small enough that
    // skipping minification costs nothing meaningful.
    cssMinify: false
  }
});
