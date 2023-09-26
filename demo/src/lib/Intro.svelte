<!-- Include some basic description about this specific demo page -->
<h2>About this demo</h2>
<slot></slot>

<!-- Demo boilerplate (mostly generic information and performance stuff) -->
<h2>Performance</h2>
<p>You can compare performance in each demo by opening DevTools, disabling cache, and then enabling network throttling
	(e.g. try "Fast 3G").
</p>

<h2>Features</h2>
<p>This demo is implemented entirely using Svelte and placed in the page as custom elements (a.k.a. "web components")
	using <code>svelte-retag</code>. It demonstrates:</p>
<ul>
	<li>Slots (default and named slots)</li>
	<li>Nesting within slots</li>
	<li>The differences between deferred Modules and IIFE, particularly with regard to CLS (Content
		Layout Shift)
	</li>
	<li>Vite HMR updates (if launched locally)</li>
	<li>SSR/SSG + hydration <em>(experimental)</em></li>
</ul>

<p>Note that each counter below takes an initial <code>count</code> attribute with an <code>award</code> value, at which
	point a 🎉 emoji is first displayed (with randomized emojis after that). Press <code>+</code> or <code>-</code> keys on
	your keyboard to quickly increase/decrease the count.</p>
