import { createSvelteSlots, unwrap, findSlotParent } from './utils.js';

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
	class Wrapper extends HTMLElement {
		constructor() {
			super();

			this._debug('constructor()');
			let root = opts.shadow ? this.attachShadow({ mode: 'open' }) : this;

			// Link generated style (shadow root only). Do early as possible to ensure we start downloading CSS (reduces FOUC).
			if (opts.href && opts.shadow) {
				let link = document.createElement('link');
				link.setAttribute('href', opts.href);
				link.setAttribute('rel', 'stylesheet');
				root.appendChild(link);
			}

			if (opts.shadow) {
				this._root = document.createElement('div');
				root.appendChild(this._root);
			} else {
				this._root = root;
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

			// Setup slot elements, making sure to retain a reference to the original elements prior to processing, so they
			// can be restored later on disconnectedCallback().
			this.slotEls = {};
			if (opts.shadow) {
				this.slotEls = this._getShadowSlots();

				// TODO: Abstract this for reuse in light DOM as well.
				this.mutationObserver = new MutationObserver((mutations) => {
					this._processMutations(mutations);
				});
				this.mutationObserver.observe(this, { childList: true, subtree: true, attributes: false });

			} else {
				this.slotEls = this._getLightSlots();
			}

			// With available slot elements fetched/initialized, we can render the component now.
			this.renderSvelteComponent();
		}

		/**
		 * Removed from DOM (could be called inside another custom element that starts rendering after this one). In that
		 * situation, the connectedCallback() will be executed again (most likely with constructor() as well, unfortunately).
		 */
		disconnectedCallback() {
			this._debug('disconnectedCallback()');

			if (this.mutationObserver) {
				this.mutationObserver.disconnect();
			}

			// Double check that element has been initialized already. This could happen in case connectedCallback() hasn't
			// fully completed yet (e.g. if initialization is async) TODO: May happen later if MutationObserver is setup for light DOM
			if (this.componentInstance) {
				try {
					// Clean up: Destroy Svelte component when removed from DOM.
					this.componentInstance.$destroy();
				} catch(err) {
					console.error(`Error destroying Svelte component in '${this.tagName}'s disconnectedCallback(): ${err}`);
				}
			}

			if (!opts.shadow) {
				// Go through originally removed slots and restore back to the custom element. This is necessary in case
				// we're just being appended elsewhere in the DOM (likely if we're nested under another custom element
				// that initializes after this custom element, thus causing *another* round of construct/connectedCallback
				// on this one).
				for(let slotName in this.slotEls) {
					let slotEl = this.slotEls[slotName];
					this.appendChild(slotEl);
				}
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
		 * TODO: Future optimization: Consider immediately invoking and then throttling subsequent requests. Useful on
		 *  initial parse to reduce unnecessary re-rendering. Unit test would need to account for this delay.
		 */
		renderSvelteComponent() {
			this._debug('renderSvelteComponent()');
			if (!this.slotEls) {
				console.warn(`svelteRetag: '${this.tagName}': renderSvelteComponent() called before slot elements have been initialized. Did connectedCallback() complete successfully?`);
				return;
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
			let slots = {};

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

			// Default slots are indeed allowed alongside named slots, as long as the named slots are elided *first*. We
			// should also make sure we trim out whitespace in case all slots and elements are already removed. We don't want
			// to accidentally pass content (whitespace) to a component that isn't setup with a default slot.
			if (this.innerHTML.trim().length !== 0) {
				if (slots.default) {
					// Edge case: User has a named "default" as well as remaining HTML left over. Use same error as Svelte.
					console.error(`svelteRetag: '${this.tagName}': Found elements without slot attribute when using slot="default"`);
				} else {
					slots.default = unwrap(this);
				}
			}

			return slots;
		}

		/**
		 * Fetches and returns references to the existing shadow DOM slots. Left unmodified.
		 *
		 * @returns {SlotList}
		 */
		_getShadowSlots() {
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
		 * The current number of known slots. This can change over time depending on when this custom element was
		 * initialized, particularly if defined very early in initial page parsing.
		 *
		 * @returns {number}
		 */
		get slotCount() {
			if (this.slotEls) return 0; // Initialized in connectedCallback().
			return Object.keys(this.slotEls).length;
		}

		/**
		 * TODO: Primarily used only for shadow DOM, however, MutationObserver would likely also be useful for IIFE-based
		 *  light DOM, since that is not deferred and technically slots will be added after the wrapping tag's connectedCallback()
		 *  during initial browser parsing and before the closing tag is encountered.
		 *
		 * @param {MutationRecord[]} mutations
		 */
		_processMutations(mutations) {
			this._debug('_processMutations()');

			for(let mutation of mutations) {
				if (mutation.type === 'childList') {

					// Fetch slots again and see if there has been a change in the number of slots. If so, rerender.
					let slots = this._getShadowSlots(); // TODO: Can probably branch here and do light DOM init as well.
					if (this.slotCount !== Object.keys(slots).length) {
						// Retain a reference these slots for render now so we can unwind them on disconnectedCallback().
						this.slotEls = slots;

						// Force a rerender now.
						this.renderSvelteComponent();
					}
				}
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
	}

	window.customElements.define(opts.tagname, Wrapper);
}
