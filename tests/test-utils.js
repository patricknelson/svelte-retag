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


/**
 * Replaces requestAnimationFrame() for tests only. Synchronously and immediately processes the provided callback and
 * ensures that a rAF doesn't end up nested, i.e.: Ensuring each callback is executed to completion AND in order.
 *
 * @param {function} callback
 */
export function syncRaf(callback) {
	rafQueue.push(callback);

	// Immediately begin processing queue, if possible.
	processSyncRaf();
}

let rafQueue = [];
let rafProcessing = false;

function processSyncRaf() {
	// Prevent nesting of requestAnimationFrame processing. Since this is only ever called after an entry has been queued,
	// we can safely skip processing for now until the queue we know is currently running has completed.
	if (rafProcessing) {
		return;
	}

	let timestamp = new Date().getTime();
	let procQueue = rafQueue.slice();
	rafQueue = [];

	rafProcessing = true;
	for(let cb of procQueue) {
		cb(timestamp);
	}
	rafProcessing = false;

	// See if new requestAnimationFrame() callbacks entered the queue and, if so, process through them now.
	if (rafQueue.length > 0) {
		processSyncRaf();
	}
}
