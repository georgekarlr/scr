import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import Sitemap from 'vite-plugin-sitemap';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        Sitemap({
            hostname: 'https://ceintelly.org',
            dynamicRoutes: [
                '/login',
                '/signup',
                '/forgot-password',
                '/tos',
                '/privacy',
                '/cookies',
                '/explore',
                '/dashboard',
                '/library',
                '/games',
                '/notifications',
                '/profile',
                '/settings'
            ]
        }),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            devOptions: {
                enabled: true,
            },
            manifest: {
                name: 'Ceintelly',
                short_name: 'Ceintelly',
                description: 'Study with Ceintelly Social Media',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                theme_color: '#0ea5e9',
                background_color: '#ffffff',
                icons: [
                    {
                        src: '/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any'
                    },
                    {
                        src: '/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            }
        })
    ],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
});
