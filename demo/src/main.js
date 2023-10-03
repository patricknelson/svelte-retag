import svelteRetag from '../../index.js';

import './app.css';
import App from './App.svelte';
import Intro from './lib/Intro.svelte';
import Counter from './lib/Counter.svelte';
import Example from './lib/Example.svelte';

const params = new URLSearchParams(location.search);
const debugMode = !!params.get('debug');
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

const shadow = !!params.get('shadow');
const shadowStylesheet = ''; // TODO: ISSUE-6: Find good solution for defining this. For now, hack is to inject style[data-vite-dev-id] into shadowRoot.

svelteRetag({
	component: TabsDemo,
	tagname: 'tabs-demo',
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});


svelteRetag({
	component: TabPanel,
	tagname: 'tab-panel',
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: TabButton,
	tagname: 'tab-button',
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: TabsWrapper,
	tagname: 'tabs-wrapper',
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: TabList,
	tagname: 'tab-list',
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});
