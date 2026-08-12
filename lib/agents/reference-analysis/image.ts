export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** 4 MB — keeps inline Gemini requests practical for M04.0. */
export const MAX_REFERENCE_IMAGE_BYTES = 4 * 1024 * 1024;

export type ValidatedReferenceImage = {
  mimeType: AllowedImageMimeType;
  base64Data: string;
  byteLength: number;
  fileName: string;
};

export type ImageValidationResult =
  | { success: true; data: ValidatedReferenceImage }
  | { success: false; error: string };

function isAllowedMimeType(value: string): value is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export function validateReferenceImageFile(
  file: File | null | undefined,
): ImageValidationResult {
  if (!file) {
    return { success: false, error: "An image file is required." };
  }

  if (!file.type || !isAllowedMimeType(file.type)) {
    return {
      success: false,
      error: "Unsupported image type. Use PNG, JPEG, or WEBP.",
    };
  }

  if (file.size <= 0) {
    return { success: false, error: "The image file is empty." };
  }

  if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
    return {
      success: false,
      error: `Image is too large. Maximum size is ${Math.floor(MAX_REFERENCE_IMAGE_BYTES / (1024 * 1024))} MB.`,
    };
  }

  return {
    success: true,
    data: {
      mimeType: file.type,
      base64Data: "",
      byteLength: file.size,
      fileName: file.name || "reference-image",
    },
  };
}

export async function fileToValidatedReferenceImage(
  file: File,
): Promise<ImageValidationResult> {
  const basic = validateReferenceImageFile(file);
  if (!basic.success) return basic;

  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    success: true,
    data: {
      ...basic.data,
      base64Data: buffer.toString("base64"),
      byteLength: buffer.byteLength,
    },
  };
}
