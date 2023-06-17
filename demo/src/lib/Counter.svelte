<script>
	/**
	 * Modified version of the original counter... with a little extra pizzazz. 🎉
	 *
	 * (for demonstration purposes only)
	 */

	import svelteLogo from '../assets/svelte.svg';

	export let count;
	export let award = 100;

	// Since we're taking input ultimately from web components, we know it's likely to be in string form, so always cast
	// input. Do it reactively since the props are reactive (see "accessors" in svelte:options above).
	$: count = Number(count) || 0;
	$: award = Number(award) || 0;

	let initial = count;

	function increment() {
		count += 1;
	}

	function keydown(e) {
		// Increment or decrement depending on if plus/minus keys were pressed.
		// ... allowing "=" in case the user doesn't want to hold down shift (useful if no numpad available on keyboard).
		if (e.key === '+' || e.key === '=') {
			count += 1;
		}
		// ... allowing "_" in case the user is already holding down shift (see above).
		if (e.key === '-' || e.key === '_') {
			count -= 1;
		}

		// Magical reset...
		if (e.key === 'r') {
			count = initial;
		}
	}

	// Spread syntax works best due to the multibyte nature of emojis.
	const emojis = [...'🎊🎉🚀👀🎂🍰🍥🍬😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰😗😙😚🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫🥱😴😌😛😜😝🤤😒😓😔😕🙃🤑😲🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵🥴😠😡🤬😷🤒🤕🤢🤮🤧😇🥳🥺🤠🤡🤥🤫🤭🧐🤓😈🍕🍔🍟🌭🍿🥓🍳🥞🧈🍞🥨🥯🧀🥗🥙🥪🌮🌯🥫🍖🍗🥩🍜🍣🍤🥧🍦🍩🍪'];
	const maxEmojis = emojis.length;

	function getEmoji(count) {
		if (count === award) return '🎉';
		let index = Math.round(Math.random() * (maxEmojis - 1));
		return emojis[index];
	}
</script>


<button on:click={increment} on:keydown={keydown} title="Tip: Press + or - while focused on this button.">
	<img src="{svelteLogo}" alt="svelte logo">
	<slot>Count is</slot> {count} {(count >= award ? getEmoji(count) : '')}
</button>


<style>
	button {
		border-radius: 8px;
		border: 1px solid transparent;
		padding: 0.6em 1.2em;
		font-size: 1em;
		font-weight: 500;
		font-family: inherit;
		background-color: #f9f9f9;
		cursor: pointer;
		transition: border-color 0.25s;
		margin: 10px 0;
		/*color: $dark-text-color;*/
	}

	button:hover {
		border-color: #646cff;
	}

	button:focus,
	button:focus-visible {
		outline-width: 4px;
		outline-style: auto;
	}

	button img {
		width: 15px;
		margin-right: 5px;
		vertical-align: middle;
	}

</style>
