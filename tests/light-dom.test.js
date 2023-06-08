import { describe, beforeAll, afterEach, test, expect } from 'vitest';
import TestTag from './TestTag.svelte';
import svelteRetag from '../index.js';

// See vite.config.js for configuration details.

// TODO: Needs unit tests to validate attributes/props being handled correctly (at minimum pass through)

let el = null;

/**
 * Naively strips whitespace from HTML in an attempt to allow us to format human comprehensible HTML whilst ensuring
 * consistent comparisons during unit tests (since the parser may return whitespace in unexpected places, but equivalent
 * HTML output).
 */
function normalizeWhitespace(html) {
	html = html.replace(/\s+/g, ' ');

	// Remove space between tags (potentially error prone) TODO: look here in case there are issues in future.
	html = html.replace(/>\s+</g, '><');

	// Finally, leading/trailing spaces.
	return html.trim();
}

describe('Light DOM', () => {

	beforeAll(() => {
		svelteRetag({ component: TestTag, tagname: 'test-tag', shadow: false });
	});

	afterEach(() => {
		el.remove();
	});

	test('without slots', async () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div><!--<TestTag>--></test-tag>');
	});

	test('with just default slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag>BOOM!</test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><h1>Main H1</h1> <div class="content">BOOM! <div>Inner Default</div></div><!--<TestTag>--></test-tag>');
	});

	test('with just inner slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag><div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><h1>Main H1</h1> <div class="content">Main Default <div><div slot="inner">HERE</div></div></div><!--<TestTag>--></test-tag>');
	});

	test('both slots', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag>BOOM!<div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><h1>Main H1</h1> <div class="content">BOOM! <div><div slot="inner">HERE</div></div></div><!--<TestTag>--></test-tag>');
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
		expect(el.innerHTML).toBe('<test-tag><h1>Main H1</h1> <div class="content"><div slot="default">Default already set</div> <div>Inner Default</div></div><!--<TestTag>--></test-tag>');
		expect(errors).toStrictEqual(['svelteRetag: \'TEST-TAG\': Found elements without slot attribute when using slot="default"']);

		// Revert
		console.error = tmp;
	});

	test('inner slot and default slot with other tags', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag><h2>Nested</h2><div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><h1>Main H1</h1> <div class="content"><h2>Nested</h2> <div><div slot="inner">HERE</div></div></div><!--<TestTag>--></test-tag>');
	});

	// Validate that nested slots are working as expected (same tag)
	test('nested slots, same tag', () => {
		const html = `
			<test-tag>
				<h1>TOP: DEFAULT</h1>
				<div slot="inner">TOP: INNER NAMED SLOT</div>

				<!-- Will be shifted above "inner" -->
				<test-tag>
					<h2>NESTED: DEFAULT</h2>
					<div slot="inner">NESTED: INNER NAMED SLOT</div>
				</test-tag>

			</test-tag>
		`;
		const expectRendered = `
			<test-tag>
				<h1>Main H1</h1>
				<div class="content">
					<h1>TOP: DEFAULT</h1>

					<!-- Will be shifted above "inner" -->
					<test-tag>
						<h1>Main H1</h1>
						<div class="content">
							<h2>NESTED: DEFAULT</h2>
							<div><div slot="inner">NESTED: INNER NAMED SLOT</div></div>
						</div>
						<!--<TestTag>-->
					</test-tag>

					<div><div slot="inner">TOP: INNER NAMED SLOT</div></div>
				</div>
				<!--<TestTag>-->
			</test-tag>
		`;

		el = document.createElement('div');
		el.innerHTML = html;
		document.body.appendChild(el);
		expect(normalizeWhitespace(el.innerHTML)).to.equal(normalizeWhitespace(expectRendered));
	});

	// TODO: Validate that nested slots are working as expected (totally different tags/components)

	test('Unknown slot gets ignored', () => {
		let tmp = console.warn;
		console.warn = function() {
		};
		el = document.createElement('div');
		el.innerHTML = '<test-tag><div slot="unknown">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div><!--<TestTag>--></test-tag>');
		console.warn = tmp;
	});
});
