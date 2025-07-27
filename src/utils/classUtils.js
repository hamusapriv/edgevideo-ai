/* eslint-disable */

/**
 * Adds a CSS class to an element and all its children recursively
 * This mirrors the AddClassToAll function from the legacy script
 * @param {HTMLElement} element - The DOM element to add the class to
 * @param {string} className - The CSS class name to add
 */
export function addClassToAll(element, className) {
  console.log(`🔧 addClassToAll called with className: ${className}`);
  console.log("🔧 Element:", element);
  console.log("🔧 Element tagName:", element?.tagName);
  console.log("🔧 Element className BEFORE:", element?.className);

  if (element && element.classList) {
    // Add to main element FIRST
    console.log(`🔧 Adding ${className} to MAIN element...`);
    element.classList.add(className);
    console.log(`🔧 MAIN element classes AFTER adding:`, element.className);
    console.log(
      `🔧 Contains ${className}?`,
      element.classList.contains(className)
    );

    // Add to all children
    const children = element.querySelectorAll("*");
    console.log(`🔧 Found ${children.length} children to add ${className} to`);

    children.forEach((child, index) => {
      if (child.classList) {
        const beforeClasses = child.className;
        child.classList.add(className);
        console.log(
          `🔧 Child ${index} (${child.tagName}): ${beforeClasses} → ${child.className}`
        );
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
  console.log(`removeClassFromAll called with className: ${className}`);
  console.log("Element:", element);

  if (element && element.classList) {
    // Remove from main element
    element.classList.remove(className);
    console.log(
      `Removed ${className} from main element. Classes now:`,
      element.className
    );

    // Remove from all children
    const children = element.querySelectorAll("*");
    console.log(
      `Found ${children.length} children to remove ${className} from`
    );

    children.forEach((child, index) => {
      if (child.classList) {
        child.classList.remove(className);
        console.log(
          `Removed ${className} from child ${index}:`,
          child.tagName,
          child.className
        );
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
    console.log("Ticket type found - applying ticket-style");
    removeClassFromAll(itemContainer, "coupon-style"); // Ensure coupon style is removed
    addClassToAll(itemContainer, "ticket-style");
  } else if (productType === "deal") {
    console.log("Deal type found - applying coupon-style");
    removeClassFromAll(itemContainer, "ticket-style"); // Ensure ticket style is removed
    addClassToAll(itemContainer, "coupon-style");
  } else {
    // Otherwise, treat as a standard product (remove specific styles)
    console.log("Product type found - removing special styles");
    removeClassFromAll(itemContainer, "ticket-style");
    removeClassFromAll(itemContainer, "coupon-style");
  }
}
