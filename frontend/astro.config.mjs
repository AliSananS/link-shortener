// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	integrations: [react()],

	vite: {
		plugins: [tailwindcss()],
		server: {
			proxy:
				process.env.NODE_ENV === 'development'
					? {
							'/api': {
								target: 'http://localhost:8787',
								changeOrigin: true,
								rewrite: (path) => path.replace(/^\/api/, '/api'),
							},
					  }
					: undefined,
		},
	},
	outDir: 'out',
	output: 'static',
	server: {
		host: true,
		port: 4000,
	},
});
