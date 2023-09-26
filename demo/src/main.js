import svelteRetag from '../../index.js';

import './app.css';
import App from './App.svelte';
import Intro from './lib/Intro.svelte';
import Counter from './lib/Counter.svelte';
import Example from './lib/Example.svelte';

const params = new URLSearchParams(location.search);
const hydratable = !!params.get('hydratable');

svelteRetag({
	component: App,
	tagname: 'app-tag',
	attributes: ['pagetitle'],
	hydratable,
});

svelteRetag({
	component: Intro,
	tagname: 'intro-tag',
	hydratable,
});

svelteRetag({
	component: Counter,
	tagname: 'counter-tag',
	hydratable,
});

svelteRetag({
	component: Example,
	tagname: 'example-tag',
	hydratable,
});
