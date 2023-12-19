import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';
import Nesting from './Nesting.svelte';
import svelteRetag from '../index.js';
import { syncRaf } from './test-utils.js';

let el = null;
let debugMode = false; // set to 'cli' to see debug output.

describe('<nesting-tag> (Nesting)', () => {

	beforeAll(() => {
		svelteRetag({ component: Nesting, tagname: 'nesting-tag', shadow: false, debugMode });

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

	test('nested (zero levels)', async () => {
		el = document.createElement('div');
		el.innerHTML = '<nesting-tag></nesting-tag>';
		document.body.appendChild(el);

		// Instead of doing direct HTML comparison, use DOM API to ensure the expected <div> is found nested under the parent.
		const nestingTag = el.querySelector('nesting-tag');
		const div = nestingTag.querySelector('div');
		expect(div).not.toBe(null);
	});
	test('nested (one level)', async () => {
		el = document.createElement('div');
		el.innerHTML = '<nesting-tag><nesting-tag></nesting-tag></nesting-tag>';
		document.body.appendChild(el);

		// Same as above, except we should ensure we can find the following hierarchy: nesting-tag > div > nesting-tag > div
		// Also just verify each tag is present as we go down.
		const topNestingTag = el.querySelector('nesting-tag');
		expect(topNestingTag).not.toBe(null);
		const topDiv = topNestingTag.querySelector('div');
		expect(topDiv).not.toBe(null);
		const nestedNestingTag = topDiv.querySelector('nesting-tag');
		expect(nestedNestingTag).not.toBe(null);
		const nestedDiv = nestedNestingTag.querySelector('div');
		expect(nestedDiv).not.toBe(null);
	});
});
