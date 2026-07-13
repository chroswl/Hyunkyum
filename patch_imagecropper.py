import re

with open("src/components/ImageCropperModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

helper_code = """
async function compressOriginalImage(imageSrc: string, maxWidth = 1200): Promise<string | null> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    let width = image.width;
    let height = image.height;
    
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else if (height > maxWidth) {
      width = Math.round((width * maxWidth) / height);
      height = maxWidth;
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);
    
    let currentMaxWidth = maxWidth;
    let currentQuality = 0.8;
    
    const compress = (mw: number, q: number): string => {
      let w = image.width;
      let h = image.height;
      if (w > mw) {
        h = Math.round((h * mw) / w);
        w = mw;
      } else if (h > mw) {
        w = Math.round((w * mw) / h);
        h = mw;
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      tempCanvas.getContext('2d')?.drawImage(image, 0, 0, w, h);
      return tempCanvas.toDataURL('image/jpeg', q);
    };
    
    let dataUrl = compress(currentMaxWidth, currentQuality);
    while (dataUrl.length > 950000 && currentMaxWidth > 400) {
      currentMaxWidth -= 200;
      currentQuality -= 0.1;
      dataUrl = compress(currentMaxWidth, Math.max(0.3, currentQuality));
    }
    
    if (dataUrl.length > 1048000) {
      alert("Image is still too large after compression. Please use a smaller image.");
      return null;
    }
    return dataUrl;
  } catch (err) {
    console.error("Error compressing original:", err);
    return null;
  }
}
"""

if "export default function ImageCropperModal" in content:
    content = content.replace("export default function ImageCropperModal", helper_code + "export default function ImageCropperModal")
    
with open("src/components/ImageCropperModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Helper function added")
