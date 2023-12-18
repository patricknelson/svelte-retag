<p>Credit to <a href="https://stackoverflow.com/users/1990514/amir-pournasserian" target="_blank" rel="noopener">AmirPournasserian</a>
	from
	<a href="https://stackoverflow.com/questions/75024281/how-to-avoid-overwriting-context-in-nested-components-like-tabs-in-svelte" target="_blank" rel="noopener">
		this StackOverflow post</a> for the original <code>.svelte</code> components which were then converted to custom
	elements using <code>svelte-retag</code> to help demonstrate context. These are implemented purely by arranging the
	following tags using only HTML and <em>can even be nested</em>, just like in this demo!</p>

<pre>
&lt;tabs-wrapper&gt;
  &lt;tab-list&gt;
    &lt;tab-button&gt;Tab 1&lt;/tab-button&gt;
    &lt;tab-button&gt;Tab 2&lt;/tab-button&gt;
  &lt;/tab-list&gt;

  &lt;tab-panel&gt;
    &lt;!-- Content for Tab 1 --&gt;
  &lt;/tab-panel&gt;

  &lt;tab-panel&gt;
    &lt;!-- Content for Tab 2 --&gt;
  &lt;/tab-panel&gt;
&lt;/tabs-wrapper&gt;
</pre>

<p>In this example, <code>&lt;tabs-wrapper&gt;</code> defines the shared context and <code>&lt;tab-button&gt;</code>
	toggles between each <code>&lt;tab-panel&gt;</code> within that context.</p>
<p></p>
