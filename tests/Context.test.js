import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';

import ContextParent from './ContextParent.svelte';
import ContextChild from './ContextChild.svelte';
import svelteRetag from '../index';
import { syncRaf } from './test-utils.js';
import { tick } from 'svelte';

let el = null;
let debugMode = false; // set to 'cli' to see debug output.

describe('<context-parent> and <context-child> (Shared context between components)', () => {


	beforeAll(() => {
		// NOTE: Defining the child component BEFORE the parent is intentional here.
		svelteRetag({ component: ContextChild, tagname: 'context-child', shadow: false, debugMode });
		svelteRetag({ component: ContextParent, tagname: 'context-parent', shadow: false, debugMode, attributes: ['initialvalue'] });

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


	test('basic context', async () => {
		el = document.createElement('div');
		el.innerHTML = `
			<context-parent>
				<context-child></context-child>
			</context-parent>
		`;
		document.body.appendChild(el);
		const parent = document.querySelector('context-parent');
		const parentVal = () => document.querySelector('.parent-value').innerHTML;
		const childVal = () => document.querySelector('.child-value').innerHTML;

		// Ensure initial (default) value is populated across both.
		expect(parentVal()).toBe('1');
		expect(childVal()).toBe('1');

		// Change value, ensuring that 1.) The attribute is watched successfully, 2.) Context is maintained and 3.) Store is updated
		parent.setAttribute('initialvalue', 2);
		await tick();
		expect(parentVal()).toBe('2');
		expect(childVal()).toBe('2');
	});

	// TODO: nested context

});
