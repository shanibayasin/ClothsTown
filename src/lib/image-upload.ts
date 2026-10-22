const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2560;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Unable to process this image. Please try another photo."));
        }
      },
      "image/webp",
      quality
    );
  });
}

export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.size <= MAX_IMAGE_UPLOAD_BYTES) {
    return file;
  }

  if (typeof createImageBitmap !== "function") {
    throw new Error("This photo is too large to upload. Please choose a smaller image.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "This photo format cannot be resized on this device. Please choose a JPG or PNG image."
    );
  }

  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to process this image on this device.");
    }

    for (let attempt = 0; attempt < 7; attempt += 1) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, Math.max(0.5, 0.84 - attempt * 0.06));
      if (blob.size <= MAX_IMAGE_UPLOAD_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, "") || "upload";
        return new File([blob], `${name}.webp`, {
          type: blob.type,
          lastModified: file.lastModified,
        });
      }

      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
    }

    throw new Error("This photo is still too large after resizing. Please choose another image.");
  } finally {
    bitmap.close();
  }
}
