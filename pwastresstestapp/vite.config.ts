import {defineConfig, loadEnv} from 'vite'
import {VitePWA} from 'vite-plugin-pwa'
import {createHtmlPlugin} from "vite-plugin-html";
// import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'fs';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, "env");
    return {
        base: '/',
        build: {
            emptyOutDir: true,
        },
        server: mode === "production" ? {} : {
            https: {
                key: fs.readFileSync('cert/server.key'),
                cert: fs.readFileSync('cert/server.crt')
            }
        },
        // @ts-ignore
        preview: mode === "preview" ? {
            host: true,
            port: 443,
            https: {
                key: fs.readFileSync('cert/server.key'),
                cert: fs.readFileSync('cert/server.crt'),
            },
        }: {},
        // publicDir: "dev-dist",
        plugins: [
            VitePWA({
                strategies: 'injectManifest',
                srcDir: 'src',
                injectManifest: {
                    globPatterns: ['**/*.html', '**/*.js', '**/*.css', '**/*.ttf', '**/*.woff2', '**/*.png', '**/*.svg']
                },
                filename: 'sw.js',
                registerType: 'autoUpdate',
                devOptions: {
                    enabled: false,
                    type: "module",
                    navigateFallback: 'index.html'
                },
                includeAssets: [
                    'android-icon-36x36.png',
                    'android-icon-48x48.png',
                    'android-icon-72x72.png',
                    'android-icon-96x96.png',
                    'android-icon-144x144.png',
                    'android-icon-192x192.png',
                    'apple-icon.png',
                    'apple-icon-57x57.png',
                    'apple-icon-60x60.png',
                    'apple-icon-72x72.png',
                    'apple-icon-76x76.png',
                    'apple-icon-114x114.png',
                    'apple-icon-120x120.png',
                    'apple-icon-144x144.png',
                    'apple-icon-152x152.png',
                    'apple-icon-180x180.png',
                    'apple-icon-precomposed.png',
                    'favicon-16x16.png',
                    'favicon-32x32.png',
                    'favicon-96x96.png'],
                manifest: {
                    "name": 'Kiosk PWAStressTestApp',
                    "short_name": 'PWAStressTestApp',
                    "description": 'Proof of concept for a Kiosk-based recording system that runs only in a Browser',
                    "display": "fullscreen",
                    "theme_color": '#ffffff',
                    "icons": [
                        {
                            "src": "android-icon-36x36.png",
                            "sizes": "36x36",
                            "type": "image/png",
                            "density": "0.75"
                        },
                        {
                            "src": "android-icon-48x48.png",
                            "sizes": "48x48",
                            "type": "image/png",
                            "density": "1.0"
                        },
                        {
                            "src": "android-icon-72x72.png",
                            "sizes": "72x72",
                            "type": "image/png",
                            "density": "1.5"
                        },
                        {
                            "src": "android-icon-96x96.png",
                            "sizes": "96x96",
                            "type": "image/png",
                            "density": "2.0"
                        },
                        {
                            "src": "android-icon-144x144.png",
                            "sizes": "144x144",
                            "type": "image/png",
                            "density": "3.0"
                        },
                        {
                            "src": "android-icon-192x192.png",
                            "sizes": "192x192",
                            "type": "image/png",
                            "density": "4.0"
                        }]
                }
            }),
            createHtmlPlugin({
                inject: {
                    data: {
                        ...env,
                    }
                }
            }),
            // basicSsl()
        ]
    }
})
