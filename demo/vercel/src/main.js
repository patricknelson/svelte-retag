import svelteRetag from '../../../index.js';

import './app.css';
import App from './App.svelte';
import Intro from './lib/Intro.svelte';
import Counter from './lib/Counter.svelte';
import ExampleTag from './lib/ExampleTag.svelte';
import { TabsWrapper, TabList, TabPanel, TabButton } from './lib/tabs';
import TabsDemo from './lib/TabsDemo.svelte';
import FeaturesInfo from './lib/FeaturesInfo.svelte';
import ExamplesInfo from './lib/ExamplesInfo.svelte';
import TabsInfo from './lib/TabsInfo.svelte';


/**
 * Query string control for testing.
 */
const params = new URLSearchParams(location.search);
const debugMode = !!params.get('debug');
const hydratable = !!params.get('hydratable');
const shadow = !!params.get('shadow');
const shadowStylesheet = ''; // TODO: ISSUE-6: Find good solution for defining this. For now, hack is to inject style[data-vite-dev-id] into shadowRoot.


/**
 * The definitions below are intentionally redundant and kept simple just to demonstrate syntax.
 *
 * This could easily be consolidated by wrapping your own wrapper function. For example, I might normally wrap this in
 * a function like "defineTag(component, tag, attribs)".
 */

svelteRetag({
	component: App,
	tagname: 'app-tag',
	attributes: true,
	debugMode,
	hydratable,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: Intro,
	tagname: 'intro-tag',
	attributes: true,
	debugMode,
	hydratable,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: FeaturesInfo,
	tagname: 'features-info',
	attributes: true,
	debugMode,
	hydratable,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: ExamplesInfo,
	tagname: 'examples-info',
	attributes: true,
	debugMode,
	hydratable,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: TabsInfo,
	tagname: 'tabs-info',
	attributes: true,
	debugMode,
	hydratable,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: Counter,
	tagname: 'counter-tag',
	attributes: true,
	debugMode,
	hydratable,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: ExampleTag,
	tagname: 'example-tag',
	attributes: true,
	debugMode,
	hydratable,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: TabPanel,
	tagname: 'tab-panel',
	attributes: true,
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});


svelteRetag({
	component: TabButton,
	tagname: 'tab-button',
	attributes: true,
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: TabsWrapper,
	tagname: 'tabs-wrapper',
	attributes: true,
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});

svelteRetag({
	component: TabList,
	tagname: 'tab-list',
	attributes: true,
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});


/**
 * Note: This is here for local testing and debugging only. This is just a demonstration of pure svelte-only context
 * (without maintaining that context through svelte-retag).
 */

svelteRetag({
	component: TabsDemo,
	tagname: 'tabs-demo',
	attributes: true,
	hydratable,
	debugMode,
	shadow,
	href: shadowStylesheet,
});
