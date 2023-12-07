<script>
	export let lowercase = 'default';
	export let camelCase = 'default';
	export let UPPERCASE = 'default';
</script>

{#if lowercase}
	<div>lowercase: <span class="lower">{lowercase}</span></div>
{/if}

{#if camelCase}
	<div>camelCase: <span class="camel">{camelCase}</span></div>
{/if}

{#if UPPERCASE}
	<div>UPPERCASE: <span class="upper">{UPPERCASE}</span></div>
{/if}

