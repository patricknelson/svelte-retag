import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';
import AttributeChanges from './AttributeChanges.svelte';
import svelteRetag from '../index.js';
import { syncRaf } from './test-utils.js';
import { tick } from 'svelte';

let el = null;

describe('Forwarding of attribute changes', () => {
	beforeAll(() => {
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

	test('default "attributes": no forwarding', async () => {

		// TODO: ISSUE-36: Starting with v2, this test is expected to begin failing (default will be to forward all attributes)

		svelteRetag({ component: AttributeChanges, tagname: 'attrib-changes-default', shadow: false });

		el = document.createElement('div');
		el.innerHTML = '<attrib-changes-default foo="initial 1" bar="initial 2"></attrib-changes-default>';
		document.body.appendChild(el);

		// Get the actual custom element ('el' is just the wrapper!)
		let customEl = el.querySelector('attrib-changes-default');
		expect(customEl.tagName).toBe('ATTRIB-CHANGES-DEFAULT');

		// Verify initial values
		expect(el.querySelector('.foo').innerHTML).toBe('initial 1');
		expect(el.querySelector('.bar').innerHTML).toBe('initial 2');

		// Change values
		customEl.setAttribute('foo', 'changed 1');
		customEl.setAttribute('bar', 'changed 2');
		await tick(); // required for svelte to apply update
		expect(el.querySelector('.foo').innerHTML).toBe('initial 1');
		expect(el.querySelector('.bar').innerHTML).toBe('initial 2');

	});

	test('array "attributes": only forward foo, but not bar', async () => {

		svelteRetag({ component: AttributeChanges, tagname: 'attrib-changes-array', shadow: false, attributes: ['foo'] });

		el = document.createElement('div');
		el.innerHTML = '<attrib-changes-array foo="initial 1" bar="initial 2"></attrib-changes-array>';
		document.body.appendChild(el);

		// Get the actual custom element ('el' is just the wrapper!)
		let customEl = el.querySelector('attrib-changes-array');
		expect(customEl.tagName).toBe('ATTRIB-CHANGES-ARRAY');

		// Verify initial values
		expect(el.querySelector('.foo').innerHTML).toBe('initial 1');
		expect(el.querySelector('.bar').innerHTML).toBe('initial 2');

		// Change values
		customEl.setAttribute('foo', 'changed 1');
		customEl.setAttribute('bar', 'changed 2');
		await tick(); // required for svelte to apply update
		expect(el.querySelector('.foo').innerHTML).toBe('changed 1');
		expect(el.querySelector('.bar').innerHTML).toBe('initial 2');
	});

	test('array "attributes": only forward foo (from default state)', async () => {

		svelteRetag({ component: AttributeChanges, tagname: 'attrib-changes-array-default', shadow: false, attributes: ['foo'] });

		el = document.createElement('div');
		el.innerHTML = '<attrib-changes-array-default></attrib-changes-array-default>';
		document.body.appendChild(el);

		// Get the actual custom element ('el' is just the wrapper!)
		let customEl = el.querySelector('attrib-changes-array-default');
		expect(customEl.tagName).toBe('ATTRIB-CHANGES-ARRAY-DEFAULT');

		// Verify initial values
		expect(el.querySelector('.foo').innerHTML).toBe('default');
		expect(el.querySelector('.bar').innerHTML).toBe('default');

		// Change values
		customEl.setAttribute('foo', 'changed 1');
		customEl.setAttribute('bar', 'changed 2');
		await tick(); // required for svelte to apply update
		expect(el.querySelector('.foo').innerHTML).toBe('changed 1');
		expect(el.querySelector('.bar').innerHTML).toBe('default');
	});

	test('boolean "attributes": forward all attributes if set to true', async () => {

		svelteRetag({ component: AttributeChanges, tagname: 'attrib-changes-boolean', shadow: false, attributes: true });

		el = document.createElement('div');
		el.innerHTML = '<attrib-changes-boolean foo="initial 1" bar="initial 2"></attrib-changes-boolean>';
		document.body.appendChild(el);

		// Get the actual custom element ('el' is just the wrapper!)
		let customEl = el.querySelector('attrib-changes-boolean');
		expect(customEl.tagName).toBe('ATTRIB-CHANGES-BOOLEAN');

		// Verify initial values
		expect(el.querySelector('.foo').innerHTML).toBe('initial 1');
		expect(el.querySelector('.bar').innerHTML).toBe('initial 2');

		// Change values
		customEl.setAttribute('foo', 'changed 1');
		customEl.setAttribute('bar', 'changed 2');
		await tick(); // required for svelte to apply update
		expect(el.querySelector('.foo').innerHTML).toBe('changed 1');
		expect(el.querySelector('.bar').innerHTML).toBe('changed 2');

		/**
		 * Below we are ensuring that MutationObserver is still following changes to attributes even if the element is
		 * removed or relocated.
		 */

		// Remove customEl from parent and append to a new parent
		customEl.remove();
		el.innerHTML = '<div></div>';

		// ... ensure that the parent is empty and that the element is fully disconnected from the DOM (but not garbage collected)
		expect(customEl.parentElement).toBe(null);
		expect(customEl.isConnected).toBe(false);
		expect(el.querySelector('.foo')).toBe(null);
		expect(el.querySelector('.bar')).toBe(null);

		// ... prove that it was relocated in DOM by running last test again but ensuring original values.
		el.appendChild(customEl);
		expect(el.querySelector('.foo').innerHTML).toBe('changed 1');
		expect(el.querySelector('.bar').innerHTML).toBe('changed 2');

		// Change values again and verify once more than changes are reflected
		customEl.setAttribute('foo', 'changed 3');
		customEl.setAttribute('bar', 'changed 4');
		await tick(); // required for svelte to apply update
		expect(el.querySelector('.foo').innerHTML).toBe('changed 3');
		expect(el.querySelector('.bar').innerHTML).toBe('changed 4');

	});

	test('boolean "attributes": forward all attributes if set to true (from default state)', async () => {

		svelteRetag({ component: AttributeChanges, tagname: 'attrib-changes-boolean-default', shadow: false, attributes: true });

		el = document.createElement('div');
		el.innerHTML = '<attrib-changes-boolean-default></attrib-changes-boolean-default>';
		document.body.appendChild(el);

		// Get the actual custom element ('el' is just the wrapper!)
		let customEl = el.querySelector('attrib-changes-boolean-default');
		expect(customEl.tagName).toBe('ATTRIB-CHANGES-BOOLEAN-DEFAULT');

		// Verify initial values
		expect(el.querySelector('.foo').innerHTML).toBe('default');
		expect(el.querySelector('.bar').innerHTML).toBe('default');

		// Change values
		customEl.setAttribute('foo', 'changed 1');
		customEl.setAttribute('bar', 'changed 2');
		await tick(); // required for svelte to apply update
		expect(el.querySelector('.foo').innerHTML).toBe('changed 1');
		expect(el.querySelector('.bar').innerHTML).toBe('changed 2');
	});

});
