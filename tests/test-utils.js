/**
 * Utility functions for unit tests only.
 */


// Since you can only define it once, let's do that now and then expose a setter to modify it.
let currentReadyState = 'complete';
Object.defineProperty(document, 'readyState', {
	get() { return currentReadyState; }
});
export function setReadyState(state) {
	currentReadyState = state;
}


/**
 * Naively strips whitespace from HTML in an attempt to allow us to format human comprehensible HTML whilst ensuring
 * consistent comparisons during unit tests (since the parser may return whitespace in unexpected places, but equivalent
 * HTML output).
 */
export function normalizeWhitespace(html) {
	html = html.replace(/\s+/g, ' ');

	// Remove space between tags (potentially error prone) TODO: look here in case there are issues in future.
	html = html.replace(/>\s+</g, '><');

	// Finally, leading/trailing spaces.
	return html.trim();
}
