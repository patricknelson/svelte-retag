import { beforeAll, describe, expect, test } from 'vitest';
import svelteRetag from '../index.js';
import TestTag from './TestTag.svelte';
import { tick } from 'svelte';

// See vite.config.js for configuration details.

// TODO: Needs unit tests to validate attributes/props being handled correctly (at minimum pass through)

let el = null;

describe('<test-tag> (Shadow DOM)', () => {

	beforeAll(() => {
		svelteRetag({ component: TestTag, tagname: 'test-shad', shadow: true });
	});

	test('without slots', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad></test-shad>';
		document.body.appendChild(el);
		let shadowhtml = el.querySelector('test-shad').shadowRoot.innerHTML;
		expect(shadowhtml).toBe('<div><h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div><!--<TestTag>--></div>');
	});

	test('with just default slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad>Boom</test-shad>';
		document.body.appendChild(el);
		let shadowhtml = el.querySelector('test-shad').shadowRoot.innerHTML;
		expect(shadowhtml).toBe('<div><h1>Main H1</h1> <div class="content"><slot></slot> <div>Inner Default</div></div><!--<TestTag>--></div>');
		expect(el.querySelector('test-shad').innerHTML).toBe('Boom');
	});

	test('with just inner slot', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad><div slot="inner">HERE</div></test-shad>';
		document.body.appendChild(el);
		let shadowhtml = el.querySelector('test-shad').shadowRoot.innerHTML;
		expect(shadowhtml).toBe('<div><h1>Main H1</h1> <div class="content">Main Default <div><slot name="inner"></slot></div></div><!--<TestTag>--></div>');
	});

	test('both slots', () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad>BOOM!<div slot="inner">HERE</div></test-shad>';
		document.body.appendChild(el);
		let shadowhtml = el.querySelector('test-shad').shadowRoot.innerHTML;
		// TODO: Why does this not produce the inner HERE? Maybe just my ignorance.
		expect(shadowhtml).toBe('<div><h1>Main H1</h1> <div class="content"><slot></slot> <div><slot name="inner"></slot></div></div><!--<TestTag>--></div>');
	});

	test('Unknown slot gets ignored', () => {
		let tmp = console.warn;
		console.warn = function() {
		};
		el = document.createElement('div');
		el.innerHTML = '<test-shad><div slot="unknown">HERE</div></test-shad>';
		document.body.appendChild(el);
		let shadowhtml = el.querySelector('test-shad').shadowRoot.innerHTML;
		expect(shadowhtml).toBe('<div><h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div><!--<TestTag>--></div>');
		console.warn = tmp;
	});

	test('dynamically adding content to component', async () => {
		el = document.createElement('div');
		el.innerHTML = '<test-shad></test-shad>';
		document.body.appendChild(el);
		let shadowhtml = document.querySelector('test-shad').shadowRoot.innerHTML;
		expect(shadowhtml).toBe('<div><h1>Main H1</h1> <div class="content">Main Default <div>Inner Default</div></div><!--<TestTag>--></div>');
		document.querySelector('test-shad').innerHTML = 'New Content';
		await tick();
		shadowhtml = document.querySelector('test-shad').shadowRoot.innerHTML;
		expect(shadowhtml).toBe('<div><h1>Main H1</h1> <div class="content"><slot></slot> <div>Inner Default</div></div><!--<TestTag>--></div>');
	});

});
