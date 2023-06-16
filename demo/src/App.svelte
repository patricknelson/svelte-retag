<script>
	import retagLogo from '../../logo/svelte-retag.svg';
	import Counter from './lib/Counter.svelte';
</script>

<main>
	<div>
		<a href="https://github.com/patricknelson/svelte-retag/" target="_blank" rel="noreferrer">
			<img src={retagLogo} class="svelte-retag logo"/>
		</a>
	</div>
	<h1>Module Demo</h1>
	<p>See <a href="iife.html">IIFE demo</a>.</p>

	<div class="card">
		<!-- TODO: Refactor this App.svelte to instead be static index and then convert Counter component below to custom element tag with svelte-retag -->
		<Counter/>
	</div>

</main>

<style>
	.logo {
		height: 6em;
		padding: 1.5em;
		will-change: filter;
		transition: filter 300ms;
	}

	.logo:hover {
		filter: drop-shadow(0 0 2em #ff3e00aa);
	}

	.read-the-docs {
		color: #888;
	}
</style>
