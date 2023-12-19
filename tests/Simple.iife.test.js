import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';
import Simple from './Simple.svelte';
import svelteRetag from '../index.js';
import { setReadyState, syncRaf } from './test-utils.js';
import { tick } from 'svelte';

let el = null;
let debugMode = false; // set to 'cli' to see debug output.

describe('IIFE: Early execution tests (light DOM only)', () => {

	beforeAll(() => {
		svelteRetag({ component: Simple, tagname: 'simple-tag', shadow: false, debugMode });

		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(syncRaf);
	});

	afterEach(() => {
		if (el) {
			el.remove();
		}
	});

	afterAll(() => {
		window.requestAnimationFrame.mockRestore();
	});

	// Define a function to get the wrapper HTML
	function getWrapperHtml() {
		return el.querySelector('div').outerHTML;
	}

	// When render is loading: Test to validate that newly added slots affect rendered component content
	test('loading: newly added slots are accounted for in early execution', async () => {
		setReadyState('loading');
		expect(document.readyState).toBe('loading');

		el = document.createElement('div');
		el.innerHTML = '<simple-tag>REPLACE DEFAULT</simple-tag>';
		document.body.appendChild(el);

		expect(getWrapperHtml()).toBe('<div>Initial 1 REPLACE DEFAULT Initial 2</div>');

		// Get custom element so we can modify it.
		const root = el.querySelector('simple-tag');
		expect(root).toBeInstanceOf(HTMLElement);

		// Add slot 2 (in weird order) to ensure it's still positioned properly.
		let inner2 = document.createElement('span');
		inner2.textContent = 'REPLACE 2';
		inner2.slot = 'inner2';
		root.appendChild(inner2);
		await tick();
		expect(getWrapperHtml()).toBe('<div>Initial 1 REPLACE DEFAULT <span slot="inner2">REPLACE 2</span></div>');

		// Finally, set slot 1.
		let inner1 = document.createElement('span');
		inner1.textContent = 'REPLACE 1';
		inner1.slot = 'inner1';
		root.appendChild(inner1);
		await tick();
		expect(getWrapperHtml()).toBe('<div><span slot="inner1">REPLACE 1</span> REPLACE DEFAULT <span slot="inner2">REPLACE 2</span></div>');

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

		// Add slot 1 and ensure it actually appears appended to the end of the tag WITHOUT being hoisted up into the proper slot, even after awaiting tick().
		let inner1 = document.createElement('span');
		inner1.textContent = 'REPLACE 1';
		inner1.slot = 'inner1';
		root.appendChild(inner1);
		await tick();

		// Step 1: Ensure the wrapper HTML doesn't reflect any changes to the inner1 slot.
		expect(getWrapperHtml()).toBe('<div>Initial 1 REPLACE DEFAULT Initial 2</div>');

		// Step 2: Ensure that the OUTER HTML of the main <simple-tag> element appears to have the new HTML for our slot at the END of it.
		// This is because the slot is not hoisted up into the proper slot, but rather appended to the end of the tag.
		let matchingString = '<span slot="inner1">REPLACE 1</span></simple-tag>';
		expect(root.outerHTML.indexOf(matchingString)).toBe(root.outerHTML.length - matchingString.length);
	});

});
