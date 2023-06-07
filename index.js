/**
 * Please see README.md for usage information.
 *
 * TODO: Better JSDoc type hinting for arguments and return types
 */

import { detach, insert, noop } from 'svelte/internal';


/**
 * Creates an object where each property represents the slot name and each value represents a Svelte-specific slot
 * object containing the lifecycle hooks for each slot. This wraps our slot elements and is passed to Svelte itself.
 *
 * Much of this witchcraft is from svelte issue - https://github.com/sveltejs/svelte/issues/2588
 */
function createSvelteSlots(slots) {
	const svelteSlots = {};
	for(const slotName in slots) {
		svelteSlots[slotName] = [createSlotFn(slots[slotName])];
	}

	function createSlotFn(element) {
		return function() {
			return {
				c: noop,
				m: function mount(target, anchor) {
					insert(target, element.cloneNode(true), anchor);
				},
				d: function destroy(detaching) {
					if (detaching) {
						detach(element);
					}
				},
				l: noop,
			};
		};
	}

	return svelteSlots;
}


/**
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

			this.debug('constructor()');
			this.slotCount = 0;
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

		static get observedAttributes() {
			return opts.attributes || [];
		}

		connectedCallback() {
			this.debug('connectedCallback()');

			// Props passed to Svelte component constructor.
			let props = {
				$$scope: {}
				// $$slots: initialized below
				// All other props are pulled from element attributes (see below).
			};

			// Populate custom element attributes into the props object.
			// TODO: Inspect component and normalize to lowercase for Lit-style props (https://github.com/crisward/svelte-tag/issues/16)
			Array.from(this.attributes).forEach(attr => props[attr.name] = attr.value);

			// Setup slot elements, making sure to retain a reference to the original elements prior to processing, so they
			// can be restored later on disconnectedCallback().
			this.slotEls = {};
			if (opts.shadow) {
				this.slotEls = this.getShadowSlots();
				this.observer = new MutationObserver(this.processMutations.bind(this, { root: this._root, props }));
				this.observer.observe(this, { childList: true, subtree: true, attributes: false });
			} else {
				this.slotEls = this.getSlots();
			}
			this.slotCount = Object.keys(this.slotEls).length; // TODO: Refactor to getter
			props.$$slots = createSvelteSlots(this.slotEls);

			this.elem = new opts.component({ target: this._root, props });
		}

		disconnectedCallback() {
			this.debug('disconnectedCallback()');

			if (this.observer) {
				this.observer.disconnect();
			}

			// Double check that element has been initialized already. This could happen in case connectedCallback() hasn't
			// fully completed yet (e.g. if initialization is async) TODO: May happen later if MutationObserver is setup for light DOM
			if (this.elem) {
				try {
					// Clean up: Destroy Svelte component when removed from DOM.
					this.elem.$destroy();
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
		 * Carefully "unwraps" the custom element tag itself from its default slot content (particularly if that content
		 * is just a text node). Only used when not using shadow root.
		 *
		 * @param {HTMLElement} from
		 *
		 * @returns {DocumentFragment}
		 */
		unwrap(from) {
			let node = document.createDocumentFragment();
			while(from.firstChild) {
				node.appendChild(from.firstChild);
			}
			return node;
		}

		/**
		 * Traverses DOM to find the first custom element that the provided slot belongs to.
		 *
		 * @param {Element} slot
		 * @returns {HTMLElement|null}
		 */
		findSlotParent(slot) {
			let parentEl = slot.parentElement;
			while(parentEl) {
				if (parentEl.tagName.indexOf('-') !== -1) return parentEl;
				parentEl = parentEl.parentElement;
			}
			return null;
		}

		getSlots() {
			let slots = {};

			// Look for named slots below this element. IMPORTANT: This may return slots nested deeper (see check in forEach below).
			const queryNamedSlots = this.querySelectorAll('[slot]');
			queryNamedSlots.forEach(candidate => {
				// Traverse parents and find first custom element and ensure its tag name matches this one. That way, we
				// can ensure we aren't inadvertently getting nested slots that apply to other custom elements.
				let slotParent = this.findSlotParent(candidate);
				if (slotParent === null) return;
				if (slotParent.tagName !== this.tagName) return;

				slots[candidate.slot] = candidate;
				this.removeChild(candidate);
			});

			// Default slots are indeed allowed alongside named slots, as long as the named slots are elided *first*. We
			// should also make sure we trim out whitespace in case all slots and elements are already removed. We don't want
			// to accidentally pass content (whitespace) to a component that isn't setup with a default slot.
			if (this.innerHTML.trim().length !== 0) {
				if (slots.default) {
					// Edge case: User has a named "default" as well as remaining HTML left over. Use same error as Svelte.
					console.error(`svelteRetag: '${this.tagName}': Found elements without slot attribute when using slot="default"`);
				} else {
					slots.default = this.unwrap(this);
				}
				this.innerHTML = '';
			}

			return slots;
		}

		getShadowSlots() {
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

		// TODO: Primarily used only for shadow DOM, however, MutationObserver would likely also be useful for IIFE-based
		//  light DOM, since that is not deferred and technically slots will be added after the wrapping tag's connectedCallback()
		//  during initial browser parsing and before the closing tag is encountered.
		processMutations({ root, props }, mutations) {
			this.debug('processMutations()');

			for(let mutation of mutations) {
				if (mutation.type === 'childList') {
					let slots = this.getShadowSlots();

					// TODO: Should it re-render if the count changes at all? e.g. what if slots were REMOVED (reducing it to zero)?
					//  We'd have latent content left over that's not getting updated, then. Consider rewrite...
					if (Object.keys(slots).length) {

						props.$$slots = createSvelteSlots(slots);

						// TODO: Why is this set here but not re-rendered unless the slot count changes?
						// TODO: Also, why is props.$$slots set above but not just passed here? Calling createSvelteSlots(slots) 2x...
						this.elem.$set({ '$$slots': createSvelteSlots(slots) });

						// do full re-render on slot count change - needed for tabs component
						if (this.slotCount !== Object.keys(slots).length) {
							Array.from(this.attributes).forEach(attr => props[attr.name] = attr.value); // TODO: Redundant, repeated on connectedCallback().
							this.slotCount = Object.keys(slots).length;
							root.innerHTML = '';
							this.elem = new opts.component({ target: root, props });
						}
					}
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
			this.debug('attributes changed', {name, oldValue, newValue});

			if (this.elem && newValue !== oldValue) {
				this.elem.$set({ [name]: newValue });
			}
		}

		/**
		 * Pass through to console.log() but includes a reference to the custom element in the log for easier targeting for
		 * debugging purposes.
		 *
		 * @param {...*}
		 */
		debug() {
			if (opts.debugMode) {
				console.log.apply(null, [this, ...arguments]);
			}
		}
	}

	window.customElements.define(opts.tagname, Wrapper);
}
