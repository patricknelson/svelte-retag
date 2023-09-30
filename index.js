import { createSvelteSlots, findSlotParent, unwrap } from './utils.js';


// TODO: Consider build of svelte-retag so we can drop console.logs() when publishing. See: https://github.com/vitejs/vite/discussions/7920

let rafRunning = false;

/**
 * TODO: ISSUE-10: Doc
 *
 * @param {HTMLElement} element
 * @param {Boolean} isShadow
 */
function queueForRender(element, isShadow) {
	// Skip the queue if a parent is already queued for render, but for the light DOM only. This is because if it's in the
	// light DOM slot, it will be disconnected and reconnected again (which will then also trigger a need to render).
	if (element.parentElement.closest('[data-svelte-retag-render="light"]') !== null) {
		console.debug('queueForRender(): skipped since a light DOM parent is queued for render:', element);
		return;
	}

	// When queuing for render, it's also necessary to identify the DOM rendering type. This is necessary for child
	// components which are *underneath* a parent that is using light DOM rendering (see above). This helps to ensure
	// rendering is performed in the correct order (useful for things like context).
	element.setAttribute('data-svelte-retag-render', isShadow ? 'shadow' : 'light');
	requestAnimationFrame(renderElements);
}


/**
 * TODO: ISSUE-10: Doc
 *
 * @param {number} timestamp
 */
function renderElements(timestamp) {
	// Minor Optimization: Reduces quantity of unnecessary querySelectorAll() hits.
	// TODO: To be honest though, still not 100% sure why this is ever true. Per my understanding of rAF, they are queued
	//  to run sequentially, even if on the same frame/timestamp.
	if (rafRunning) {
		console.debug(`renderElements(${timestamp}): Skipping: Already rendering`);
		return;
	}
	rafRunning = true;

	let renderQueue = document.querySelectorAll('[data-svelte-retag-render]');
	if (renderQueue.length === 0) {
		console.debug(`renderElements(${timestamp}): returned, queue is now empty`);
		return;
	}

	let renderTotal = 0;
	for(let element of renderQueue) {
		// Element was queued but likely rearranged due to the parent rendering first (resulting in a new instance and this
		// being forever orphaned).
		if (!element.isConnected) {
			console.debug(`renderElements(${timestamp}): skipped, no longer connected:`, element);
			continue;
		}

		// Quick double check: Skip any which have *light* DOM parents that are queued for render. See queueForRender() for details.
		if (element.parentElement.closest('[data-svelte-retag-render="light"]') === null) {
			element.removeAttribute('data-svelte-retag-render');
			element._renderSvelteComponent();
			renderTotal++; // For debug only.
		} else {
			console.debug(`renderElements(${timestamp}): skipped since a light DOM parent is queued for render:`, element);
		}
	}
	console.debug(`renderElements(${timestamp}): rendered ${renderTotal} elements`);

	rafRunning = false;
}


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
 *
 * Experimental:
 * @param {boolean?}   opts.hydratable Light DOM slot hydration (specific to svelte-retag): Enables pre-rendering of the
 *                                     web component (e.g. SSR) by adding extra markers (attributes & wrappers) during
 *                                     rendering to enable svelte-retag to find and restore light DOM slots when
 *                                     restoring interactivity.
 *
 * @param {boolean|string?} opts.debugMode Hidden option to enable debugging for package development purposes.
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
	 *
	 * When performing shadow DOM rendering, it provides an un-styled container where we can attach
	 */
	if (!window.customElements.get('svelte-retag')) {
		window.customElements.define('svelte-retag', class extends HTMLElement {
			// noop
		});

		// When the 'hydratable' option is enabled, this special wrapper will be applied around default slot content so
		// that it can be discovered and restored later after pre-rendering. NOTE: This tag is always available since
		// we can always hydrate. It is only applied to rendered content if elected for a particular component.
		window.customElements.define('svelte-retag-default', class extends HTMLElement {
			// noop
		});
	}

	/**
	 * Object containing keys pointing to slots: Either an actual <slot> element or a document fragment created to wrap
	 * default slot content.
	 *
	 * @typedef {Object.<string, HTMLSlotElement|DocumentFragment>} SlotList
	 */

	/**
	 * Defines the actual custom element responsible for rendering the provided Svelte component.
	 */
	window.customElements.define(opts.tagname, class extends HTMLElement {
		constructor() {
			super();

			this._debug('constructor()');
			this.rand = Math.random();
			//console.log(this.rand, 'constructor():', customElementPath(this));

			// Temporarily instantiate the component ahead of time just so we can get its available properties (statically
			// available). Note that we're doing it here in the constructor in case this component has context (so it may
			// normally only be instantiated from within another component).
			this.propMap = new Map();
			// TODO: ISSUE-10: Fails since it also needs context. Make this more consistent or find cleaner method.
			/*const context = this._getAncestorContext();
			const propInstance = new opts.component({ target: document.createElement('div'), context });
			for(let key of Object.keys(propInstance.$$.props)) {
				this.propMap.set(key.toLowerCase(), key);
			}
			propInstance.$destroy();*/


			// Setup shadow root early (light-DOM root is initialized in connectedCallback() below).
			if (opts.shadow) {
				this.attachShadow({ mode: 'open' });
				// TODO: Better than <div>, but: Is a wrapper entirely necessary? Why not just set this._root = this.shadowRoot?
				this._root = document.createElement('svelte-retag');
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

			/**
			 * TODO: Light DOM: Potential optimization opportunities:
			 *  1. Don't bother setting up <svelte-retag> wrapper if the component doesn't have a default slot and isn't hydratable
			 *  2. Don't setup <svelte-retag> wrapper if we don't end up processing mutations (i.e. document not in loading state).
			 *  If this happens though, we must only setup/destroy in connected/disconnected callbacks and thus anything that
			 *  depends upon it needs a separate method of determining. Maybe getter that checks if this._root.tagName === 'SVELTE-RETAG'?
			 */

			// Initialize the slot elements object which retains a reference to the original elements (by slot name) so they
			// can be restored later on disconnectedCallback(). Also useful for debugging purposes.
			this.slotEls = {};

			// If compiled as IIFE/UMD and executed early, then the document is likely to be in the process of loading
			// and thus actively parsing tags, including not only this tag but also nested content (which may not yet be
			// available yet).
			const isLoading = (document.readyState === 'loading');

			// Setup the special <svelte-retag> wrapper if not already present (which can happen when
			// disconnected/reconnected due to being in a slot).
			if (!opts.shadow) {
				// See if this component is pre-rendered and flagged as able to hydrate slots from the light DOM root.
				if (this.hasAttribute('data-svelte-retag-hydratable')) {
					if (isLoading) {
						// Wait for the slots to become fully available.
						// NOTE: We expect <svelte-retag> wrapper to already be present, however it may not be
						// accessible until after the browser has finished parsing the DOM.
						this._onSlotsReady(() => {
							this._initLightRoot();
							this._hydrateLightSlots();
							this._queueForRender();
						});
						return;

					} else {
						// Light DOM slots are already all available, so hydrate them now and allow Svelte component
						// rendering to proceed normally below.
						this._initLightRoot();
						this._hydrateLightSlots();
					}
				} else {
					// Setup the wrapper now since we don't have to worry about hydration.
					this._initLightRoot();
				}
			}

			// Watch for changes to slot elements and ensure they're reflected in the Svelte component.
			if (opts.shadow) {
				this._observeSlots(true);
			} else {
				if (isLoading) {
					// Setup the mutation observer to watch content as parser progresses through the HTML and adds nodes under
					// this element. However, since this is only useful in light DOM elements *during* parsing, we should be sure
					// to stop observing once the HTML is fully parsed and loaded.
					this._observeSlots(true);
					this._onSlotsReady(() => {
						this._observeSlots(false);
					});
				}
			}

			// Now that we're connected to the DOM, we can render the component now.
			this._queueForRender();

			// If we want to enable the current component as hydratable, add the flag now that it has been fully
			// rendered (now that slots have been located under the Svelte component). This attribute is important since
			// it allows us to know immediately that this component is capable of being hydrated (useful if compiled and
			// executed as IIFE/UMD).
			if (opts.hydratable) {
				this.setAttribute('data-svelte-retag-hydratable', '');
			}
		}

		/**
		 * Removed from DOM (could be called inside another custom element that starts rendering after this one). In that
		 * situation, the connectedCallback() will be executed again (most likely with constructor() as well, unfortunately).
		 */
		disconnectedCallback() {
			this._debug('disconnectedCallback()');

			// Remove render flag (if present). This could happen in case the element is disconnected while waiting to render
			// (particularly if slotted under a light DOM parent).
			this.removeAttribute('data-svelte-retag-render');

			// Remove hydration flag, if present. This component will be able to be rendered from scratch instead.
			this.removeAttribute('data-svelte-retag-hydratable');

			// Disconnect slot mutation observer (if it's currently active).
			this._observeSlots(false);

			// Double check that element has been initialized already. This could happen in case connectedCallback() hasn't
			// fully completed yet (e.g. if initialization is async)
			if (this.componentInstance) {
				try {
					// Clean up: Destroy Svelte component when removed from DOM.
					this.componentInstance.$destroy();
					delete this.componentInstance;
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

			// If instance already available, pass it through immediately.
			if (this.componentInstance && newValue !== oldValue) {
				let translatedName = this._translateAttribute(name);
				this.componentInstance.$set({ [translatedName]: newValue });
			}
		}

		/**
		 * Setup a wrapper in the light DOM which can keep the rendered Svelte component separate from the default Slot
		 * content, which is potentially being actively appended (at least while the browser parses during loading).
		 */
		_initLightRoot() {
			// Recycle the existing light DOM root, if already present.
			let existingRoot = this.querySelector('svelte-retag');
			if (existingRoot !== null && existingRoot.parentElement === this) {
				this._debug('_initLightRoot(): Restore from existing light DOM root');
				this._root = existingRoot;
			} else {
				// Setup new (first time).
				this._root = document.createElement('svelte-retag');
				this.prepend(this._root);
			}
		}

		/**
		 * Queues the provided callback to execute when we think all slots are fully loaded and available to fetch and
		 * manipulate.
		 *
		 * @param {callback} callback
		 */
		_onSlotsReady(callback) {
			document.addEventListener('readystatechange', () => {
				if (document.readyState === 'interactive') {
					callback();
				}
			});
		}

		/**
		 * Converts the provided lowercase attribute name to the correct case-sensitive component prop name, if possible.
		 *
		 * @param {string} attributeName
		 * @returns {string}
		 */
		_translateAttribute(attributeName) {
			// In the unlikely scenario that a browser somewhere doesn't do this for us (or maybe we're in a quirks mode or something...)
			attributeName = attributeName.toLowerCase();
			if (this.propMap.has(attributeName)) {
				return this.propMap.get(attributeName);
			} else {
				this._debug(`_translateAttribute(): ${attributeName} not found`);
				return attributeName;
			}
		}

		/**
		 * TODO: ISSUE-10: Doc
		 */
		_getAncestorContext() {
			let node = this;
			while(node.parentNode) {
				node = node.parentNode;
				let context = node?.componentInstance?.$$?.context;
				if (context) {
					if (!context._id) {
						context._id = Math.random();
					}
					return context;
				}
			}

			return null;
		}

		/**
		 * TODO: ISSUE-10: DOC
		 */
		_queueForRender() {
			queueForRender(this, opts.shadow);
		}

		/**
		 * Renders (or rerenders) the Svelte component into this custom element based on the latest properties and slots
		 * (with slots initialized elsewhere).
		 *
		 * TODO: ISSUE-10: Add note about the necessity to render components in order and about how there's now a render queue.
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
			for(let attr of [...this.attributes]) {
				// Note: Skip svelte-retag specific attributes (used for hydration purposes).
				if (attr.name.indexOf('data-svelte-retag') !== -1) continue;
				props[this._translateAttribute(attr.name)] = attr.value;
			}

			// Instantiate component into our root now, which is either the "light DOM" (i.e. directly under this element) or
			// in the shadow DOM.
			const context = this._getAncestorContext() || new Map();
			this.componentInstance = new opts.component({ target: this._root, props: props, context });
		}

		/**
		 * Fetches slots from pre-rendered Svelte component HTML using special markers (either data attributes or custom
		 * wrappers). Note that this will only work during initialization and only if the Svelte retag instance is
		 * hydratable.
		 */
		_hydrateLightSlots() {
			// Get the named slots inside the already rendered component by looking for our special data attribute.
			let existingNamedSlots = this._root.querySelectorAll('[data-svelte-retag-slot]');
			for(let slot of existingNamedSlots) {
				// Ensure we stick only to slots that belong to this element (avoid deeply nested components).
				let slotParent = findSlotParent(slot);
				if (slotParent !== this._root) continue;

				let slotName = slot.getAttribute('slot');
				this.slotEls[slotName] = slot;
			}

			// If default slot content was used, it should still be wrapped in a special <svelte-retag-default>,
			// which preserves all child nodes (including text nodes).
			let existingDefaultSlot = this.querySelector('svelte-retag-default');
			if (existingDefaultSlot !== null) {
				this.slotEls['default'] = existingDefaultSlot;
			}

			// Put all slots back to their original positions (including unwrapping default slot content) to
			// prepare for initial component render.
			this._restoreLightSlots();

			return true;
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

				// If this is a hydratable component, flag this slot so we can find it later once it has been relocated
				// under the fully rendered Svelte component (in the light DOM).
				if (opts.hydratable) {
					candidate.setAttribute('data-svelte-retag-slot', '');
				}

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
				// Here we use a special <svelte-retag-default> custom element that allows us to target it later in case we
				// need to hydrate it (e.g. tag was rendered via SSG/SSR and disconnectedCallback() was not run).
			let fragment = document.createDocumentFragment();

			// For hydratable components, we have to nest these nodes under a tag that we can still recognize once
			// they're shifted inside of the fully rendered Svelte component, which could be anywhere.
			if (opts.hydratable) {
				fragment = document.createElement('svelte-retag-default');
			}

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
				} else if (childNode.outerHTML) {
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
				if (slotEl.tagName === 'SVELTE-RETAG-DEFAULT') {
					this.prepend(unwrap(slotEl));
				} else {
					this.prepend(slotEl);

					// If hydration was enabled for this particular element (not necessarily for the current context),
					// we should clean up hydration-specific attributes for consistency.
					if (slotEl instanceof HTMLElement && slotEl.hasAttribute('data-svelte-retag-slot')) {
						slotEl.removeAttribute('data-svelte-retag-slot');
					}
				}
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
		 * 1. Shadow DOM: All slot changes will queue a rerender of the Svelte component
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
				this._debug('_processMutations(): Queue rerender');
				this._queueForRender();
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
				if (opts.debugMode === 'cli') {
					console.log.apply(null, [...arguments]);
				} else {
					console.log.apply(null, [this, ...arguments]);
				}
			}
		}
	});
}
