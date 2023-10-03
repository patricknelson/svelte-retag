<script>
	import retagLogo from '../../logo/svelte-retag.svg';

	export let pageTitle = 'Demo';
	export let page = '';

	const pages = [
		{
			alias: 'index',
			title: 'Module',
			url: 'index.html',
		},
		{
			alias: 'hydratable',
			title: 'Module with Hydration',
			url: (import.meta.env.DEV ? 'hydratable.source.html' : 'hydratable.html'),
		},
		{
			alias: 'iife',
			title: 'IIFE/UMD',
			url: 'iife.html',
		},
	];
</script>


<main>
	<div>
		<a href="https://github.com/patricknelson/svelte-retag/" target="_blank" rel="noreferrer">
			<img src={retagLogo} class="logo" alt="svelte-retag logo (link to GitHub repo)"/> </a>
	</div>

	<!-- Simple navigation between demos -->
	<nav>
		Demos:
		<ul>
		{#each pages as pageInfo}
			<li><a href="{pageInfo.url}" class:current={page === pageInfo.alias}>{pageInfo.title}</a></li>
		{/each}
		</ul>
	</nav>

	{#if pageTitle}
		<h1>{pageTitle}</h1>
	{/if}

	<!-- Entirety of remaining page content in the slot below -->
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

	nav {
		font-weight: bold;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: inline-flex;
	}

	li:first-child {
		border-left: 0;
	}

	li {
		border-left: 1px solid #ccc;
		padding: 0 10px;
	}

	a.current {
		color: var(--orange);
		text-decoration: underline;
	}


	@media (min-width: 970px) {
		main {
			width: 900px;
		}
	}

</style>
