<!-- This could have been simpler (e.g. a "title" prop), however this was intentionally setup to demonstrate named slots. -->

<div class="wrapper">
	<div class="title"><slot name="title"></slot></div>
	<div class="content"><slot name="content"></slot></div>
</div>

<style>
	.wrapper {
		display: flex;
		gap: 40px;
		max-width: 800px;
	}
	.wrapper > div {
		width: 50%;
	}
	.title {
		font-weight: bold;
	}
</style>
