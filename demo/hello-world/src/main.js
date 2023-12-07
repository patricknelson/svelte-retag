import svelteRetag from 'svelte-retag';
import HelloWorld from './HelloWorld.svelte';

svelteRetag({
	component: HelloWorld,
	tagname: 'hello-world',
	attributes: true,
});
