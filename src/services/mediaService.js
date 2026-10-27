/* Media helpers — everything stays inside Firestore as base64 so the
   app needs zero extra infrastructure (no Storage / Blaze / Cloudinary).
   Photos are compressed hard so 3 of them fit comfortably inside the
   1MB Firestore document limit of a service request. */

const MAX_IMAGE_DIMENSION = 900;
const PHOTO_TARGET_BASE64_LENGTH = 220000; // ~160KB binary per photo
const QUALITY_STEPS = [0.6, 0.5, 0.4, 0.3];

const loadImageElement = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image-load-failed"));
    };

    image.src = url;
  });

/**
 * Resizes + compresses a photo file into a JPEG base64 data URL
 * small enough to embed directly in a Firestore document.
 */
export const compressImageToBase64 = async (file) => {
  const image = await loadImageElement(file);

  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.width, image.height)
  );

  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);

  let dataUrl = "";

  for (const quality of QUALITY_STEPS) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= PHOTO_TARGET_BASE64_LENGTH) break;
  }

  return dataUrl;
};

/** Converts a recorded audio Blob into a base64 data URL. */
export const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("blob-read-failed"));
    reader.readAsDataURL(blob);
  });
