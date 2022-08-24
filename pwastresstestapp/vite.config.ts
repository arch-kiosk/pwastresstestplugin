import { defineConfig, searchForWorkspaceRoot, loadEnv } from 'vite'
import {VitePWA } from 'vite-plugin-pwa'
import { createHtmlPlugin } from "vite-plugin-html";

// https://vitejs.dev/config/
export default defineConfig(({command, mode}) => {
  const env = loadEnv(mode, "env");
  return {
    build: {
      lib: {
        entry: 'index.html',
        formats: ['es']
      },
      rollupOptions: {
        external: /^lit/
      },
    },
    plugins: [VitePWA({
      registerType: 'autoUpdate'
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
