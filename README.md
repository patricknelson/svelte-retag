<img src="logo/svelte-retag.svg" width="348">

# svelte-retag

![Unit Tests](https://github.com/patricknelson/svelte-retag/actions/workflows/unit-tests.yml/badge.svg)

A web component wrapper for Svelte 3 and 4. Embeds your Svelte app or components inside custom elements using the light
DOM _or_ shadow DOM. Automatically forwards all slots and attributes to your Svelte app.

**Demo:** https://svelte-retag.vercel.app/

## Core Features

* 🌟 **Light DOM:** Allows you to render your Svelte components as custom elements in the light DOM as usual.
* 🎰 **Slots & Nesting:** Supports default and named slots in the _light DOM_ (with nesting).
* 🧭 **Context:** Use `setContext()` and `getContext()` and just compose your components as custom elements as you
	normally would ([see live tab demo](https://svelte-retag.vercel.app/)). Supports nesting.
* ⚡ **Vite HMR:** Unlike Svelte, these custom elements are also compatible with Vite's HMR. It avoids the
	infamous `Failed to execute 'define' on 'CustomElementRegistry'` errors.
* 🏃‍♂️ **IIFE/UMD:** Supports building to `iife` and `umd` for eager rendering to the light DOM, as soon as the
	parser encounters the custom element. Reduces CLS (Cumulative Layout Shift), making it interactive more quickly
	_without_ waiting for `defer`'d scripts (such as modules).
* ⚙ **Composability:** `svelte-retag` gives you the flexibility to use your component as you normally would within
	Svelte _and_ as a custom element outside of Svelte (supporting both `<ExampleComponent />` and `<example-component>`).
	For details on how to use with PHP, Python, Ruby, etc., see [Backend Integration](#backend-integration) below.
* 💼 **Portability:** Enables the freedom to utilize your Svelte components anywhere custom elements are supported,
	regardless of the stack (great for upgrading legacy applications).

## Why?

Svelte already allows you to compile your components to custom elements. However, it's missing a few extra features:

* Svelte 3: You have to use shadow DOM (no light DOM compatibility at all)
* Svelte 4: You cannot use slots in the light DOM (https://github.com/sveltejs/svelte/issues/8963), which also means no
	nesting of your web components
* No context support (https://github.com/sveltejs/svelte/issues/8987)
* Vite HMR doesn't work with custom elements (https://github.com/sveltejs/svelte/issues/8681
	and https://github.com/sveltejs/svelte-hmr/issues/26)

## How do I use it?

### Installation & Quick Start

```bash
npm install svelte-retag
```

Check out the [Hello World demo](https://github.com/patricknelson/svelte-retag/tree/main/demo/hello-world) to see it
in action yourself and for instructions on how to get started from scratch.

### <a id="backend-integration" />Backend Integration

If you're running a non-JavaScript backend such as PHP, Python, Ruby, etc. and would still like to use Vite (but cannot
rely solely on Vite for local development),
see [Vite's Backend Integration documentation](https://vitejs.dev/guide/backend-integration.html).
This will guide you on how to run both your specific backend _and_ Vite's development server simultaneously.

#### Svelte vs. SvelteKit

Note that if you already have an existing backend, it is recommended that you just install `svelte` and not
`@sveltejs/kit` since the extra metaframework features of SvelteKit (such as routing) may not be necessary. SvelteKit is
now installed by default in the official documentation, so the extra complexity may be confusing when you are already
running a backend and just using `svelte-retag` to add web components into an existing site.

### Demo Code

Add the following to your main entrypoint. If you are using Vite, this would likely be `src/main.js`.

```javascript
import svelteRetag from 'svelte-retag';
import HelloWorld from './HelloWorld.svelte';

svelteRetag({
	component: HelloWorld,
	tagname: 'hello-world',

	// Optional:
	attributes: true, // Forward all attributes to your component, or set to explicit list of attributes, e.g. ['greetperson'] or leave empty
	shadow: false, // Use the light DOM
	href: '/your/stylesheet.css', // Only necessary if shadow is true
});
```

And in the `HelloWorld.svelte` Svelte component:

```svelte
<script>
	export let greetPerson = 'World';
</script>

<h1>Hello {greetPerson}!</h1>
```

Now anywhere you use the `<hello-world>` tag, you'll get a Svelte component. Note that you must set your tag
name
to [anything containing a dash](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements).

To align with Svelte 4, **attributes** are automatically converted to lowercase (following
the [Lit-style naming convention](https://lit.dev/docs/components/properties/#observed-attributes)). So, `greetPerson`
on your component would be automatically made available as `greetperson` on your custom element.

```html

<hello-world greetperson="Cris"></hello-world>
```

For more info on getting started, take a look at
the [Hello World demo](https://github.com/patricknelson/svelte-retag/tree/main/demo/hello-world).

### Options 🛠

| Option       |   Default    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|--------------|:------------:|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `component`  | _(required)_ | The constructor for your Svelte component (from `import`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `tagname`    | _(required)_ | The custom element tag name to use ([must contain a dash](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `attributes` |     `[]`     | `Array` (legacy): Explicit list of attributes to reactively forward to your component. Attributes must be the lowercase version of your Svelte component props ([similar to Lit](https://lit.dev/docs/components/properties/#observed-attributes)). <br><br> `Boolean` (recommended): If set to `true`, will automatically forward all attributes to your component props. If `false`, will not forward anything. <br><br> **Note:** In v2, this option will be removed and all attributes will be forwarded by default (for consistency with Svelte 4's custom elements, see https://github.com/patricknelson/svelte-retag/issues/36). |
| `shadow`     |   `false`    | Optional. Indicates if this component should use shadow DOM. <br/><br/> **Note:** Only basic support for shadow DOM is currently provided. See https://github.com/patricknelson/svelte-retag/issues/6.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `href`       |     `''`     | Optional. URL to your stylesheet. Allows you to ensure your styles are included in the shadow DOM. This option is only useful when `shadow` is set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

**Note:** For portability, `svelte-retag`'s API is fully backward compatible
with [`svelte-tag@^1.0.0`](https://github.com/crisward/svelte-tag).


<details>
<summary>For experimental options, click here.</summary>

### Experimental Options 👨‍🔬

⚠ **Warning: These features are not production ready and are purely experimental.** ⚠

| Option       | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|--------------|:-------:|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `hydratable` | `false` | Optional. Compatible with Light DOM rendering only. <br><br> If enabled, allows for SSR/SSG of custom elements managed by `svelte-retag` by including extra markup so that they can be initialized client-side from pre-rendered HTML (a.k.a. "hydrated").  See [hydration demo here](https://svelte-retag.vercel.app/hydratable.html). <br><br> **Do not** enable this for regular use on the front-end. Enable this _**only**_ during SSR/SSG to allow for proper initialization and **only** if you plan on re-rendering a second time (e.g. first in SSG/SSR _and then_ finally in-browser). <br><br> **Why does this exist?** <br><br> The initial use case for this is to address rendering bugs in [Percy](https://percy.io) which renders the components 2 times (first in a local headless _Chrome browser_, then a second time in the cloud). |

</details>

## Change Log

### v1

Changes since forking from [`svelte-tag`](https://github.com/crisward/svelte-tag) (upstream):

- Migrate to Vitest for unit testing (see https://github.com/crisward/svelte-tag/pull/14)
- Update logo
- Fix nested slot support (https://github.com/patricknelson/svelte-retag/pull/5)
- Better support for slots during early execution of IIFE compiled packages, i.e. use `MutationObserver` to watch
	for light DOM slots during initial parsing (see https://github.com/patricknelson/svelte-retag/issues/7)
- Support Lit-style lowercase props (see https://github.com/patricknelson/svelte-retag/pull/9)
- Svelte 4 support (tested)
- Support context (see https://github.com/patricknelson/svelte-retag/issues/10, PR
	at https://github.com/patricknelson/svelte-retag/pull/18)
- Add demos to vercel site (see https://github.com/patricknelson/svelte-retag/issues/11)
- Add step-by-step instructions and provided a simple MVP
	example (https://github.com/patricknelson/svelte-retag/pull/24)
- Automatically forward all attributes to component (i.e. `attributes: true`) (https://github.com/patricknelson/svelte-retag/issues/34)
- Add better TypeScript support (https://github.com/patricknelson/svelte-retag/pull/33)

### v2

See the **[milestones page](https://github.com/patricknelson/svelte-retag/milestones)** for changes planned in upcoming
versions. Please be aware that until the version is officially released, the features slated for a particular version
are subject to change!

## Support & Contribution

**Features:** The API for this package is intentionally minimal and features that are outside of the scope of the core
features listed above are not likely to be considered. However, for stability (and due to time constraints), new
features
will still be considered if they are small or will have little or no impact on _existing_ functionality.

To report bugs or improvements, please [open an issue](https://github.com/patricknelson/svelte-retag/issues) and explain
in as much detail as possible what the bug is and how to reproduce it. Please make sure that you only submit an
issue if you have verified that it requires a change to `svelte-retag` itself.

**PR's:** If you'd like to contribute, please feel free to open a PR, **however**: If possible, please attach it to an
existing
issue to ensure that discussion regarding your pull request isn't lost (in case it cannot be merged for whatever
reason).

## Attribution

* Logo - Rich Harris, MIT <http://opensource.org/licenses/mit-license.php>, via Wikimedia Commons
* [`svelte-tag`](https://github.com/crisward/svelte-tag) - Chris Ward ([@crisward](https://github.com/crisward)). This
	package was forked and modified from https://github.com/crisward/svelte-tag (thus the "re" in `svelte-retag`).

