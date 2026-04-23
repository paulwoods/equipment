import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    server: {
        proxy: {
            '/api': 'http://localhost:8080'
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        environmentOptions: {
            jsdom: {
                url: 'http://localhost',
            },
        },
    },
})
