import svelteRetag from '../../index.js';

import './app.css';
import App from './App.svelte';
import Intro from './lib/Intro.svelte';
import Counter from './lib/Counter.svelte';
import Example from './lib/Example.svelte';

const params = new URLSearchParams(location.search);
const debugMode = false;
const hydratable = !!params.get('hydratable');

svelteRetag({
	component: App,
	tagname: 'app-tag',
	attributes: ['pagetitle'],
	debugMode,
	hydratable,
});

svelteRetag({
	component: Intro,
	tagname: 'intro-tag',
	debugMode,
	hydratable,
});

svelteRetag({
	component: Counter,
	tagname: 'counter-tag',
	debugMode,
	hydratable,
});

svelteRetag({
	component: Example,
	tagname: 'example-tag',
	debugMode,
	hydratable,
});


/**
 * TabsWrapper.svelte for testing context
 *
 * TODO: ISSUE-10: WIP
 */

import TabsDemo from './lib/TabsDemo.svelte';
import { TabsWrapper, TabList, TabPanel, TabButton } from './lib/tabs';

svelteRetag({
	component: TabsDemo,
	tagname: 'tabs-demo',
	debugMode,
});

svelteRetag({
	component: TabsWrapper,
	tagname: 'tabs-wrapper',
	debugMode,
});

svelteRetag({
	component: TabList,
	tagname: 'tab-list',
	debugMode,
});

svelteRetag({
	component: TabPanel,
	tagname: 'tab-panel',
	debugMode,
});

svelteRetag({
	component: TabButton,
	tagname: 'tab-button',
	debugMode,
});
