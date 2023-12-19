import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';
import Hydration from './Hydration.svelte';
import svelteRetag from '../index.js';
import { normalizeWhitespace, syncRaf } from './test-utils.js';

let el = null;
let debugMode = false; // set to 'cli' to see debug output.

describe('<hydration-tag>: Incorporation of special hydration attributes and tags', () => {

	beforeAll(() => {
		svelteRetag({ component: Hydration, tagname: 'hydration-tag', shadow: false, debugMode, hydratable: true });

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

	test('hydration with named slot and default content', async () => {
		el = document.createElement('div');
		el.innerHTML = '<hydration-tag><span slot="foo">Named Slot Content</span> Default Slot Content</hydration-tag>';
		document.body.appendChild(el);

		const hydrationTag = el.querySelector('hydration-tag');
		expect(hydrationTag.hasAttribute('data-svelte-retag-hydratable')).toBe(true);

		const namedSlot = hydrationTag.querySelector('span[slot="foo"]');
		expect(namedSlot).not.toBeNull();
		expect(namedSlot.hasAttribute('data-svelte-retag-slot')).toBe(true);

		const defaultSlotWrapper = hydrationTag.querySelector('svelte-retag-default');
		expect(defaultSlotWrapper).not.toBeNull();
		expect(normalizeWhitespace(defaultSlotWrapper.innerHTML)).toBe('Default Slot Content');

		// Also: Ensure that tag is returned back to its original state when disconnectedCallback() is triggered.
		hydrationTag.disconnectedCallback();
		expect(hydrationTag.hasAttribute('data-svelte-retag-hydratable')).toBe(false);

		const namedSlotRestored = hydrationTag.querySelector('span[slot="foo"]');
		expect(namedSlotRestored.hasAttribute('data-svelte-retag-slot')).toBe(false);

		const defaultSlotWrapperRestored = hydrationTag.querySelector('svelte-retag-default');
		expect(defaultSlotWrapperRestored).toBeNull();

		// Edge case: Since el.remove() is called after every test, we have to set it to null since the disconnect has
		// already been fired for this custom element.
		el = null;
	});


	test('hydration with no slotted content at all', async () => {
		el = document.createElement('div');
		el.innerHTML = '<hydration-tag></hydration-tag>';
		document.body.appendChild(el);

		const hydrationTag = el.querySelector('hydration-tag');
		expect(hydrationTag.hasAttribute('data-svelte-retag-hydratable')).toBe(true);

		// Ensure no named slots are returned using the special hydration slot selector.
		const namedSlotDefault = hydrationTag.querySelector('[data-svelte-retag-slot]');
		expect(namedSlotDefault).toBeNull();

		// Same for default slot: Should not exist.
		const defaultSlot = hydrationTag.querySelector('svelte-retag-default');
		expect(defaultSlot).toBeNull();
	});

	test('hydrate from pre-rendered HTML', async () => {
		el = document.createElement('div');
		// TODO: ISSUE-20: <svelte-retag> is still being used here for hydration purposes but could potentially be removed.
		el.innerHTML = `
			<hydration-tag data-svelte-retag-hydratable>
				<svelte-retag>
					<div>
						<span slot="foo" data-svelte-retag-slot>Named Slot Content</span>
						<svelte-retag-default>Default Slot Content</svelte-retag-default>
					</div>
				</svelte-retag>
			</hydration-tag>
		`;
		document.body.appendChild(el);

		// If the component initialized successfully, it will have pulled these slots into its "slotEls" object.
		const hydrationTag = el.querySelector('hydration-tag');
		const slotEls = hydrationTag.slotEls;
		expect(slotEls['foo']).toBeInstanceOf(HTMLSpanElement);
		expect(slotEls['default']).toBeInstanceOf(HTMLElement);
	});


});


describe('<hydration-disabled-tag>: Ensure attributes and tags are not incorporated when hydration is not enabled', () => {

	beforeAll(() => {
		svelteRetag({ component: Hydration, tagname: 'hydration-disabled-tag', shadow: false, debugMode, hydratable: false });
	});

	afterEach(() => {
		if (el) {
			el.remove();
		}
	});

	test('hydration flags are not present when hydration is disabled and slots are still provided', async () => {
		el = document.createElement('div');
		el.innerHTML = '<hydration-disabled-tag><span slot="foo">Named Slot Content</span> Default Slot Content</hydration-disabled-tag>';
		document.body.appendChild(el);

		const hydrationTag = el.querySelector('hydration-disabled-tag');
		expect(hydrationTag.hasAttribute('data-svelte-retag-hydratable')).toBe(false);

		// Ensure no named slots are returned using the special hydration slot selector.
		const namedSlotDefault = hydrationTag.querySelector('[data-svelte-retag-slot]');
		expect(namedSlotDefault).toBeNull();

		// Same for default slot: Should not exist.
		const defaultSlot = hydrationTag.querySelector('svelte-retag-default');
		expect(defaultSlot).toBeNull();
	});

});

