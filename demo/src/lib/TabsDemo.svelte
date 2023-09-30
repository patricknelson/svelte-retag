<script>
	import { TabsWrapper, TabList, TabPanel, TabButton } from './tabs';
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
				<TabButton>nested three</TabButton>
			</TabList>

			<TabPanel>
				<h2>First nested panel</h2>
			</TabPanel>

			<TabPanel>
				<h2>Second nested panel</h2>
			</TabPanel>

			<TabPanel>
				<h2>Third nested panel</h2>
			</TabPanel>
		</TabsWrapper>
	</TabPanel>

	<TabPanel>
		<h2>Second panel</h2>
	</TabPanel>

	<TabPanel>
		<h2>Third panel</h2>
	</TabPanel>
</TabsWrapper>
