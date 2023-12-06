import { describe, beforeAll, afterAll, afterEach, test, expect, vi } from 'vitest';
import AttributeCase from './AttributeCase.svelte';
import svelteRetag from '../index.js';
import { syncRaf } from './test-utils.js';

let el = null;

describe('Case: Test custom element attribute name case sensitivity', () => {
	beforeAll(() => {
		svelteRetag({ component: AttributeCase, tagname: 'attrib-case', shadow: false });

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

	test('all: lowercase attributes', () => {

		el = document.createElement('div');
		el.innerHTML = '<attrib-case lowercase="SET" camelcase="SET" uppercase="SET"></attrib-case>';
		document.body.appendChild(el);

		expect(el.querySelector('.lower').innerHTML).toBe('SET');
		expect(el.querySelector('.camel').innerHTML).toBe('SET');
		expect(el.querySelector('.upper').innerHTML).toBe('SET');
	});

	test('all: uppercase attributes', () => {

		el = document.createElement('div');
		el.innerHTML = '<attrib-case LOWERCASE="SET" CAMELCASE="SET" UPPERCASE="SET"></attrib-case>';
		document.body.appendChild(el);

		expect(el.querySelector('.lower').innerHTML).toBe('SET');
		expect(el.querySelector('.camel').innerHTML).toBe('SET');
		expect(el.querySelector('.upper').innerHTML).toBe('SET');
	});

	test('all: mixed case attributes', () => {

		el = document.createElement('div');
		el.innerHTML = '<attrib-case lOwErCaSe="SET" cAmElCaSe="SET" uPpErCaSe="SET"></attrib-case>';
		document.body.appendChild(el);

		expect(el.querySelector('.lower').innerHTML).toBe('SET');
		expect(el.querySelector('.camel').innerHTML).toBe('SET');
		expect(el.querySelector('.upper').innerHTML).toBe('SET');
	});

	test('explicitly empty', () => {

		el = document.createElement('div');
		el.innerHTML = '<attrib-case lowercase="" camelcase="" uppercase=""></attrib-case>';
		document.body.appendChild(el);

		expect(el.querySelector('.lower')).toBe(null);
		expect(el.querySelector('.camel')).toBe(null);
		expect(el.querySelector('.upper')).toBe(null);
	});

	test('implicitly empty', () => {

		el = document.createElement('div');
		el.innerHTML = '<attrib-case></attrib-case>';
		document.body.appendChild(el);

		expect(el.querySelector('.lower').innerHTML).toBe('default');
		expect(el.querySelector('.camel').innerHTML).toBe('default');
		expect(el.querySelector('.upper').innerHTML).toBe('default');
	});

});
