import svelteRetag from '../../index.js';

import './app.css';
import App from './App.svelte';
import Intro from './lib/Intro.svelte';
import Counter from './lib/Counter.svelte';
import Example from './lib/Example.svelte';

svelteRetag({
	component: App,
	tagname: 'app-tag',
	attributes: ['title'],
});

svelteRetag({
	component: Intro,
	tagname: 'intro-tag',
});

svelteRetag({
	component: Counter,
	tagname: 'counter-tag',
});

svelteRetag({
	component: Example,
	tagname: 'example-tag',
});
