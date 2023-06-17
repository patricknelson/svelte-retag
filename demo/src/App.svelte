<script>
	import retagLogo from '../../logo/svelte-retag.svg';
	export let title = 'Demo';
</script>

<main>
	<div>
		<a href="https://github.com/patricknelson/svelte-retag/" target="_blank" rel="noreferrer">
			<img src={retagLogo} class="logo" alt="svelte-retag logo (link to GitHub repo)"/> </a>
	</div>

	{#if title}
		<h1>{title}</h1>
	{/if}


	<slot/>

</main>

<style>
	div {
		margin: 1.5em 0;
	}

	.logo {
		height: 6em;
		will-change: filter;
		transition: filter 300ms;
	}

	.logo:hover {
		filter: drop-shadow(0 0 2em #ff3e00aa);
	}
</style>
