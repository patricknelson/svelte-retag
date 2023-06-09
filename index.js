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

			// Setup our slot observer now so we can watch for changes to slot elements later (if needed).
			this.slotObserver = new MutationObserver((mutations) => {
				this._processSlotMutations(mutations);
			});
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

			// Setup the special <svelte-retag> wrapper if not already present (which can happen when
			// disconnected/reconnected due to being in a slot).
			// TODO: Not 100% sure why the tag remains despite this.innerHTML being reset, so this is a workaround for now...
			if (!opts.shadow) {
				let firstChild = this.firstElementChild;
				if (firstChild instanceof HTMLElement && firstChild.tagName === 'SVELTE-RETAG') {
					this._root = firstChild;
				} else {
					this._root = document.createElement('svelte-retag');
					this.prepend(this._root);
				}
			}

			// Watch for changes to slot elements and ensure they're reflected in the Svelte component.
			// TODO: WIP: Currently only applies to shadow DOM mode.
			if (opts.shadow) {
				this._observeSlots(true);
			} else {
				//this._observeSlots(true); // TODO: WIP
			}

			// Now that we're connected to the DOM, we can render the component now.
			this.renderSvelteComponent();
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

			// Fetch the latest set of available slot elements to use in the render. For light DOM, this must be done prior
			// to clearing inner HTML below since the slots exist there.
			let slotEls = {};
			if (opts.shadow) {
				slotEls = this._getShadowSlots();
				this._observeSlots(true);
			} else {
				slotEls = this._getLightSlots();
			}

			// On each rerender, we have to reset our root container since Svelte will just append to our target.
			this._root.innerHTML = '';

			// Props passed to Svelte component constructor.
			let props = {
				$$scope: {},

				// Convert our list of slots into Svelte-specific slot objects
				$$slots: createSvelteSlots(slotEls),

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

			// Since we must remove slots from the DOM, take a snapshot of the entire contents now prior to removal + render.
			this.slotHtmlSnapshot = this.innerHTML;


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
			this.innerHTML = this.slotHtmlSnapshot;
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
		_observeSlots(begin = true) {
			if (begin) {
				// TODO: Light DOM: Consider setting this up ONLY while document.readyState === loading

				// TODO: Subtree: Typically, slots (both default and named) are only ever added directly below. So, keeping
				//  subtree false for now since this could be important for light DOM.
				this.slotObserver.observe(this, { childList: true, subtree: false, attributes: false });
			} else {
				this.slotObserver.disconnect();
			}

			this.slotObserverActive = begin;
		}

		/**
		 * TODO: Primarily used only for shadow DOM, however, MutationObserver would likely also be useful for IIFE-based
		 *  light DOM, since that is not deferred and technically slots will be added after the wrapping tag's connectedCallback()
		 *  during initial browser parsing and before the closing tag is encountered.
		 *
		 * @param {MutationRecord[]} mutations
		 */
		_processSlotMutations(mutations) {
			this._debug('_processSlotMutations()');

			// Rerender if one of the mutations is of a child element.
			// TODO: Light DOM: Problematic if this is coming from Svelte itself.
			let rerender = false;
			for(let mutation of mutations) {
				if (mutation.type === 'childList') {
					rerender = true;
					this._debug('mutation.removedNodes:', mutation.removedNodes);
					this._debug('mutation.addedNodes:', mutation.addedNodes);
					break;
				}
			}

			// TODO: WIP: Light DOM
			if (!opts.shadow) return;

			if (rerender) {
				// Force a rerender now.
				this._debug('_processMutations(): Trigger rerender');
				this.renderSvelteComponent();
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

	// Special custom element container used to wrap Svelte components. This is used to help emulate some of the
	// encapsulation benefits of a shadow DOM, particularly when we need to watch slots being dynamically added to the
	// defined custom element (adjacent to <svelte-retag>). This is especially useful if we're executing early (e.g. via
	// IIFE) and slots are being actively parsed.
	if (!window.customElements.get('svelte-retag')) {
		window.customElements.define('svelte-retag', class extends HTMLElement {
			// noop.
		});
	}

	window.customElements.define(opts.tagname, Wrapper);
}
