import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';

import ContextParent from './ContextParent.svelte';
import ContextChild from './ContextChild.svelte';
import svelteRetag from '../index.js';
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

	test('nested context (top level does not affect nested context)', async () => {
		el = document.createElement('div');
		el.innerHTML = `
			<!-- Top level (note: data-svelte-retag-* prefixes are used to ensure they are ignored but can be queried below) -->
			<context-parent initialvalue="3" data-svelte-retag-top>
				<context-child></context-child>

				<!-- Nested -->
				<context-parent initialvalue="4" data-svelte-retag-nested>
					<context-child></context-child>
				</context-parent>

			</context-parent>
		`;
		document.body.appendChild(el);
		const parentTop = document.querySelector('[data-svelte-retag-top]');
		const parentNested = document.querySelector('[data-svelte-retag-nested]');

		const parentVal = (level) => level.querySelector('.parent-value').innerHTML;
		const childVal = (level) => level.querySelector('.child-value').innerHTML;

		// Same as above, except we need to ensure that the top level shares values with itself but not with the nested context.
		expect(parentVal(parentTop)).toBe('3');
		expect(childVal(parentTop)).toBe('3');
		expect(parentVal(parentNested)).toBe('4');
		expect(childVal(parentNested)).toBe('4');

		// Apply a change, ensure the change is cascaded but doesn't cascade to the child context.
		parentTop.setAttribute('initialvalue', 5);
		await tick();
		expect(parentVal(parentTop)).toBe('5');
		expect(childVal(parentTop)).toBe('5');
		expect(parentVal(parentNested)).toBe('4'); // should remain unchanged
		expect(childVal(parentNested)).toBe('4'); // should remain unchanged

		// Now update nested, verify parent is unchanged and that the nested has been updated.
		parentNested.setAttribute('initialvalue', 6);
		await tick();
		expect(parentVal(parentTop)).toBe('5');
		expect(childVal(parentTop)).toBe('5');
		expect(parentVal(parentNested)).toBe('6'); // now it should change
		expect(childVal(parentNested)).toBe('6'); // now it should change
	});

	test('nested context (does not affect top level context)', async () => {
		// Create a DOM element with a Svelte component that has a parent and child context
		const el = document.createElement('div');
		el.innerHTML = `
		  <context-parent initialvalue="7" data-svelte-retag-top>
				<context-child></context-child>

				<!-- Nested -->
				<context-parent initialvalue="8" data-svelte-retag-nested>
					<context-child></context-child>
				</context-parent>

		  </context-parent>
		`;
		document.body.appendChild(el);

		// Get references to the top level and nested context elements
		const parentTop = document.querySelector('[data-svelte-retag-top]');
		const parentNested = document.querySelector('[data-svelte-retag-nested]');

		// Get functions to retrieve the values of the parent and child contexts
		const parentVal = (level) => level.querySelector('.parent-value').innerHTML;
		const childVal = (level) => level.querySelector('.child-value').innerHTML;

		// Ensure that the top level and nested contexts have the expected initial values
		expect(parentVal(parentTop)).toBe('7');
		expect(childVal(parentTop)).toBe('7');
		expect(parentVal(parentNested)).toBe('8');
		expect(childVal(parentNested)).toBe('8');

		// Change the initial value of the nested context
		parentNested.setAttribute('initialvalue', 5);
		await tick();

		// Ensure that the change in the nested context does not affect the top level context
		expect(parentVal(parentTop)).toBe('7');
		expect(childVal(parentTop)).toBe('7');
		expect(parentVal(parentNested)).toBe('5');
		expect(childVal(parentNested)).toBe('5');
	});

});
