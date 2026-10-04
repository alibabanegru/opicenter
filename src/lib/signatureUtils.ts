/**
 * Utility functions for compressing patient signatures to a minimal size
 * before saving them to Firestore database (reducing size from ~100KB to ~2KB-4KB).
 */

export function compressSignatureCanvas(
  canvas: HTMLCanvasElement | null,
  isEmpty?: boolean,
  maxWidth = 320,
  maxHeight = 110
): string {
  if (!canvas || isEmpty) return "";

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const width = canvas.width;
  const height = canvas.height;
  if (width <= 0 || height <= 0) return "";

  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasPixels = false;

    // Scan canvas pixel grid to find bounding box of drawn strokes (alpha > 15)
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasPixels = true;
        }
      }
    }

    if (!hasPixels || maxX <= minX || maxY <= minY) {
      return "";
    }

    // Add padding around signature
    const padding = 8;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width, maxX + padding);
    maxY = Math.min(height, maxY + padding);

    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;

    // Calculate scale to fit inside maxWidth x maxHeight
    let targetWidth = cropWidth;
    let targetHeight = cropHeight;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const scale = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    // Create compact offscreen canvas
    const offCanvas = document.createElement("canvas");
    offCanvas.width = Math.max(targetWidth, 1);
    offCanvas.height = Math.max(targetHeight, 1);
    const offCtx = offCanvas.getContext("2d");

    if (!offCtx) return "";

    offCtx.imageSmoothingEnabled = true;
    offCtx.imageSmoothingQuality = "high";

    // Draw cropped region onto small offscreen canvas
    offCtx.drawImage(
      canvas,
      minX,
      minY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    // Return compressed PNG data URL
    return offCanvas.toDataURL("image/png");
  } catch (err) {
    console.error("Error compressing signature canvas:", err);
    return canvas.toDataURL("image/png");
  }
}

/**
 * Compress an existing base64 signature Data URL if it is excessively large (> 10KB).
 */
export async function compressSignatureDataUrl(
  dataUrl: string,
  maxWidth = 320,
  maxHeight = 110
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image/") || dataUrl.length < 10000) {
    // Already small or empty
    return dataUrl || "";
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const compressed = compressSignatureCanvas(tempCanvas, false, maxWidth, maxHeight);
        resolve(compressed || dataUrl);
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
