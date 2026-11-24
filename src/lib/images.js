/**
 * Shrinks a photo in the browser before upload: longest side at most `maxSize`
 * pixels, saved as JPEG. A 4 MB phone photo comes out around 100–250 KB, so
 * uploads are quick on mobile data and storage stays small.
 * Throws a friendly Error if the file can't be read as an image.
 */
export async function resizeImage(file, maxSize = 1200, quality = 0.8) {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");

  const img = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // transparent PNGs would otherwise turn black as JPEG
  ctx.fillRect(0, 0, width, height);
  // Browsers apply the photo's EXIF rotation when drawing an <img>, so phone
  // photos come out the right way up.
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that photo. Try another one."))),
      "image/jpeg",
      quality,
    ),
  );
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that photo. Try a JPEG or PNG."));
    };
    img.src = url;
  });
}
