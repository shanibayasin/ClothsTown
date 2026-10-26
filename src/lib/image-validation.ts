const IMAGE_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/png": (bytes) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  "image/jpeg": (bytes) =>
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/gif": (bytes) =>
    bytes.length >= 6 &&
    String.fromCharCode(...bytes.subarray(0, 6)).match(/^GIF8[79]a$/) !== null,
  "image/webp": (bytes) =>
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP",
};

export function isSupportedImage(bytes: Uint8Array, mimeType: string) {
  const normalizedMimeType = mimeType.toLowerCase();
  const signatureCheck = IMAGE_SIGNATURES[normalizedMimeType];
  return signatureCheck ? signatureCheck(bytes) : false;
}

export function isSupportedImageDataUrl(value: string) {
  const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([a-z\d+/]+=*)$/i.exec(value);
  if (!match) return false;

  const mimeType = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const bytes = Buffer.from(match[2], "base64");
  return isSupportedImage(bytes, mimeType);
}

export function isSafeProductImageReference(value: string) {
  if (value.length > 6_000_000) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("data:")) return isSupportedImageDataUrl(value);

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}