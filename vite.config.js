import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/* global process */


// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte({
		compilerOptions: {
			dev: process.env.NODE_ENV === 'test'
		}
	})],
	test: {
		include: ['tests/*.{test,spec}.{js,ts}'],

		// Enable "document" and etc in unit tests, enabled via 'jsdom' package and initialized into global scope via
		// this config directive for us with Vite.
		globals: true,
		environment: 'jsdom',
		env: 'test',
	}
});
