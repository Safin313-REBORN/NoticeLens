export interface PreprocessOptions {
  grayscale?: boolean;
  enhanceContrast?: boolean;
  maxDimension?: number;
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
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

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
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing.'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}
