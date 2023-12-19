import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';
import TestTag from './TestTag.svelte';
import svelteRetag from '../index.js';
import { syncRaf } from './test-utils.js';

// See vite.config.js for configuration details.

// TODO: Needs unit tests to validate attributes/props being handled correctly (at minimum pass through)

let el = null;

describe('<test-tag> (Light DOM)', () => {

	beforeAll(() => {
		svelteRetag({ component: TestTag, tagname: 'test-tag', shadow: false });

		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(syncRaf);
	});

	afterEach(() => {
		el.remove();
	});

	afterAll(() => {
		window.requestAnimationFrame.mockRestore();
	});

	function getMainHtml() {
		return el.querySelector('main').innerHTML;
	}

	test('without slots', async () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag></test-tag>';
		document.body.appendChild(el);
		expect(getMainHtml()).toBe('<h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div>');
	});

	test('with just default slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag>BOOM!</test-tag>';
		document.body.appendChild(el);
		expect(getMainHtml()).toBe('<h1>Main H1</h1> <div class="content">BOOM! <div>Inner Default</div></div>');
	});

	test('with just inner slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag><div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(getMainHtml()).toBe('<h1>Main H1</h1> <div class="content">Main Default <div><div slot="inner">HERE</div></div></div>');
	});

	test('both slots', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag>BOOM!<div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(getMainHtml()).toBe('<h1>Main H1</h1> <div class="content">BOOM! <div><div slot="inner">HERE</div></div></div>');
	});

	// Unit test to validate that an error occurs when they define a "default" named slot but have remaining unslotted elements left over.
	test('error when named default conflicts with extra remaining content', () => {
		// Capture errors and ensure only the expected ones appear below.
		let tmp = console.error;
		let errors = [];
		console.error = function(message) {
			errors.push(message);
		};

		el = document.createElement('div');
		el.innerHTML = '<test-tag>Remaining content<div slot="default">Default already set</div></test-tag>';
		document.body.appendChild(el);
		expect(getMainHtml()).toBe('<h1>Main H1</h1> <div class="content"><div slot="default">Default already set</div> <div>Inner Default</div></div>');
		expect(errors).toStrictEqual(['svelteRetag: \'TEST-TAG\': Found elements without slot attribute when using slot="default"']);

		// Revert
		console.error = tmp;
	});

	test('inner slot and default slot with other tags', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag><h2>Nested</h2><div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(getMainHtml()).toBe('<h1>Main H1</h1> <div class="content"><h2>Nested</h2> <div><div slot="inner">HERE</div></div></div>');
	});

	// Validate that nested slots are working as expected (same tag)
	test('nested slots, same tag', () => {
		const html = `
			<test-tag>
				<h1>TOP: DEFAULT</h1>
				<div id="level1" slot="inner">TOP: INNER NAMED SLOT</div>

				<!-- Will be shifted above "inner" -->
				<test-tag>
					<h2>NESTED: DEFAULT</h2>
					<div id="level2" slot="inner">NESTED: INNER NAMED SLOT</div>
				</test-tag>

			</test-tag>
		`;

		el = document.createElement('div');
		el.innerHTML = html;
		document.body.appendChild(el);


		// To easily verify that the nested <test-tag> is hoisted into the default slot ABOVE the "inner" slot, we can simply
		// fetch all the div[slot="inner"] elements and verify that the last one that appears is actually the "level1" div.
		const innerDivs = el.querySelectorAll('div[slot="inner"]');
		expect(innerDivs.length).toBe(2);
		const lastInnerDiv = innerDivs[innerDivs.length - 1];

		// Just verify last has the ID of the "level1" div.
		expect(lastInnerDiv.id).toBe('level1');
	});

	// Validate that nested slots are working as expected even when rendered inside another custom element before that parent
	// custom element renders, thus causing a disconnectedCallback() forcing the component to re-render (and potentially losing
	// its slots if not managed properly).
	test('component state is retained when nested component renders before parent component', () => {
		const html = `
			<!-- Declared late -->
			<outer-tag>
				<h2>OUTER DEFAULT</h2>
				<div id="level1" slot="inner">OUTER INNER NAMED SLOT</div>

				<!-- Declared early -->
				<test-tag>
					<h3>INNER DEFAULT</h3>
					<div id="level2" slot="inner">INNER INNER NAMED SLOT</div>
				</test-tag>
			</outer-tag>
		`;

		// Kick off rendering of the already-defined <test-tag> element.
		el = document.createElement('div');
		el.innerHTML = html;
		document.body.appendChild(el);

		// Validate that the outer tag isn't rendered yet. This can be easily verified by getting the getting div#level1 and
		// ensuring its direct parent is <outer-tag> since it will not have been rendered yet (and nested more deeply).
		const level1 = el.querySelector('#level1');
		expect(level1.parentElement.tagName).toBe('OUTER-TAG');

		// Validate expected slot contents for the inner <test-tag> element. Check that both the default slot contains an h3
		// directly below the .content div and that the inner slot contains the div#level2 element.
		function validateInnerTag() {
			const innerTag = el.querySelector('test-tag');
			const innerH3 = innerTag.querySelector('.content > h3');
			expect(innerH3.textContent).toBe('INNER DEFAULT');
			const innerSlot = innerTag.querySelector('div[slot="inner"]');
			expect(innerSlot.id).toBe('level2');

			// Ensure that the inner tag is below outer tag as expected (nested more deeply now that Svelte has rendered).
			expect(innerTag.closest('outer-tag')).not.toBeNull();
		}
		validateInnerTag();

		// Define the '<outer-tag>' late now even though
		svelteRetag({ component: TestTag, tagname: 'outer-tag', shadow: false });

		// Validate that the outer tag has rendered with all expected slot contents in a similar fashion as the inner tag.
		const outerTag = el.querySelector('outer-tag');
		const outerH2 = outerTag.querySelector('.content > h2');
		expect(outerH2.textContent).toBe('OUTER DEFAULT');

		// The inner slot with the ID of "level1" should actually be the last one since the default slot is above the inner slot.
		const outerInnerSlot = outerTag.querySelectorAll('div[slot="inner"]');
		expect(outerInnerSlot.length).toBe(2);
		const lastOuterInnerSlot = outerInnerSlot[outerInnerSlot.length - 1];
		expect(lastOuterInnerSlot.id).toBe('level1');

		// Finally, double check that the inner tag is still present and in the expected position.
		validateInnerTag();
	});

	test('unknown slot gets ignored', () => {
		// temporarily override the console.warn function so we can validate later that it was called as expected with the expected warnings.
		let tmp = console.warn;
		let warnings = [];
		console.warn = function(message) {
			warnings.push(message);
		};
		el = document.createElement('div');
		el.innerHTML = '<test-tag><div slot="unknown">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(getMainHtml()).toBe('<h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div>');
		console.warn = tmp;

		// Validate that we got just 1 warning and that it contains 'received an unexpected slot "unknown"'.
		expect(warnings.length).toBe(1);
		expect(warnings[0]).toContain('received an unexpected slot "unknown"');
	});
});
