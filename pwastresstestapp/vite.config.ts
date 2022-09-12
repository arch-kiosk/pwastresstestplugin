import { defineConfig, loadEnv } from 'vite'
import {VitePWA } from 'vite-plugin-pwa'
import { createHtmlPlugin } from "vite-plugin-html";
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, "env");
  return {
    build: {
    },
    server: {
      https : true
    },
    // publicDir: "dev-dist",
    plugins: [
        VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        injectManifest: {
          globPatterns: ['**/*.html', '**/*.js', '**/*.css', '**/*.ttf', '**/*.woff2']
        },
        filename: 'sw.js',
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false,
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
      }),
      basicSsl()
    ]
  }
})
