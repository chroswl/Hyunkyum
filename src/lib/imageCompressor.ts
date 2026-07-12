export const compressBase64 = (base64Data: string, maxWidth = 800, quality = 0.55): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Data.startsWith('data:image')) {
      resolve(base64Data);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      } else if (h > maxWidth) {
        w = Math.round((w * maxWidth) / h);
        h = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Data);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Data);
    };
    img.src = base64Data;
  });
};

export const compressFile = (file: File, maxWidth = 800, quality = 0.55): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        const compressed = await compressBase64(base64, maxWidth, quality);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Detects if the browser supports WebP format for canvas export.
 */
export const isWebPSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch (e) {
    return false;
  }
};

/**
 * Optimizes an uploaded File before it goes to the cropper.
 * - Accept up to 30MB.
 * - Maintains aspect ratio while resizing if the dimensions exceed 2048px.
 * - Converts to WebP if supported, otherwise falls back to JPEG.
 * - Iteratively compresses to target size < 1MB (or as small as possible without losing quality).
 */
export const optimizeImageFile = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not a valid image.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // fallback to reading file as data url
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
          URL.revokeObjectURL(objectUrl);
          return;
        }

        let width = img.width;
        let height = img.height;
        const maxDimension = 2048;

        // Resize while maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = isWebPSupported() ? 'image/webp' : 'image/jpeg';
        
        let base64 = '';
        let size = 0;
        const targetSizeBytes = 1000 * 1024; // 1MB

        const qualities = [0.85, 0.75, 0.65, 0.55];
        for (let i = 0; i < qualities.length; i++) {
          const q = qualities[i];
          base64 = canvas.toDataURL(mimeType, q);
          size = Math.round(base64.length * 0.75);
          
          if (onProgress) {
            onProgress(Math.round(((i + 1) / qualities.length) * 100));
          }

          if (size <= targetSizeBytes) {
            break;
          }
        }

        URL.revokeObjectURL(objectUrl);
        resolve(base64);
      } catch (err) {
        console.error("Optimization error, fallback to raw load:", err);
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = (err) => {
      console.error("Image load error, fallback to raw load:", err);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  });
};

