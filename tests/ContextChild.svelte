<script>
	import { CONTEXT_KEY } from './ContextParent.svelte';
	import { getContext } from 'svelte';

	const contextualValue = getContext(CONTEXT_KEY);
</script>

<div>Child value: <span class="child-value">{$contextualValue}</span></div>
