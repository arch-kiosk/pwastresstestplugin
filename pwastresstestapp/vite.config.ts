import {defineConfig, loadEnv} from 'vite'
import {VitePWA} from 'vite-plugin-pwa'
import {createHtmlPlugin} from "vite-plugin-html";
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, "env");
    return {
        base: '/',
        build: {},
        server: {
            https: true
        },
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
                    'assets/android-icon-36x36.png',
                    'assets/android-icon-48x48.png',
                    'assets/android-icon-72x72.png',
                    'assets/android-icon-96x96.png',
                    'assets/android-icon-144x144.png',
                    'assets/android-icon-192x192.png',
                    'assets/apple-icon.png',
                    'assets/apple-icon-57x57.png',
                    'assets/apple-icon-60x60.png',
                    'assets/apple-icon-72x72.png',
                    'assets/apple-icon-76x76.png',
                    'assets/apple-icon-114x114.png',
                    'assets/apple-icon-120x120.png',
                    'assets/apple-icon-144x144.png',
                    'assets/apple-icon-152x152.png',
                    'assets/apple-icon-180x180.png',
                    'assets/apple-icon-precomposed.png',
                    'assets/favicon-16x16.png',
                    'assets/favicon-32x32.png',
                    'assets/favicon-96x96.png'],
                manifest: {
                    name: 'Kiosk PWAStressTestApp',
                    short_name: 'PWAStressTestApp',
                    description: 'Proof of concept for a Kiosk-based recording system that runs only in a Browser',
                    theme_color: '#ffffff',
                    icons: [
                        {
                            "src": "assets/android-icon-36x36.png",
                            "sizes": "36x36",
                            "type": "image/png",
                            "density": "0.75"
                        },
                        {
                            "src": "assets/android-icon-48x48.png",
                            "sizes": "48x48",
                            "type": "image/png",
                            "density": "1.0"
                        },
                        {
                            "src": "assets/android-icon-72x72.png",
                            "sizes": "72x72",
                            "type": "image/png",
                            "density": "1.5"
                        },
                        {
                            "src": "assets/android-icon-96x96.png",
                            "sizes": "96x96",
                            "type": "image/png",
                            "density": "2.0"
                        },
                        {
                            "src": "assets/android-icon-144x144.png",
                            "sizes": "144x144",
                            "type": "image/png",
                            "density": "3.0"
                        },
                        {
                            "src": "assets/android-icon-192x192.png",
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
            basicSsl()
        ]
    }
})
