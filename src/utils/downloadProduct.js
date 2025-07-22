import JSZip from "jszip";
import { saveAs } from "file-saver";

function getFileExtension(url) {
  try {
    const path = new URL(url).pathname;
    const ext = path.substring(path.lastIndexOf("."));
    return ext || "";
  } catch {
    return "";
  }
}

async function addImageToZip(zip, url, name) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const ext = getFileExtension(url);
    zip.file(`${name}${ext}`, blob);
  } catch (e) {
    console.warn("Failed to fetch image", url, e);
  }
}

export async function downloadProduct(product) {
  const zip = new JSZip();
  const info = {
    id: product.id,
    title: product.title || product.name || "",
    price: product.price || "",
    link: product.link || "",
  };
  zip.file("product.json", JSON.stringify(info, null, 2));

  if (product.image) {
    await addImageToZip(zip, product.image, "image");
  }
  const frameUrl = product.frame_url || product.back_image;
  if (frameUrl) {
    await addImageToZip(zip, frameUrl, "frame");
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `product-${product.id || Date.now()}.zip`);
}
