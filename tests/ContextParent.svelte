<script context="module">
	export const CONTEXT_KEY = {};
</script>

<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	export let initialValue = 1;
	const contextualValue = writable(null);

	$: $contextualValue = initialValue;

	setContext(CONTEXT_KEY, contextualValue);
</script>

<div>Parent value: <span class="parent-value">{$contextualValue}</span></div>
<slot>No child</slot>
