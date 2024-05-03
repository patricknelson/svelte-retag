import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';
import AttribWarnings from './AttribWarnings.svelte';
import AttribWarningsWithID from './AttribWarningsWithID.svelte';
import svelteRetag from '../index.js';
import { syncRaf } from './test-utils.js';
import { tick } from 'svelte';

let el = null;
let warnings = [];
const debugMode = false; // 'cli' or false

describe('Test attribute warnings', () => {
	beforeAll(() => {
		svelteRetag({ component: AttribWarnings, tagname: 'attrib-warnings-default', shadow: false, debugMode }); // Should default to false.
		svelteRetag({ component: AttribWarnings, tagname: 'attrib-warnings-ignored', shadow: false, ignoreCommonAttribWarnings: true, debugMode });
		svelteRetag({ component: AttribWarningsWithID, tagname: 'attrib-warnings-ignored-with-id', shadow: false, ignoreCommonAttribWarnings: true, debugMode });
		svelteRetag({ component: AttribWarnings, tagname: 'attrib-warnings-specific', shadow: false, ignoreCommonAttribWarnings: ['safelyignore'], debugMode });

		// Since we are testing warnings, we need to get past an internal implementation detail. The very first instantiation
		// of a svelte-retag managed custom element uses a proxy for props in order to detect all props on a component.
		// So, warnings will only ever appear on the second instantiation of a custom element. That's why we're appending
		// these elements here to get past that initial prop detection phase.
		let initEls = document.createElement('div');
		initEls.innerHTML = `
			<attrib-warnings-default></attrib-warnings-default>
			<attrib-warnings-ignored></attrib-warnings-ignored>
			<attrib-warnings-ignored-with-id></attrib-warnings-ignored-with-id>
			<attrib-warnings-specific></attrib-warnings-specific>
		`;
		document.body.appendChild(initEls);

		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(syncRaf);

		vi.spyOn(console, 'warn').mockImplementation(function(message) {
			warnings.push(message);
		});
	});

	afterEach(() => {
		if (el) {
			el.remove();
		}
		warnings = [];
	});

	afterAll(() => {
		vi.restoreAllMocks();
	});

	// Validate that the expected warnings will appear for common fields like "id", "class" and "data-" attributes since they
	// do not exist on the component. This should be alongside expected warnings for the "badprop" attribute.
	test('trigger warnings by default', async () => {
		el = document.createElement('div');
		el.innerHTML = `
			<attrib-warnings-default foo="bar" id="id" class="class" data-foo="data-foo" badprop="no good"></attrib-warnings-default>
		`;
		document.body.appendChild(el);
		await tick();

		// Verify that warnings were triggered for id, class, data-foo and the "always" attribute.
		expect(warnings.length).toBe(4);
		expect(warnings[0]).toContain('id');
		expect(warnings[1]).toContain('class');
		expect(warnings[2]).toContain('data-foo');
		expect(warnings[3]).toContain('badprop');
	});

	// Verify that ignoreCommonAttribWarnings will properly skip those warnings but still triggers on "badprop".
	test('ignore warnings for common attributes', async () => {
		el = document.createElement('div');
		el.innerHTML = `
			<attrib-warnings-ignored foo="bar" id="id" class="class" data-foo="data-foo" badprop="no good"></attrib-warnings-ignored>
		`;
		document.body.appendChild(el);
		await tick();

		// Verify that warnings were triggered for id, class, data-foo and the "always" attribute.
		expect(warnings.length).toBe(1);
		expect(warnings[0]).toContain('badprop');
	});

	// Verify that ignoreCommonAttribWarnings will properly skip those warnings but include "id" since it does exist.
	test('ignore warnings for common attributes', async () => {
		el = document.createElement('div');
		el.innerHTML = `
			<attrib-warnings-ignored-with-id foo="bar" id="unique value here" badprop="no good"></attrib-warnings-ignored-with-id>
		`;
		document.body.appendChild(el);
		await tick();

		// Ensure that "id" made its way into the component (making sure to fetch interior and not wrapping tag which has the attribute on it).
		expect(el.querySelector('attrib-warnings-ignored-with-id').innerHTML).toContain('unique value here');

		// Verify that warnings were triggered for id, class, data-foo and the "always" attribute.
		expect(warnings.length).toBe(1);
		expect(warnings[0]).toContain('badprop');
	});

	// Verify that ignoreCommonAttribWarnings will selectively ignore only those attributes we care about excluding.
	test('ignore warnings for specific attributes', async () => {
		el = document.createElement('div');
		el.innerHTML = `
			<attrib-warnings-specific foo="bar" safelyignore="bad prop but safe to ignore" id="should error" badprop="should error"></attrib-warnings-specific>
		`;
		document.body.appendChild(el);
		await tick();

		// Verify that warnings were triggered for id, class, data-foo and the "always" attribute.
		expect(warnings.length).toBe(2);
		expect(warnings[0]).toContain('id');
		expect(warnings[1]).toContain('badprop');
	});

});
