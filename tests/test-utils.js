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


/**
 * Serialize the composed DOM of a custom element's shadow tree, recursively.
 * No ShadowRoot cloning (jsdom-safe).
 *
 * @param {Element} host            The custom element
 * @param {string|null} rootSelector Optional selector inside shadowRoot (e.g. 'main')
 * @returns {string} HTML string of the composed subtree
 */
export function getShadowHTMLRecursive(host, rootSelector = null) {
	if (!host || !host.shadowRoot) return '';

	const root = rootSelector
		? host.shadowRoot.querySelector(rootSelector) || host.shadowRoot
		: host.shadowRoot;

	const rendered = renderNode(root);
	const wrapper = document.createElement('div');
	wrapper.appendChild(rendered);
	return wrapper.innerHTML;

	// ---- helpers ----

	function renderNode(node) {
		// Text -> clone text
		if (node.nodeType === Node.TEXT_NODE) {
			return document.createTextNode(node.nodeValue || '');
		}

		// Comments/others -> skip
		if (node.nodeType !== Node.ELEMENT_NODE &&
			!(node instanceof ShadowRoot) &&
			!(node instanceof DocumentFragment)) {
			return document.createDocumentFragment();
		}

		// ShadowRoot/DocumentFragment -> render children
		if (node instanceof ShadowRoot || node instanceof DocumentFragment) {
			const frag = document.createDocumentFragment();
			node.childNodes.forEach((c) => frag.appendChild(renderNode(c)));
			return frag;
		}

		const el = /** @type {Element} */ (node);

		// If this is a <slot>, expand it
		if (el.tagName === 'SLOT') {
			const slot = /** @type {HTMLSlotElement} */ (el);
			const assigned = slot.assignedNodes({ flatten: true });
			const nodes = assigned.length ? assigned : slot.childNodes;
			const frag = document.createDocumentFragment();
			nodes.forEach((n) => frag.appendChild(renderNode(n)));
			return frag;
		}

		// If this element is a shadow host, render its shadowRoot INSTEAD of the host tag
		if (/** @type any */ (el).shadowRoot) {
			return renderNode((/** @type any */ (el)).shadowRoot);
		}

		// Plain element: recreate it and copy attributes, then render children
		const out = document.createElement(el.tagName.toLowerCase());
		// copy attributes
		for (const attr of el.attributes) out.setAttribute(attr.name, attr.value);
		el.childNodes.forEach((c) => out.appendChild(renderNode(c)));
		return out;
	}
}
