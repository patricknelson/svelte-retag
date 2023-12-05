import svelteRetag from '../../../index.js';

import './app.css';


/**
 * Query string control for testing.
 */
const params = new URLSearchParams(location.search);
const debugMode = !!params.get('debug');
const hydratable = !!params.get('hydratable');
const shadow = !!params.get('shadow');
const shadowStylesheet = ''; // TODO: ISSUE-6: Find good solution for defining this. For now, hack is to inject style[data-vite-dev-id] into shadowRoot.



// Since we have a large number of components, we'll take advantage of Vite's glob import feature to automatically find
// and then define each svelteTag() component and derive the tagname from the filename (see autoDefine() function below).
// NOTE: This example uses eager loading, but you can also use lazy loading by removing the { eager: true } option.
autoDefine(import.meta.glob('./**/*.svelte', { eager: true }), {
	// In case we encounter components that are only a single word, we must have a prefix or suffix to add.
	suffix: 'tag',
}, () => {
	// Extend with additional options, if desired.
	return {
		debugMode,
		hydratable,
		shadow,
		href: shadowStylesheet,
	};
});



// Usage:  autoDefine(import.meta.glob('./**/*.svelte', { eager: true }), { prefix: 'my', suffix: 'tag' }, (tagname, component) => { return { attributes: true, shadow: false }; });
// WARNING: This autoDefine is experimental, and is not recommended for use in production yet. Especially for dynamic imports (i.e. without the eager option set).
// This is for demonstration purposes only, for now. Use at your own risk!

async function autoDefine(modules, {
	prefix = '',
	suffix = ''
} = {}, optionsCallback) {
	// Force prefix to alphanumeric chars in case user accidentally included dashes or other characters.
	prefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
	for (const path in modules) {
		let module = modules[path];

		// Determine if this module was fetched asynchronously (returned as a callable function) or eagerly.
		let component;
		if (module instanceof Function) {
			// TODO: Can be optimized by parallelling this execution. Right now this is called in order (one blocking the other).
			// TODO: Alternatively, could
			component = (await module()).default;
		} else {
			component = module.default;
		}

		// Break name up into words based on capitalized letters and join words with dashes and convert to lowercase so we can
		// convert it to a tag name.
		const name = path.match(/([^/]+)\.svelte$/)[1];
		let words = name.match(/([A-Z][a-z]+)/g);

		// If not using camel case, try to split on dashes or underscores and then failover to a default prefix (if still only one word).
		if (!words) {
			words = name.split(/[-_]/);
		}
		if (words.length === 1) {
			words = [prefix, words[0], suffix].filter(Boolean); // Filter out empty strings.
		}
		const tagname = words.join('-').toLowerCase();

		// Take additional options from callback.
		const options = optionsCallback ? optionsCallback(tagname, component) : {};

		// Go ahead and use svelte-retag to define tag now with inferred options (component and tag) and combine with customized options.
		svelteRetag({
			component,
			tagname,

			// Default to true, since this is likely to vary on a per-component basis. You can override this in the callback.
			attributes: true,

			// Merge customized options.
			...options,
		});
	}

}
