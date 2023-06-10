<script>
	export let lowercase = 'default';
	export let camelCase = 'default';
	export let UPPERCASE = 'default';
</script>

{#if lowercase}
	<div>lowercase: {lowercase}</div>
{/if}

{#if camelCase}
	<div>camelCase: {camelCase}</div>
{/if}

{#if UPPERCASE}
	<div>UPPERCASE: {UPPERCASE}</div>
{/if}

