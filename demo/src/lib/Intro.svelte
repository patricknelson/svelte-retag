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

<slot/>

<p>This demo is implemented entirely using Svelte components and placed in the page using custom elements. Its purpose
	purely to demonstrate the following:</p>

<ul>
	<li>Slots (default and named slots)</li>
	<li>Nesting within slots</li>
	<li>The speed differences between deferred ESM vs. IIFE (on large pages), particularly with regard to CLS (Content Layout Shift)</li>
	<li>Vite HMR updates (if launched locally)</li>
</ul>

<p><strong>Performance:</strong> To see the performance improvement of IIFE based component rendering, open DevTools, disable
	cache, and enable network throttling (select "Fast 3G"). This page actually loads <code>angular.js</code> in a
	<code>&lt;script&gt;</code> tag lower in the page which causes the final <code>DOMContentLoaded</code> to to increase
	dramagically on slower connections.
</p>

<LoadingStatus>
	{#await getLoadTime()}
		Loading...
	{:then duration}
		DOMContentLoaded in <span>{duration}ms</span>.
	{/await}
</LoadingStatus>

<hr>

<p>Note that each counter below takes an initial <code>count</code> attribute with an <code>award</code> value, at which
	point a 🎉 emoji is first displayed (with randomized emojis after that). Press <code>+</code> or <code>-</code> keys on
	your keyboard to quickly increase/decrease the count.</p>

<style>
	code {
		background: var(--light-gray);
		padding: 2px 4px;
		border: 1px solid #ccc;
		border-radius: 4px;
		color: #666;
	}

	.loading-status {
		font-weight: bold;
	}

	.loading-status span {
		color: red;
	}
</style>
