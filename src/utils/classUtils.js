/* eslint-disable */

/**
 * Adds a CSS class to an element and all its children recursively
 * This mirrors the AddClassToAll function from the legacy script
 * @param {HTMLElement} element - The DOM element to add the class to
 * @param {string} className - The CSS class name to add
 */
export function addClassToAll(element, className) {
  if (element && element.classList) {
    // Add to main element FIRST
    element.classList.add(className);

    // Add to all children
    const children = element.querySelectorAll("*");

    children.forEach((child) => {
      if (child.classList) {
        child.classList.add(className);
      }
    });
  } else {
    console.error("🔧 addClassToAll: Invalid element or missing classList");
  }
}

/**
 * Removes a CSS class from an element and all its children recursively
 * This mirrors the RemoveClassFromAll function from the legacy script
 * @param {HTMLElement} element - The DOM element to remove the class from
 * @param {string} className - The CSS class name to remove
 */
export function removeClassFromAll(element, className) {
  if (element && element.classList) {
    // Remove from main element
    element.classList.remove(className);

    // Remove from all children
    const children = element.querySelectorAll("*");

    children.forEach((child) => {
      if (child.classList) {
        child.classList.remove(className);
      }
    });
  } else {
    console.error("removeClassFromAll: Invalid element or missing classList");
  }
}

/**
 * Applies product type styling to an item container based on product type
 * This mirrors the styling logic from the legacy UpdateProductViaDataRole function
 * @param {HTMLElement} itemContainer - The item container element
 * @param {string} productType - The product type ('ticket', 'deal', or other)
 */
export function applyProductTypeStyles(itemContainer, productType) {
  if (!itemContainer) return;

  if (productType === "ticket") {
    removeClassFromAll(itemContainer, "coupon-style"); // Ensure coupon style is removed
    addClassToAll(itemContainer, "ticket-style");
  } else if (productType === "deal") {
    removeClassFromAll(itemContainer, "ticket-style"); // Ensure ticket style is removed
    addClassToAll(itemContainer, "coupon-style");
  } else {
    // Otherwise, treat as a standard product (remove specific styles)
    removeClassFromAll(itemContainer, "ticket-style");
    removeClassFromAll(itemContainer, "coupon-style");
  }
}
