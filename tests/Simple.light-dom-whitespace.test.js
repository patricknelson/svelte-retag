import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';
import Simple from './Simple.svelte';
import svelteRetag from '../index';
import { normalizeWhitespace, syncRaf } from './test-utils.js';

let el = null;
let debugMode = false; // set to 'cli' to see debug output.

describe('<simple-tag> (Light DOM)', () => {

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

	const unmodifiedOutput = '<simple-tag><svelte-retag>Initial 1 Initial Initial 2<!--<Simple>--></svelte-retag></simple-tag>';

	test('whitespace is ignored in unnamed default slot (single space)', async () => {
		el = document.createElement('div');
		el.innerHTML = '<simple-tag> </simple-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe(unmodifiedOutput);
	});

	test('whitespace is ignored in unnamed default slot (mixed space 1)', async () => {
		el = document.createElement('div');
		el.innerHTML = '<simple-tag>\t \n \r</simple-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe(unmodifiedOutput);
	});

	test('whitespace is ignored in unnamed default slot (mixed space 2)', async () => {
		el = document.createElement('div');
		el.innerHTML = `
			<simple-tag>


			</simple-tag>
`;
		document.body.appendChild(el);
		expect(el.innerHTML.trim()).toBe(unmodifiedOutput);
	});

	test('comments ignored in unnamed default slot', async () => {
		el = document.createElement('div');
		el.innerHTML = '<simple-tag><!-- comment --></simple-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe(unmodifiedOutput);
	});

	test('comments mixed with whitespace ignored in unnamed default slot', async () => {
		el = document.createElement('div');
		el.innerHTML = `
			<simple-tag>
				<!-- comment -->
			</simple-tag>
`;
		document.body.appendChild(el);
		expect(el.innerHTML.trim()).toBe(unmodifiedOutput);
	});

	test('text nodes surrounding comments still gets slotted in unnamed default slot', async () => {
		el = document.createElement('div');
		el.innerHTML = `
			<simple-tag>
				a <!-- comment --> b
			</simple-tag>
`;
		document.body.appendChild(el);
		expect(normalizeWhitespace(el.innerHTML)).toBe('<simple-tag><svelte-retag>Initial 1 a <!-- comment --> b Initial 2<!--<Simple>--></svelte-retag></simple-tag>');
	});

});
