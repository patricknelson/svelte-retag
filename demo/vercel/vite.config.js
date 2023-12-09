import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * Allows building of regular module style (ESM) vs. IIFE/UMD. Requires separate builds, so this is controlled using
 * environment variables. To use this, prefix the env var to *any* command that executes a vite build, for example:
 *
 *    VITE_BUILD_FORMAT=es yarn vite build
 *    VITE_BUILD_FORMAT=iife yarn vite build
 */
const VITE_BUILD_FORMAT = process.env.VITE_BUILD_FORMAT || 'es';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],

	// See https://rollupjs.org/configuration-options/
	build: {
		emptyOutDir: false,

		rollupOptions: {
			// The 'iife' build format only allows for a single input (thus requiring separate build workflow and pointing directly to js).
			input: VITE_BUILD_FORMAT === 'iife' ? 'src/main.js' : [
				'index.html',
				'hydratable.html',
				'hydratable.source.html', // Used for generating content in hydratable.html above.
			],

			output: {
				format: VITE_BUILD_FORMAT,
				entryFileNames: 'js/[name].[format].js', // required for iife (due to single input)
				chunkFileNames: 'js/[name].[format].js', // required for esm (due to multiple inputs)
				assetFileNames: 'assets/[name][extname]',
			},
		},
	}
});
