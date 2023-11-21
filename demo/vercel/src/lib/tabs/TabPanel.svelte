<script>
	import { getContext } from 'svelte';
	import { TABS } from './TabsWrapper.svelte';

	const panel = {};
	const testContext = getContext(TABS);
	const { registerPanel, selectedPanel } = testContext;

	registerPanel(panel);
	$: active = ($selectedPanel === panel);

</script>

<div class:active>
	<slot/>
</div>


<style>
	div {
		display: none;
	}
	div.active{
		display: block;
	}
</style>
