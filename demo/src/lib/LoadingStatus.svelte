<script>
	import { getTimePassed } from '../utils.js';
</script>

<p class="loading-status">
	<slot>
		This component rendered after <span>{getTimePassed()}ms</span>.
	</slot>
</p>


<style>
	.loading-status {
		font-weight: bold;
	}

	.loading-status :global(span) {
		color: red;
	}
</style>
