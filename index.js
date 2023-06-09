import { createSvelteSlots, findSlotParent } from './utils.js';

/**
 * Object containing keys pointing to slots: Either an actual <slot> element or a document fragment created to wrap
 * default slot content.
 *
 * @typedef {Object.<string, HTMLSlotElement|DocumentFragment>} SlotList
 */

/**
 * Please see README.md for usage information.
 *
 * @param {object} opts Custom element options
 *
 * @param {any}       opts.component  Svelte component instance to incorporate into your custom element.
 * @param {string}    opts.tagname    Name of the custom element tag you'd like to define.
 * @param {string[]?} opts.attributes Optional array of attributes that should be reactively forwarded to the component when modified.
 * @param {boolean?}  opts.shadow     Indicates if we should build the component in the shadow root instead of in the regular ("light") DOM.
 * @param {string?}   opts.href       URL to the CSS stylesheet to incorporate into the shadow DOM (if enabled).
 * @param {boolean?}  opts.debugMode  Hidden option to enable debugging for package development purposes.
 */
export default function(opts) {
	/**
	 * Reserves our special <svelte-retag> custom element container which is used to wrap Svelte components.
	 *
	 * When performing light DOM rendering, this provides the opportunity to isolate the slot content away from the HTML
	 * rendered by the component itself. This is particularly necessary if we're executing early (e.g. via IIFE formatted
	 * bundles and not via native ESM modules, which are deferred) since we need to rerender the component as the parser
	 * progresses along the current element's slot content. This ultimately reduces (if not eliminates) the typical
	 * cumulative layout shift (CLS) seen when injecting components into the DOM like this (especially noticeable on
	 * initial page loads). That CLS typically occurs because ESM modules are deferred (as noted above) but also because
	 * it's difficult to know what the correct/final slot content will be until after the parser has rendered the DOM for
	 * us.
	 */
	if (!window.customElements.get('svelte-retag')) {
		window.customElements.define('svelte-retag', class extends HTMLElement {
			// noop.
		});
	}

	/**
	 * Defines the actual custom element responsible for rendering the provided Svelte component.
	 */
	window.customElements.define(opts.tagname, class extends HTMLElement {
		constructor() {
			super();

			this._debug('constructor()');

			// Setup shadow root early (light-DOM root is initialized in connectedCallback() below).
			if (opts.shadow) {
				this.attachShadow({ mode: 'open' });
				this._root = document.createElement('div');
				this.shadowRoot.appendChild(this._root);

				// Link generated style. Do early as possible to ensure we start downloading CSS (reduces FOUC).
				if (opts.href) {
					let link = document.createElement('link');
					link.setAttribute('href', opts.href);
					link.setAttribute('rel', 'stylesheet');
					this.shadowRoot.appendChild(link);
				}
			}
		}

		/**
		 * Attributes we're watching for changes after render (doesn't affect attributes already present prior to render).
		 *
		 * @returns string[]
		 */
		static get observedAttributes() {
			return opts.attributes || [];
		}

		/**
		 * Attached to DOM.
		 */
		connectedCallback() {
			this._debug('connectedCallback()');

			// TODO: Light DOM: Potential optimization opportunities:
			//  1. Don't bother setup <svelte-retag> wrapper if the component doesn't have a default slot
			//  2. Don't setup <svelte-retag> wrapper if we don't end up processing mutations (i.e. document not in loading state).
			//  If this happens though, we must only setup/destroy in connected/disconnected callbacks and thus anything that
			//  depends upon it needs a separate method of determining. Maybe getter that checks if this._root.tagName === 'SVELTE-RETAG'?

			// Setup the special <svelte-retag> wrapper if not already present (which can happen when
			// disconnected/reconnected due to being in a slot).
			if (!opts.shadow) {
				this._root = document.createElement('svelte-retag');
				this.prepend(this._root);
			}

			// Initialize the slot elements object which retains a reference to the original elements (by slot name) so they
			// can be restored later on disconnectedCallback(). Also useful for debugging purposes.
			this.slotEls = {};

			// Watch for changes to slot elements and ensure they're reflected in the Svelte component.
			if (opts.shadow) {
				this._observeSlots(true);
			} else {
				if (document.readyState === 'loading') {
					// Setup the mutation observer to watch content as parser progresses through the HTML and adds nodes under
					// this element. However, since this is only useful in light DOM elements *during* parsing, we should be sure
					// to stop observing once the HTML is fully parsed and loaded.
					this._observeSlots(true);
					document.addEventListener('DOMContentLoaded', () => {
						this._observeSlots(false);
					});
				}
			}

			// Now that we're connected to the DOM, we can render the component now.
			this._renderSvelteComponent();
		}

		/**
		 * Removed from DOM (could be called inside another custom element that starts rendering after this one). In that
		 * situation, the connectedCallback() will be executed again (most likely with constructor() as well, unfortunately).
		 */
		disconnectedCallback() {
			this._debug('disconnectedCallback()');

			// Disconnect slot mutation observer (if it's currently active).
			this._observeSlots(false);

			// Double check that element has been initialized already. This could happen in case connectedCallback() hasn't
			// fully completed yet (e.g. if initialization is async)
			if (this.componentInstance) {
				try {
					// Clean up: Destroy Svelte component when removed from DOM.
					this.componentInstance.$destroy();
				} catch(err) {
					console.error(`Error destroying Svelte component in '${this.tagName}'s disconnectedCallback(): ${err}`);
				}
			}

			if (!opts.shadow) {
				// Restore slots back to the light DOM in case we're just being appended elsewhere (likely if we're nested under
				// another custom element that initializes after this custom element, thus causing *another* round of
				// construct/connectedCallback on this one).
				this._restoreLightSlots();

				// Lastly, unwinding everything in reverse: Remove the special <svelte-tag> wrapper.
				this.removeChild(this._root);
			}
		}

		/**
		 * Forward modifications to element attributes to the corresponding Svelte prop.
		 *
		 * @param {string} name
		 * @param {string} oldValue
		 * @param {string} newValue
		 */
		attributeChangedCallback(name, oldValue, newValue) {
			this._debug('attributes changed', { name, oldValue, newValue });

			if (this.componentInstance && newValue !== oldValue) {
				this.componentInstance.$set({ [name]: newValue });
			}
		}

		/**
		 * Renders (or rerenders) the Svelte component into this custom element based on the latest properties and slots
		 * (with slots initialized elsewhere).
		 *
		 * NOTE: Despite the intuitive name, this method is private since its functionality requires a deeper understanding
		 * of how it depends on current internal state and how it alters internal state. Be sure to study how it's called
		 * before calling it yourself externally. 🔥🐉
		 */
		_renderSvelteComponent() {
			this._debug('renderSvelteComponent()');

			// Fetch the latest set of available slot elements to use in the render. For light DOM, this must be done prior
			// to clearing inner HTML below since the slots exist there.
			if (opts.shadow) {
				this.slotEls = this._getShadowSlots();
			} else {
				this.slotEls = this._getLightSlots();
			}

			// On each rerender, we have to reset our root container since Svelte will just append to our target.
			this._root.innerHTML = '';

			// Props passed to Svelte component constructor.
			let props = {
				$$scope: {},

				// Convert our list of slots into Svelte-specific slot objects
				$$slots: createSvelteSlots(this.slotEls),

				// All other props are pulled from element attributes (see below)...
			};

			// Populate custom element attributes into the props object.
			// TODO: Inspect component and normalize to lowercase for Lit-style props (https://github.com/crisward/svelte-tag/issues/16)
			Array.from(this.attributes).forEach(attr => props[attr.name] = attr.value);

			// Instantiate component into our root now, which is either the "light DOM" (i.e. directly under this element) or
			// in the shadow DOM.
			this.componentInstance = new opts.component({ target: this._root, props: props });
		}

		/**
		 * Indicates if the provided <slot> element instance belongs to this custom element or not.
		 *
		 * @param {Element} slot
		 * @returns {boolean}
		 */
		_isOwnSlot(slot) {
			let slotParent = findSlotParent(slot);
			if (slotParent === null) return false;
			return (slotParent === this);
		}

		/**
		 * Returns a map of slot names and the corresponding HTMLElement (named slots) or DocumentFragment (default slots).
		 *
		 * IMPORTANT: Since this custom element is the "root", these slots must be removed (which is done in THIS method).
		 *
		 * @returns {SlotList}
		 */
		_getLightSlots() {
			this._debug('_getLightSlots()');
			let slots = {};


			/***************
			 * NAMED SLOTS *
			 ***************/

			// Look for named slots below this element. IMPORTANT: This may return slots nested deeper (see check in forEach below).
			const queryNamedSlots = this.querySelectorAll('[slot]');
			for(let candidate of queryNamedSlots) {
				// Skip this slot if it doesn't happen to belong to THIS custom element.
				if (!this._isOwnSlot(candidate)) continue;

				slots[candidate.slot] = candidate;
				// TODO: Potentially problematic in edge cases where the browser may *oddly* return slots from query selector
				//  above, yet their not actually a child of the current element. This seems to only happen if another
				//  constructor() + connectedCallback() are BOTH called for this particular element again BEFORE a
				//  disconnectedCallback() gets called (out of sync). Only experienced in Chrome when manually editing the HTML
				//  when there were multiple other custom elements present inside the slot of another element (very edge case?)
				this.removeChild(candidate);
			}


			/**************************
			 * DEFAULT SLOT (UNNAMED) *
			 **************************/

			// "Unwrap" the remainder of this tag by iterating through child nodes and placing them into a fragment which
			// we can use as our default slot. Importantly, we need to ensure we skip our special <svelte-retag> wrapper.
			let fragment = document.createDocumentFragment();

			// Important: The conversion of these children to an array is necessary since we are actually modifying the list by calling .appendChild().
			let childNodes = [...this.childNodes];
			let childHTML = '';
			for(let childNode of childNodes) {
				if (childNode instanceof HTMLElement && childNode.tagName === 'SVELTE-RETAG') {
					this._debug('_getLightSlots(): skipping <svelte-retag> container');
					continue;
				}

				// Unfortunately, we must manually build HTML because DocumentFragment can be problematic with this:
				// 1. Deep clone is required in order to put it into another HTMLElement, might be slow
				// 2. Deep clone doesn't work in unit tests
				if (childNode instanceof Text) {
					childHTML += childNode.textContent;
				} else if (childNode.innerHTML) {
					childHTML += childNode.outerHTML;
				}

				fragment.appendChild(childNode);
			}

			// Now that we've rebuilt the default slot content, it could actually be empty (or just whitespace). So, we
			// have to check the HTML in the fragment to see if it has anything in it before trying to use it.
			if (childHTML.trim() !== '') {
				// Now that we've detected remaining content, we've got to make suer we don't already have an explicitly
				// named "default" slot. If one does exist, then we have a conflict.
				if (slots.default) {
					// Edge case: User has a named "default" as well as remaining HTML left over. Use same error as Svelte.
					console.error(`svelteRetag: '${this.tagName}': Found elements without slot attribute when using slot="default"`);
				} else {
					slots.default = fragment;
				}
			}

			return slots;
		}

		/**
		 * Go through originally removed slots and restore back to the custom element.
		 */
		_restoreLightSlots() {
			this._debug('_restoreLightSlots:', this.slotEls);

			for(let slotName in this.slotEls) {
				let slotEl = this.slotEls[slotName];

				// Prepend back so that in case more default slot content has arrived, we can rebuild it in order. This is
				// important if we're executing during document.readyState === 'loading' (i.e. IIFE and not module).
				this.prepend(slotEl);
			}

			// Since the slots are back in the original element, we should clean  up our reference to them. This is because,
			// symbolically and semantically at least, we think of this variable as a holding area ONCE they've been removed.
			this.slotEls = {};
		}

		/**
		 * Fetches and returns references to the existing shadow DOM slots. Left unmodified.
		 *
		 * @returns {SlotList}
		 */
		_getShadowSlots() {
			this._debug('_getShadowSlots()');
			const namedSlots = this.querySelectorAll('[slot]');
			let slots = {};
			let htmlLength = this.innerHTML.length;
			namedSlots.forEach(n => {
				slots[n.slot] = document.createElement('slot');
				slots[n.slot].setAttribute('name', n.slot);
				htmlLength -= n.outerHTML.length;
			});
			if (htmlLength > 0) {
				slots.default = document.createElement('slot');
			}
			return slots;
		}

		/**
		 * Toggle on/off the MutationObserver used to watch for changes in child slots.
		 */
		_observeSlots(begin) {
			// While MutationObserver de-duplicates requests for us, this helps us with reducing noise while debugging.
			if (begin === this.slotObserverActive) return;

			// Setup our slot observer if not done already.
			if (!this.slotObserver) {
				this.slotObserver = new MutationObserver((mutations) => {
					this._processSlotMutations(mutations);
				});
			}

			if (begin) {
				// Subtree: Typically, slots (both default and named) are only ever added directly below. So, keeping
				// subtree false for now since this could be important for light DOM.
				this.slotObserver.observe(this, { childList: true, subtree: false, attributes: false });
				this._debug('_observeSlots: OBSERVE');
			} else {
				this.slotObserver.disconnect();
				this._debug('_observeSlots: DISCONNECT');
			}

			this.slotObserverActive = begin;
		}

		/**
		 * Watches for slot changes, specifically:
		 *
		 * 1. Shadow DOM: All slot changes will trigger a rerender of the Svelte component
		 *
		 * 2. Light DOM: Only additions will be accounted for. This is particularly because currently we only support
		 *    watching for changes during document parsing (i.e. document.readyState === 'loading', prior to the
		 *    'DOMContentLoaded' event.
		 *
		 * @param {MutationRecord[]} mutations
		 */
		_processSlotMutations(mutations) {
			this._debug('_processSlotMutations()', mutations);

			// Rerender if one of the mutations is of a child element.
			let rerender = false;
			for(let mutation of mutations) {
				if (mutation.type === 'childList') {
					// For shadow DOM, it's alright if it's a removal.
					if (opts.shadow) {
						rerender = true;
						break;
					} else {
						// For light DOM, it only matters to rerender on newly added nodes. This is because we're only watching for
						// mutations during initial document parsing. Node removals can happen during the retrieval of light slots in
						// _getLightSlots(). These are necessary, but may cascade into an infinite loop if we're not very careful here.
						if (mutation.addedNodes.length > 0) {
							rerender = true;
							break;
						}
					}
				}
			}

			if (rerender) {
				if (!opts.shadow) {
					// For light DOM, ensure original slots are available by prepending them back to the DOM so we can fetch the
					// latest content. This is important in case the newly visible nodes are part of default content (not just
					// named slots)
					this._observeSlots(false);
					this._restoreLightSlots();
					this._observeSlots(true);
				}

				// Force a rerender now.
				this._debug('_processMutations(): Trigger rerender');
				this._renderSvelteComponent();
			}
		}

		/**
		 * Pass through to console.log() but includes a reference to the custom element in the log for easier targeting for
		 * debugging purposes.
		 *
		 * @param {...*}
		 */
		_debug() {
			if (opts.debugMode) {
				console.log.apply(null, [this, ...arguments]);
			}
		}
	});
}
