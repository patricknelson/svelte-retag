<script>
	import { getTimePassed } from '../utils.js';
	import LoadingStatus from './LoadingStatus.svelte';

	function getLoadTime() {
		return new Promise((resolve) => {
			window.addEventListener('DOMContentLoaded', () => {
				resolve(getTimePassed());
			});
		});
	}

</script>


<!-- Include some basic description about this specific demo page -->
<slot></slot>
<hr>


<!-- Demo boilerplate (mostly generic information and performance stuff) -->

<h2>Performance</h2>
<p>You can compare performance in each demo by opening DevTools, disabling cache, and then
	enabling network throttling (e.g. try "Fast 3G"). This page actually loads <code>angular.js</code> in a <code>&lt;script&gt;</code>
	tag lower in the page which causes the time to <code>DOMContentLoaded</code> to increase on slower connections.
</p>

<LoadingStatus>
	{#await getLoadTime()}
		Loading...
	{:then duration}
		DOMContentLoaded in <span>{duration}ms</span>.
	{/await}
</LoadingStatus>

<hr>


<p>This demo is implemented entirely using Svelte components and placed in the page using custom elements. Its purpose
	purely to demonstrate the following:</p>

<ul>
	<li>Slots (default and named slots)</li>
	<li>Nesting within slots</li>
	<li>The speed differences between deferred ESM vs. IIFE (on large pages), particularly with regard to CLS (Content
		Layout Shift)
	</li>
	<li>Vite HMR updates (if launched locally)</li>
	<li>SSR/SSG + hydration <em>(experimental)</em></li>
</ul>

<p>Note that each counter below takes an initial <code>count</code> attribute with an <code>award</code> value, at which
	point a 🎉 emoji is first displayed (with randomized emojis after that). Press <code>+</code> or <code>-</code> keys on
	your keyboard to quickly increase/decrease the count.</p>
