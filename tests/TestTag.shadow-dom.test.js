import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest';
import svelteRetag from '../index.js';
import TestTag from './TestTag.svelte';
import { tick } from 'svelte';
import { syncRaf } from './test-utils.js';

// See vite.config.js for configuration details.

// TODO: Needs unit tests to validate attributes/props being handled correctly (at minimum pass through)

let el = null;

describe('<test-tag> (Shadow DOM)', () => {

	beforeAll(() => {
		svelteRetag({ component: TestTag, tagname: 'test-shad', shadow: true });

		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(syncRaf);
	});

	afterAll(() => {
		window.requestAnimationFrame.mockRestore();
	});

	function getShadowHTML() {
		// fetch the inner HTML from the <main> wrapper tag inside the shadow DOM
		return el.querySelector('test-shad').shadowRoot.querySelector('main').innerHTML;
	}

	test('without slots', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad></test-shad>';
		document.body.appendChild(el);
		expect(getShadowHTML()).toBe('<h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div>');
	});

	test('with just default slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad>Boom</test-shad>';
		document.body.appendChild(el);
		expect(getShadowHTML()).toBe('<h1>Main H1</h1> <div class="content"><slot></slot> <div>Inner Default</div></div>');
		expect(el.querySelector('test-shad').innerHTML).toBe('Boom');
	});

	test('with just inner slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad><div slot="inner">HERE</div></test-shad>';
		document.body.appendChild(el);

		// NOTE: See how the <slot> tag is now present in the shadow DOM, whereas before it was still <div>Inner Default</div>.
		expect(getShadowHTML()).toBe('<h1>Main H1</h1> <div class="content">Main Default <div><slot name="inner"></slot></div></div>');

		// Slot from the light DOM still persists there.
		expect(el.querySelector('test-shad').innerHTML).toBe('<div slot="inner">HERE</div>');
	});

	test('both slots', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad>BOOM!<div slot="inner">HERE</div></test-shad>';
		document.body.appendChild(el);

		// NOTE: See how the <slot> tags are present in the shadow DOM, whereas before it was still <div>Inner Default</div>.
		expect(getShadowHTML()).toBe('<h1>Main H1</h1> <div class="content"><slot></slot> <div><slot name="inner"></slot></div></div>');

		// Slots from the light DOM still persist there.
		expect(el.querySelector('test-shad').innerHTML).toBe('BOOM!<div slot="inner">HERE</div>');
	});

	test('Unknown slot gets ignored', () => {
		// Capture errors and ensure only the expected ones appear below.
		let tmp = console.warn;
		let warnings = [];
		console.warn = function(message) {
			warnings.push(message);
		};

		el = document.createElement('div');
		el.innerHTML = '<test-shad><div slot="unknown">HERE</div></test-shad>';
		document.body.appendChild(el);
		expect(getShadowHTML()).toBe('<h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div>');
		console.warn = tmp;

		// Validate that we got just 1 warning and that it contains 'received an unexpected slot "unknown"'.
		expect(warnings.length).toBe(1);
		expect(warnings[0]).toContain('received an unexpected slot "unknown"');
	});

	test('dynamically adding content to component', async () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad></test-shad>';
		document.body.appendChild(el);
		expect(getShadowHTML()).toBe('<h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div>');

		el.querySelector('test-shad').innerHTML = 'New Content';
		await tick();

		// Verify that the default slot contents have been displaced with the expected <slot> placeholder
		expect(getShadowHTML()).toBe('<h1>Main H1</h1> <div class="content"><slot></slot> <div>Inner Default</div></div>');
	});

});
