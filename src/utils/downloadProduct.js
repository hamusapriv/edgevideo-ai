import { saveAs } from "file-saver";

export async function downloadProduct(product) {
  const container = document.querySelector(
    `.item-container[data-product-id="${product.id}"]`
  );
  const html = container ? container.outerHTML : "";
  const data = { id: product.id, html };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  saveAs(blob, `product-${product.id || Date.now()}.json`);
}
