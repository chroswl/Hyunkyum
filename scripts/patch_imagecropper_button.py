import re

with open("src/components/ImageCropperModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_button = """<button type="button" className="flex-1 py-3 px-4 bg-[var(--color-bg)] text-[var(--color-text)] font-semibold rounded-sm font-sans uppercase tracking-wider text-xs flex justify-center items-center" onClick={() => onCropDone(imageSrc)}>Upload Original</button>"""

new_button = """<button type="button" disabled={isProcessing} className="flex-1 py-3 px-4 bg-[var(--color-bg)] text-[var(--color-text)] border border-neutral-700 font-semibold rounded-sm font-sans uppercase tracking-wider text-xs flex justify-center items-center hover:bg-neutral-800 transition-colors" onClick={async () => {
            setIsProcessing(true);
            const compressed = await compressOriginalImage(imageSrc);
            if (compressed) {
              onCropDone(compressed);
            } else {
              onCropCancel();
            }
            setIsProcessing(false);
          }}>
            {isProcessing ? 'Processing...' : 'Upload Original'}
          </button>"""

if old_button in content:
    content = content.replace(old_button, new_button)
    with open("src/components/ImageCropperModal.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched Upload Original button")
else:
    print("Could not find Upload Original button")
