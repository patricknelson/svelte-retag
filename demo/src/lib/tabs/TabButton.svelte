<script>
	import { getContext } from 'svelte';
	import { TABS } from './TabsWrapper.svelte';

	const tab = {};
	const { registerTab, selectTab, selectedTab } = getContext(TABS);

	registerTab(tab);
</script>

<style>
	button {
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: 0;
		margin: 0;
	}

	.selected {
		border-bottom: 2px solid var(--orange);
	}
	.selected span { /* see below */
		opacity: 1;
	}

	/* Wrapping with a span, since I wish we could just dynamically mix in alpha to an existing HEX code instead of using RGB vars. */
	span {
		color: var(--text-color);
		opacity: 0.2;
	}
</style>

<button class:selected="{$selectedTab === tab}" on:click="{() => selectTab(tab)}">
	<span>
		<slot></slot>
	</span>
</button>
