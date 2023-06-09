/**
 * Functions are placed here for better encapsulation and readability of the main codebase. This helps to isolate them
 * from the DOM API of the implemented web component (particularly if they are static and do not need access to instance
 * level information, i.e. they do not call "this").
 */

import { detach, insert, noop } from 'svelte/internal';


/**
 * Creates an object where each property represents the slot name and each value represents a Svelte-specific slot
 * object containing the lifecycle hooks for each slot. This wraps our slot elements and is passed to Svelte itself.
 *
 * Much of this witchcraft is from svelte issue - https://github.com/sveltejs/svelte/issues/2588
 */
export function createSvelteSlots(slots) {
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
 * Traverses DOM to find the first custom element that the provided <slot> element happens to belong to.
 *
 * @param {Element} slot
 * @returns {HTMLElement|null}
 */
export function findSlotParent(slot) {
	let parentEl = slot.parentElement;
	while(parentEl) {
		if (parentEl.tagName.indexOf('-') !== -1) return parentEl;
		parentEl = parentEl.parentElement;
	}
	return null;
}

