<img src="logo/svelte-retag.svg" width="348">

# svelte-retag

![Node.js Package](https://github.com/patricknelson/svelte-retag/workflows/Node.js%20Package/badge.svg)

A web component wrapper for Svelte. Embeds your Svelte app or components inside custom elements using the light DOM _or_
shadow DOM. Automatically forwards all slots and attributes to your Svelte app.

## Core features

* **Light DOM:** Allows you to render your Svelte 3 components as custom elements in the light DOM as usual (without
	requiring use of the shadow DOM). Doing so allows you to take full advantage of global styles while still maintaining
	encapsulation of your component specific styles, utilizing web fonts and so on.
* **Vite HMR:** Unlike Svelte 3, these custom elements are also compatible with Vite's HMR. It avoids the infamous
	error `Uncaught DOMException: Failed to execute 'define' on 'CustomElementRegistry': the name "example-component" has already been used with this registry`
* **Flexibility:** Allows you to use your component as you normally would within Svelte (`<ExampleComponent />`) _and_
	as a custom element outside of Svelte (`<example-component></example-component>`). You only need to define the
	components that need to be available as custom elements along with their associated tag names.
* **Portability:** Enables the freedom to utilize your Svelte components anywhere custom elements are supported,
	regardless of the stack (great for upgrading legacy applications).

## Why?

Svelte 3 already allows you to compile your components to custom elements. However, it has a couple of flaws:

* All of your nested components have to be implemented as custom elements, since the render flag applies to everything.
* You have to use shadow DOM.
* You have to deal with lots of bugs.
* You loose many features Svelte has for inter-component communication.

## How do I use it?

### Installation

```bash
npm install svelte-retag
```

### Demo code

```javascript
import svelteRetag from 'svelte-retag';
import HelloWorld from 'hello-world.svelte';

svelteRetag({
	component: HelloWorld,
	tagname: 'hello-world',

	// Optional:
	attributes: ['greeting', 'name'],
	shadow: false,
	href: '/your/stylesheet.css', // Only necessary if shadow is true
});
```

Now anywhere you use the `<hello-world>` tag, you'll get a Svelte component. Note that you must set your tag
name
to [anything containing a dash](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements).

```html
<hello-world name="Cris"></hello-world>
```

### Options

| Option     | Default      | Description                                                                                                                                                                         |
|------------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| component  | _(required)_ | The constructor for your Svelte component (from `import`)                                                                                                                           |
| tagname    | _(required)_ | The custom element tag name to use ([must contain a dash](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements))                                   |
| attributes | `[]`         | array -  List of attributes to reactively forward to your component (does not reflect changes inside the component)                                                                 |
| shadow     | `false`      | boolean - Should this component use shadow DOM.<br/> **Note:** Only basic support for shadow DOM is currently provided. See https://github.com/patricknelson/svelte-retag/issues/6. |
| href       | `''`         | link to your stylesheet - Allows you to ensure your styles are included in the shadow DOM (thus only required when `shadow` is set to `true`).                                      |

**Note:** For portability, `svelte-retag`'s API is fully backward compatible
with [`svelte-tag@^1.0.0`](https://github.com/crisward/svelte-tag).

## To Do

On the immediate horizon:

- [x] Migrate to Vitest for unit testing
- [x] Update logo
- [x] Fix nested slot support (https://github.com/patricknelson/svelte-retag/pull/5)
- [ ] ⏳ Better support for slots during early execution of IIFE compiled packages, i.e. use `MutationObserver` to watch
	for light DOM slots during initial parsing (see https://github.com/patricknelson/svelte-retag/issues/7)
- [ ] Support Lit-style lowercase props (see https://github.com/crisward/svelte-tag/issues/16)
- [ ] Support context (see https://github.com/crisward/svelte-tag/issues/8)

## Support & Contribution

The API for this package is intentionally minimal. However, if you have any suggestions, feature
requests or bugs at all, please be sure to [open an issue](https://github.com/patricknelson/svelte-retag/issues) first.

If you'd like to contribute, please feel free to open a PR, **however**: If possible, please attach it to an existing
issue to ensure that discussion regarding your pull request isn't lost (in case it cannot be merged for whatever
reason).

## Attribution

* Logo - Rich Harris, MIT <http://opensource.org/licenses/mit-license.php>, via Wikimedia Commons
* [`svelte-tag`](https://github.com/crisward/svelte-tag) - Chris Ward ([@crisward](https://github.com/crisward)). This
	package was forked and modified from https://github.com/crisward/svelte-tag (thus the "re" in `svelte-retag`).

