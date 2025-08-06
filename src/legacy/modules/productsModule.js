/* eslint-disable */
export let products = [];
export let productDataQueue = [];
export let productsPaused = false;
export let productProcessTimeout = null;

export function PauseProducts() {
  productsPaused = true;
}

export function UnpauseProducts() {
  productsPaused = false;
}

export function clearProducts() {
  products.length = 0; // Clear the products array
  productDataQueue.length = 0; // Clear the queue as well

  // Clear any pending timeout
  if (productProcessTimeout != null) {
    clearTimeout(productProcessTimeout);
    productProcessTimeout = null;
  }
}

export function addToProductDataQueue(data) {
  const exists = productDataQueue.some((product) => product.id === data.id);
  if (!exists) {
    productDataQueue.push(data);
    if (productDataQueue.length > 10) {
      productDataQueue.shift();
    }
  }
}

export function processProductDataQueue() {
  if (productProcessTimeout != null) {
    clearTimeout(productProcessTimeout);
    productProcessTimeout = null;
  }
  if (productDataQueue.length > 0 && !productsPaused) {
    let data = productDataQueue.shift();
    data.time = Date.now();

    // CONSOLIDATED: Use React context for product management instead of duplicate arrays
    // Dispatch event for React ProductsContext to handle
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("add-product", { detail: data }));
    }

    // Keep legacy products array in sync for backward compatibility
    const existingIndex = products.findIndex(
      (product) => product.id === data.id
    );
    if (existingIndex === -1) {
      products.push(data);
      if (products.length > 10) products.shift();

      // Legacy event for backward compatibility
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("new-product", { detail: data }));
      }
      if (typeof flashShopping === "function") {
        flashShopping();
      }
    }
  }
  if (productDataQueue.length > 0) {
    productProcessTimeout = setTimeout(processProductDataQueue, 1000);
  }
}

export function FormatTicketDateTime(product) {
  let formattedDateTime;
  if (
    typeof product.date === "object" &&
    product.date.hasOwnProperty("date") &&
    product.date.hasOwnProperty("time")
  ) {
    const { date, time } = product.date;
    formattedDateTime = new Date(`${date}T${time}`).toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  } else if (
    typeof product.date === "string" &&
    !isNaN(Date.parse(product.date))
  ) {
    formattedDateTime = new Date(product.date).toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  } else {
    return "";
  }
  return formattedDateTime;
}

export function FormatPrice(price, currency = "USD") {
  price = parseFloat(price);
  const currencyFormats = {
    USD: { symbol: "$", position: "prefix" },
    US$: { symbol: "$", position: "prefix" },
    $: { symbol: "$", position: "prefix" },
    GBP: { symbol: "Â£", position: "prefix" },
    "Â£": { symbol: "Â£", position: "prefix" },
    EUR: { symbol: "â‚¬", position: "postfix" },
    "â‚¬": { symbol: "â‚¬", position: "postfix" },
    JPY: { symbol: "Â¥", position: "prefix" },
    "Â¥": { symbol: "Â¥", position: "prefix" },
    CAD: { symbol: "C$", position: "prefix" },
    C$: { symbol: "C$", position: "prefix" },
    AUD: { symbol: "A$", position: "prefix" },
    A$: { symbol: "A$", position: "prefix" },
    INR: { symbol: "â‚¹", position: "prefix" },
    "â‚¹": { symbol: "â‚¹", position: "prefix" },
    CNY: { symbol: "Â¥", position: "prefix" },
    "CNÂ¥": { symbol: "Â¥", position: "prefix" },
    CHF: { symbol: "CHF", position: "postfix" },
    RUB: { symbol: "â‚½", position: "postfix" },
    "â‚½": { symbol: "â‚½", position: "postfix" },
  };
  currency = currency.toUpperCase();
  let symbol = "";
  let position = "prefix";
  if (currencyFormats.hasOwnProperty(currency)) {
    symbol = currencyFormats[currency].symbol;
    position = currencyFormats[currency].position;
  } else {
    symbol = currency;
    position = "postfix";
  }
  let formattedPrice;
  if (price % 1 === 0) {
    formattedPrice = price.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  } else {
    formattedPrice = price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return position === "prefix"
    ? `${symbol}${formattedPrice}`
    : `${formattedPrice}${symbol}`;
}
