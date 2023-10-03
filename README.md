<img src="logo/svelte-retag.svg" width="348">

# svelte-retag

![Unit Tests](https://github.com/patricknelson/svelte-retag/actions/workflows/unit-tests.yml/badge.svg)

A web component wrapper for Svelte 3 and 4. Embeds your Svelte app or components inside custom elements using the light
DOM _or_ shadow DOM. Automatically forwards all slots and attributes to your Svelte app.

**Demo:** https://svelte-retag.vercel.app/

## Core features

* 🌟 **Light DOM:** Allows you to render your Svelte components as custom elements in the light DOM as usual.
* 🎰 **Slots:** Supports default and named slots in the _light DOM_ (supports nesting).
* 🧭 **Context:** Use `setContext()` and `getContext()` and just compose your components as custom elements as you
	normally would ([see live tab demo](https://svelte-retag.vercel.app/)). Supports nesting.
* ⚡ **Vite HMR:** Unlike Svelte, these custom elements are also compatible with Vite's HMR. It avoids the
	infamous `Failed to execute 'define' on 'CustomElementRegistry'` errors.
* 🏃‍♂️ **IIFE/UMD:** Supports building to `iife` and `umd` for eager rendering to the light DOM, as soon as the
	parser encounters the custom element. Reduces CLS (Cumulative Layout Shift), making it interactive more quickly
  _without_ waiting for `defer`'d scripts (such as modules).
* ⚙ **Composability:** `svelte-retag` gives you the flexility to use your component as you normally would within Svelte
	_and_ as a custom element outside of Svelte (supporting both `<ExampleComponent />` and `<example-component>`).
* 💼 **Portability:** Enables the freedom to utilize your Svelte components anywhere custom elements are supported,
	regardless of the stack (great for upgrading legacy applications).

## Why?

Svelte already allows you to compile your components to custom elements. However, it has a couple of flaws:

* All of your nested components have to be implemented as custom elements, since the render flag applies to everything.
* You have to use shadow DOM (Svelte 3, or Svelte 4 if you still want to use slots).
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
	attributes: ['greetperson'],
	shadow: false,
	href: '/your/stylesheet.css', // Only necessary if shadow is true

	// Experimental:
	hydratable: false,
});
```

Now anywhere you use the `<hello-world>` tag, you'll get a Svelte component. Note that you must set your tag
name
to [anything containing a dash](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements).

To align with future versions of Svelte, attributes are automatically converted to lowercase (following
the [Lit-style naming convention](https://lit.dev/docs/components/properties/#observed-attributes)). So, `greetPerson`
on your component would be automatically made available as `greetperson` on your custom element.

```html
<hello-world greetperson="Cris"></hello-world>
```

### Options

| Option     |   Default    | Description                                                                                                                                                                                                                                                                                                                                                                                                |
|------------|:------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| component  | _(required)_ | The constructor for your Svelte component (from `import`)                                                                                                                                                                                                                                                                                                                                                  |
| tagname    | _(required)_ | The custom element tag name to use ([must contain a dash](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements))                                                                                                                                                                                                                                                          |
| attributes |     `[]`     | array -  List of attributes to reactively forward to your component (does not reflect changes inside the component). <br> **Important:** Attributes must be the lowercase version of your Svelte component props ([similar to Lit](https://lit.dev/docs/components/properties/#observed-attributes)).                                                                                                      |
| shadow     |   `false`    | boolean - Should this component use shadow DOM.<br/> **Note:** Only basic support for shadow DOM is currently provided. See https://github.com/patricknelson/svelte-retag/issues/6.                                                                                                                                                                                                                        |
| href       |     `''`     | link to your stylesheet - Allows you to ensure your styles are included in the shadow DOM (thus only required when `shadow` is set to `true`).                                                                                                                                                                                                                                                             |
| hydratable |   `false`    | If enabled, allows for SSR/SSG of custom elements managed by `svelte-retag` by including extra markup so that they can be initialized (or "hydrated") client-side from pre-rendered HTML. Enable this during SSR/SSG to allow for proper initialization. See [hydration demo here](https://svelte-retag.vercel.app/hydratable.html). <br><br>Note: Experimental. Compatible with light DOM rendering only. |

**Note:** For portability, `svelte-retag`'s API is fully backward compatible
with [`svelte-tag@^1.0.0`](https://github.com/crisward/svelte-tag).

## To Do

On the immediate horizon:

- [x] Migrate to Vitest for unit testing (see https://github.com/crisward/svelte-tag/pull/14)
- [x] Update logo
- [x] Fix nested slot support (https://github.com/patricknelson/svelte-retag/pull/5)
- [x] Better support for slots during early execution of IIFE compiled packages, i.e. use `MutationObserver` to watch
	for light DOM slots during initial parsing (see https://github.com/patricknelson/svelte-retag/issues/7)
- [x] Support Lit-style lowercase props (see https://github.com/patricknelson/svelte-retag/pull/9)
- [x] Svelte 4 support (tested)
- [x] Support context (see https://github.com/patricknelson/svelte-retag/issues/10, PR
	at https://github.com/patricknelson/svelte-retag/pull/18)
- [x] Add demos (see https://github.com/patricknelson/svelte-retag/issues/11)

Milestones:

- **v1:** ✅
- **v2:** Utilize Svelte 4's `customElement` syntax, i.e.
	`<svelte:options customElements={...} />` ([documentation](https://github.com/sveltejs/svelte/blob/version-4/site/content/docs/04-run-time.md#custom-element-api),
	see also https://github.com/sveltejs/svelte/pull/8681
	and https://github.com/sveltejs/svelte/issues/8457)

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

