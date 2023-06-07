import { describe, beforeAll, afterEach, test, expect } from 'vitest';
import TestTag from './TestTag.svelte';
import svelteRetag from '../index.js';

// See vite.config.js for configuration details.

// TODO: Needs unit tests to validate attributes/props being handled correctly (at minimum pass through)

let el = null;

describe('Component Wrapper shadow false', () => {

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

	// TODO: Unit test to validate that an error occurs when they define a "default" named slot but have remaining unslotted elements left over.

	test('inner slot and default slot with other tags', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-tag><h2>Nested</h2><div slot="inner">HERE</div></test-tag>';
		document.body.appendChild(el);
		expect(el.innerHTML).toBe('<test-tag><h1>Main H1</h1> <div class="content"><h2>Nested</h2> <div><div slot="inner">HERE</div></div></div><!--<TestTag>--></test-tag>');
	});

	// TODO: Validate that nested slots are working as expected (totally different tags/components)

	// TODO: Validate that nested slots are working as expected (same tag)

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
