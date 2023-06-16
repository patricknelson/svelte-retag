import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Environment variables to allow some minor variation
const VITE_BUILD_FORMAT = process.env.VITE_BUILD_ENTRYPOINT || 'es'; // es (modules) vs. iife
const VITE_BUILD_ENTRYPOINT = process.env.VITE_BUILD_ENTRYPOINT || 'main';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
});
