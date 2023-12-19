<script>
	import { TabsWrapper, TabList, TabPanel, TabButton } from './tabs';
	import Counter from './counter-tag.svelte';
</script>

<TabsWrapper>
	<TabList>
		<TabButton>one</TabButton>
		<TabButton>two</TabButton>
		<TabButton>three</TabButton>
	</TabList>

	<TabPanel>
		<TabsWrapper>
			<TabList>
				<TabButton>nested one</TabButton>
				<TabButton>nested two</TabButton>
			</TabList>

			<TabPanel>
				<h2>First nested panel</h2>
				<Counter count={1} award={5} />
			</TabPanel>

			<TabPanel>
				<h2>Second nested panel</h2>
				<Counter count={2} award={5} />
			</TabPanel>
		</TabsWrapper>
	</TabPanel>

	<TabPanel>
		<h2>Second panel</h2>
		<Counter count={3} award={5} />
	</TabPanel>

	<TabPanel>
		<h2>Third panel</h2>
		<Counter count={4} award={5} />
	</TabPanel>
</TabsWrapper>
