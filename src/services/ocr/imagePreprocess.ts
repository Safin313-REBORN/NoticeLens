export interface PreprocessOptions {
  grayscale?: boolean;
  enhanceContrast?: boolean;
  maxDimension?: number;
}

/**
 * Normalizes any image source (including SVG data URIs, File, Blob, or raster image URLs)
 * into a high-quality raster PNG Data URL with a crisp white background.
 * This guarantees compatibility with Leptonica/Tesseract.js WASM pixReadMem.
 */
export async function normalizeImageForOcr(
  imageSource: File | Blob | string
): Promise<string> {
  // If it's an empty or invalid input, reject immediately with clear message
  if (!imageSource) {
    return Promise.reject(new Error('No image provided. Please select a valid notice image.'));
  }

  // If running in an environment without DOM Image/document (e.g. basic Node without canvas),
  // return imageSource if it's already a string, or throw appropriate error
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (typeof imageSource === 'string') return Promise.resolve(imageSource);
    return Promise.reject(new Error('Image normalization requires a browser or canvas environment.'));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Failed to decode image file. Decoding timed out.'));
    }, 1500);

    img.onload = () => {
      cleanup();
      try {
        const naturalWidth = img.naturalWidth || img.width || 800;
        const naturalHeight = img.naturalHeight || img.height || 600;

        // Ensure resolution is high enough for crisp OCR recognition (target width at least 1600px, max 2400px)
        let targetWidth = naturalWidth;
        let targetHeight = naturalHeight;

        if (targetWidth < 1400) {
          const scale = Math.min(2.5, 1800 / targetWidth);
          targetWidth = Math.round(targetWidth * scale);
          targetHeight = Math.round(targetHeight * scale);
        } else if (targetWidth > 2400) {
          const scale = 2400 / targetWidth;
          targetWidth = 2400;
          targetHeight = Math.round(targetHeight * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // If canvas 2D context is not available (e.g. happy-dom/jsdom without native canvas),
          // fallback to original image source if it is already a string
          if (typeof imageSource === 'string') {
            return resolve(imageSource);
          }
          return reject(new Error('Canvas 2D context is not available for image decoding.'));
        }

        // Fill solid white background (crucial for SVGs and transparent PNGs to prevent black background inversion)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const rasterDataUrl = canvas.toDataURL('image/png');
        resolve(rasterDataUrl);
      } catch (err) {
        reject(new Error(`Failed to decode image data: ${err instanceof Error ? err.message : String(err)}`));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to decode image file. Please provide a valid PNG, JPEG, or WebP notice image.'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      try {
        objectUrl = URL.createObjectURL(imageSource);
        img.src = objectUrl;
      } catch {
        cleanup();
        reject(new Error('Invalid image file object.'));
      }
    }
  });
}

/**
 * Preprocesses notice images on an in-memory canvas to improve OCR recognition rates
 */
export async function preprocessNoticeImage(
  imageSource: File | Blob | string,
  options: PreprocessOptions = {}
): Promise<{ processedDataUrl: string; width: number; height: number }> {
  const { grayscale = true, enhanceContrast = true, maxDimension = 2400 } = options;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('Preprocessing requires a browser canvas environment.'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    img.onload = () => {
      cleanup();
      try {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        // Scale down if image is excessively large to avoid memory crashes on low-end devices
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context is not available.'));
        }

        // Always fill solid white background first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw original image scaled
        ctx.drawImage(img, 0, 0, width, height);

        // Apply pixel level enhancements if requested
        if (grayscale || enhanceContrast) {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Luminance weighted grayscale
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;

            if (enhanceContrast) {
              // Contrast stretching: push darks darker, lights lighter
              gray = gray < 128 ? gray * 0.8 : 128 + (gray - 128) * 1.2;
              gray = Math.max(0, Math.min(255, gray));
            }

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }

          ctx.putImageData(imageData, 0, 0);
        }

        const processedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve({ processedDataUrl, width, height });
      } catch (err: unknown) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image for preprocessing.'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      try {
        objectUrl = URL.createObjectURL(imageSource);
        img.src = objectUrl;
      } catch {
        reject(new Error('Could not create object URL for preprocessing.'));
      }
    }
  });
}
