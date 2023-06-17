import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';


// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],

	// See https://rollupjs.org/configuration-options/
	build: {
		rollupOptions: {
			// Just build the JS files, we'll manually handle HTML (due to how Vite modifies the <script> tags).
			output: [
				{
					format: 'iife',
					entryFileNames: 'assets/[name].[format].js',
					assetFileNames: 'assets/[name][extname]',
				},
				{
					format: 'es',
					entryFileNames: 'assets/[name].[format].js',
					assetFileNames: 'assets/[name][extname]',
				},
			],
		},
	}
});
