import { describe, beforeAll, afterEach, test, expect } from 'vitest';
import Simple from './Simple.svelte';
import svelteRetag from '../index';
import { setReadyState } from './test-utils.js';
import { tick } from 'svelte';

let el = null;
let debugMode = false; // set to 'cli' to see debug output.

describe('IIFE: Early execution tests (light DOM only)', () => {

	beforeAll(() => {
		svelteRetag({ component: Simple, tagname: 'simple-tag', shadow: false, debugMode });
	});

	afterEach(() => {
		if (el) {
			el.remove();
		}
	});

	// When render is loading: Test to validate that newly added slots affect rendered component content
	test('loading: newly added slots are accounted for in early execution', async () => {
		setReadyState('loading');
		expect(document.readyState).toBe('loading');

		el = document.createElement('div');
		el.innerHTML = '<simple-tag>REPLACE DEFAULT</simple-tag>';
		document.body.appendChild(el);

		expect(el.innerHTML).toBe('<simple-tag><svelte-retag>Initial 1 REPLACE DEFAULT Initial 2<!--<Simple>--></svelte-retag></simple-tag>');

		// Get custom element so we can modify it.
		const root = el.querySelector('simple-tag');
		expect(root).toBeInstanceOf(HTMLElement);

		// Add slot 2 (in weird order) to ensure it's still positioned properly.
		let inner2 = document.createElement('span');
		inner2.textContent = 'REPLACE 2';
		inner2.slot = 'inner2';
		root.appendChild(inner2);
		await tick();
		expect(el.innerHTML).toBe('<simple-tag><svelte-retag>Initial 1 REPLACE DEFAULT <span slot="inner2">REPLACE 2</span><!--<Simple>--></svelte-retag></simple-tag>');

		// Finally, set slot 1.
		let inner1 = document.createElement('span');
		inner1.textContent = 'REPLACE 1';
		inner1.slot = 'inner1';
		root.appendChild(inner1);
		await tick();
		expect(el.innerHTML).toBe('<simple-tag><svelte-retag><span slot="inner1">REPLACE 1</span> REPLACE DEFAULT <span slot="inner2">REPLACE 2</span><!--<Simple>--></svelte-retag></simple-tag>');

		// Clean up
		setReadyState('complete');
	});

	// When render is completed: Test to validate that newly added slots DO NOT rerender component content
	test('complete: newly added slots have no effect', async () => {
		setReadyState('complete');
		expect(document.readyState).toBe('complete');

		el = document.createElement('div');
		el.innerHTML = '<simple-tag>REPLACE DEFAULT</simple-tag>';
		document.body.appendChild(el);

		// Get custom element so we can modify it.
		const root = el.querySelector('simple-tag');
		expect(root).toBeInstanceOf(HTMLElement);

		// Add slot 1 and ensure it actually appears AFTER the <svelte-retag> wrapper, even after awaiting tick().
		let inner1 = document.createElement('span');
		inner1.textContent = 'REPLACE 1';
		inner1.slot = 'inner1';
		root.appendChild(inner1);
		await tick();
		expect(el.innerHTML).toBe('<simple-tag><svelte-retag>Initial 1 REPLACE DEFAULT Initial 2<!--<Simple>--></svelte-retag><span slot="inner1">REPLACE 1</span></simple-tag>');
	});

});
