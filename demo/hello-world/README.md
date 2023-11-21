# svelte-retag: Hello World

This is an **MVP** demo that shows `svelte-retag` in action in its simplest form in local development with a
`HelloWorld.svelte` component implemented as a `<hello-world>` custom element.

To try it out yourself, make sure you have [Git](https://git-scm.com/downloads) and [Node](https://nodejs.org/) installed and then run:

```bash
git clone https://github.com/patricknelson/svelte-retag.git
cd svelte-retag/demo/hello-world
npm install
npm run dev
```

Then open your browser to [http://localhost:5173/](http://localhost:5173/) to view the demo.

## Starting from Scratch

For new projects, you can start with `svelte-retag` by creating a [Vite](https://vitejs.dev/) project like so:

1. `npm create vite@latest` and select `Svelte` as your framework and `JavaScript` as your variant (or `TypeScript` if
	 you prefer).
    - **Note:** Don't select `SvelteKit` if you're already running another backend (e.g. PHP or Python, see [Backend Integrat](https://github.com/patricknelson/svelte-retag#backend-integration) for details).
2. `cd` into your new project
3. Run `npm install svelte-retag`
4. Run `npm run dev` to start the Vite development server and open http://localhost:5173/ in your browser
5. Create your Svelte components and define your custom elements (web components) using `svelteRetag()` in `src/main.js` as described below, e.g.

	  ```javascript
		import svelteRetag from 'svelte-retag';
		import HelloWorld from './HelloWorld.svelte';

		svelteRetag({
			component: HelloWorld,
			tagname: 'hello-world',
		});
		```
6. In `index.html`, remove `<div id="app"></div>` and instead add your custom elements to your `index.html` (e.g.
	 `<hello-world greetperson="👩‍🚀"></hello-world>`).


**Note:** No modifications are required to your `vite.config.js` or `svelte.config.js` files. Keep in mind that the
`customElement` compiler option _does not_ need to be enabled since we are replacing that functionality entirely
with `svelte-retag`.
