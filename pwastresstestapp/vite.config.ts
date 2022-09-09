import { defineConfig, loadEnv } from 'vite'
import {VitePWA } from 'vite-plugin-pwa'
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, "env");
  return {
    build: {
    },
    // publicDir: "dev-dist",
    plugins: [VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      injectManifest: {
        globPatterns: ['**/*.html', '**/*.js', '**/*.css', '**/*.ttf', '**/*.woff2']
      },
      filename: 'sw.js',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: 'index.html'
      }
    }),
      createHtmlPlugin({
        inject: {
          data: {
            ...env,
          }
        }
      })]
  }
})
