<slot/>

<p>This demo is implemented entirely using Svelte components and placed in the page using custom elements. Its purpose
purely to demonstrate the following</p>

<ul>
	<li>Slots (default and named slots)</li>
	<li>Nesting within slots</li>
	<li>Vite HMR updates (if launched locally)</li>
</ul>

<p>Note that each counter below takes an initial <code>count</code> attribute with an <code>award</code> value, at which
	point a 🎉 emoji is first displayed (with randomized emojis after that). Press <code>+</code> or <code>-</code> keys on
	your keyboard to quickly increase/decrease the count.</p>

<style>
	code {
		background: var(--light-gray);
		padding: 2px 4px;
		border: 1px solid #ccc;
		border-radius: 4px;
		color: #666;
	}
</style>
