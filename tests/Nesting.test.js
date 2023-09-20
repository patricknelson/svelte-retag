import { describe, beforeAll, afterEach, test, expect } from 'vitest';
import Nesting from './Nesting.svelte';
import svelteRetag from '../index';
import { normalizeWhitespace } from './test-utils.js';

let el = null;
let debugMode = false; // set to 'cli' to see debug output.

describe('<nesting-tag> (Nesting)', () => {

	beforeAll(() => {
		svelteRetag({ component: Nesting, tagname: 'nesting-tag', shadow: false, debugMode });
	});

	afterEach(() => {
		if (el) {
			el.remove();
		}
	});

	const nestedOpen = '<nesting-tag><svelte-retag><div>';
	const nestedClose = '</div><!--<Nesting>--></svelte-retag></nesting-tag>';

	test('nested (zero levels)', async () => {
		el = document.createElement('div');
		el.innerHTML = '<nesting-tag></nesting-tag>';
		document.body.appendChild(el);
		expect(normalizeWhitespace(el.innerHTML)).toBe(nestedOpen + nestedClose);
	});
	test('nested (one level)', async () => {
		el = document.createElement('div');
		el.innerHTML = '<nesting-tag><nesting-tag></nesting-tag></nesting-tag>';
		document.body.appendChild(el);
		expect(normalizeWhitespace(el.innerHTML)).toBe(nestedOpen + nestedOpen + nestedClose + nestedClose);
	});
});
