import { describe, beforeAll, afterEach, test, expect } from 'vitest';
import TestAttributes from './TestAttributes.svelte';
import svelteRetag from '../index';
import { normalizeWhitespace } from './test-utils.js';

let el = null;

describe('Test custom element attributes', () => {
	beforeAll(() => {
		svelteRetag({ component: TestAttributes, tagname: 'test-attribs', shadow: false });
	});

	afterEach(() => {
		if (el) {
			el.remove();
		}
	});

	let allSetOutput = `
		<test-attribs lowercase="SET" camelcase="SET" uppercase="SET">
			<svelte-retag>
				<div>lowercase: SET</div>
				<div>camelCase: SET</div>
				<div>UPPERCASE: SET</div>
				<!--<TestAttributes>-->
			</svelte-retag>
		</test-attribs>
	`;

	test('all: lowercase attributes', () => {

		el = document.createElement('div');
		el.innerHTML = '<test-attribs lowercase="SET" camelcase="SET" uppercase="SET"></test-attribs>';
		document.body.appendChild(el);

		expect(normalizeWhitespace(el.innerHTML)).toBe(normalizeWhitespace(allSetOutput));
	});

	test('all: uppercase attributes', () => {

		el = document.createElement('div');
		el.innerHTML = '<test-attribs LOWERCASE="SET" CAMELCASE="SET" UPPERCASE="SET"></test-attribs>';
		document.body.appendChild(el);

		expect(normalizeWhitespace(el.innerHTML)).toBe(normalizeWhitespace(allSetOutput));
	});

	test('all: mixed case attributes', () => {

		el = document.createElement('div');
		el.innerHTML = '<test-attribs lOwErCaSe="SET" cAmElCaSe="SET" uPpErCaSe="SET"></test-attribs>';
		document.body.appendChild(el);

		expect(normalizeWhitespace(el.innerHTML)).toBe(normalizeWhitespace(allSetOutput));
	});

	test('explicitly empty', () => {

		el = document.createElement('div');
		el.innerHTML = '<test-attribs lowercase="" camelcase="" uppercase=""></test-attribs>';
		document.body.appendChild(el);

		let expectedOutput = `
		<test-attribs lowercase="" camelcase="" uppercase="">
			<svelte-retag>
				<!--<TestAttributes>-->
			</svelte-retag>
		</test-attribs>
	`;

		expect(normalizeWhitespace(el.innerHTML)).toBe(normalizeWhitespace(expectedOutput));
	});

	test('implicitly empty', () => {

		el = document.createElement('div');
		el.innerHTML = '<test-attribs></test-attribs>';
		document.body.appendChild(el);

		let expectedOutput = `
		<test-attribs>
			<svelte-retag>
				<div>lowercase: default</div>
				<div>camelCase: default</div>
				<div>UPPERCASE: default</div>
				<!--<TestAttributes>-->
			</svelte-retag>
		</test-attribs>
	`;

		expect(normalizeWhitespace(el.innerHTML)).toBe(normalizeWhitespace(expectedOutput));
	});

});
