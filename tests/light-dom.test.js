import { describe, beforeAll, afterEach, test, expect } from 'vitest';
import TestTag from './TestTag.svelte';
import svelteRetag from '../index';
import { normalizeWhitespace } from './test-utils.js';

// See vite.config.js for configuration details.

// TODO: Needs unit tests to validate attributes/props being handled correctly (at minimum pass through)

let el = null;

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
		expect(el.innerHTML).toBe('<test-tag><svelte-retag><h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div><!--<TestTag>--></svelte-retag></test-tag>');
	});

	test('with just default slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag>BOOM!</test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><svelte-retag><h1>Main H1</h1> <div class="content">BOOM! <div>Inner Default</div></div><!--<TestTag>--></svelte-retag></test-tag>');
	});

	// TODO: Validate default (unnamed) slots that contain 1.) only whitespace, 2.) comments and whitespace or 3.) only text nodes

	test('with just inner slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag><div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><svelte-retag><h1>Main H1</h1> <div class="content">Main Default <div><div slot="inner">HERE</div></div></div><!--<TestTag>--></svelte-retag></test-tag>');
	});

	test('both slots', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag>BOOM!<div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><svelte-retag><h1>Main H1</h1> <div class="content">BOOM! <div><div slot="inner">HERE</div></div></div><!--<TestTag>--></svelte-retag></test-tag>');
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
		expect(el.innerHTML).toBe('<test-tag><svelte-retag><h1>Main H1</h1> <div class="content"><div slot="default">Default already set</div> <div>Inner Default</div></div><!--<TestTag>--></svelte-retag></test-tag>');
		expect(errors).toStrictEqual(['svelteRetag: \'TEST-TAG\': Found elements without slot attribute when using slot="default"']);

		// Revert
		console.error = tmp;
	});

	test('inner slot and default slot with other tags', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag><h2>Nested</h2><div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><svelte-retag><h1>Main H1</h1> <div class="content"><h2>Nested</h2> <div><div slot="inner">HERE</div></div></div><!--<TestTag>--></svelte-retag></test-tag>');
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
				<svelte-retag>
					<h1>Main H1</h1>
					<div class="content">
						<h1>TOP: DEFAULT</h1>

						<!-- Will be shifted above "inner" -->
						<test-tag>
							<svelte-retag>
								<h1>Main H1</h1>
								<div class="content">
									<h2>NESTED: DEFAULT</h2>
									<div><div slot="inner">NESTED: INNER NAMED SLOT</div></div>
								</div>
								<!--<TestTag>-->
							</svelte-retag>
						</test-tag>

						<div><div slot="inner">TOP: INNER NAMED SLOT</div></div>
					</div>
					<!--<TestTag>-->
				</svelte-retag>
			</test-tag>
		`;

		el = document.createElement('div');
		el.innerHTML = html;
		document.body.appendChild(el);
		expect(normalizeWhitespace(el.innerHTML)).to.equal(normalizeWhitespace(expectRendered));
	});

	// Validate that nested slots are working as expected even when rendered inside another custom element before that parent
	// custom element renders, thus causing a disconnectedCallback() forcing the component to re-render (and potentially losing
	// its slots if not managed properly).
	test('component state is retained when nested component renders before parent component', () => {
		const html = `
			<!-- Declared late -->
			<outer-tag>
				<h1>OUTER DEFAULT</h1>

				<!-- Declared already -->
				<test-tag>
					<h2>INNER DEFAULT</h2>
				</test-tag>
			</outer-tag>
		`;

		const expectBeforeOuterTag = `
			<!-- Declared late -->
			<outer-tag>
				<h1>OUTER DEFAULT</h1>

				<!-- Declared already -->
				<test-tag>
					<svelte-retag>
						<h1>Main H1</h1>
						<div class="content">
							<h2>INNER DEFAULT</h2>
							<div>Inner Default</div>
						</div>
						<!--<TestTag>-->
					</svelte-retag>
				</test-tag>

			</outer-tag>
		`;

		const expectAfterOuterTag = `
			<!-- Declared late -->
			<outer-tag>
				<svelte-retag>
					<h1>Main H1</h1>
					<div class="content">
						<h1>OUTER DEFAULT</h1>

						<!-- Declared already -->
						<test-tag>
							<svelte-retag>
								<h1>Main H1</h1>
								<div class="content">
									<h2>INNER DEFAULT</h2>
									<div>Inner Default</div>
								</div>
								<!--<TestTag>-->
							</svelte-retag>
						</test-tag>

						<div>Inner Default</div>
					</div>
					<!--<TestTag>-->
				</svelte-retag>
			</outer-tag>
		`;

		// Kick off rendering of the already-defined <test-tag> element.
		el = document.createElement('div');
		el.innerHTML = html;
		document.body.appendChild(el);

		// Validate that the outer tag isn't rendered yet.
		expect(normalizeWhitespace(el.innerHTML)).to.equal(normalizeWhitespace(expectBeforeOuterTag));

		// Define the '<outer-tag>' late now even though
		svelteRetag({ component: TestTag, tagname: 'outer-tag', shadow: false });

		// Validate that the otuer tag has rendered AND that the inner tag is still intact.
		expect(normalizeWhitespace(el.innerHTML)).to.equal(normalizeWhitespace(expectAfterOuterTag));
	});

	test('unknown slot gets ignored', () => {
		let tmp = console.warn;
		console.warn = function() {
		};
		el = document.createElement('div');
		el.innerHTML = '<test-tag><div slot="unknown">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><svelte-retag><h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div><!--<TestTag>--></svelte-retag></test-tag>');
		console.warn = tmp;
	});

	// TODO: Test to validate that newly added slots affect rendered component content (for https://github.com/patricknelson/svelte-retag/issues/7)

});
