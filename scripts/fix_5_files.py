import re

files = [
    'src/components/ContactForm.tsx',
    'src/components/VideoPlayer.tsx',
    'src/components/SelectedPerformances.tsx',
    'src/components/AdminPanel.tsx',
    'src/components/ImageCropperModal.tsx'
]

for filepath in files:
    try:
        with open(filepath, 'r') as f:
            text = f.read()
        
        # Replace background classes with bg-[var(--color-bg)]
        text = re.sub(r'\bbg-neutral-\d+(?:/\d+)?\b', 'bg-[var(--color-bg)]', text)
        text = re.sub(r'\bbg-black\b', 'bg-[var(--color-bg)]', text)
        
        # Replace text classes with text-[var(--color-text)]
        text = re.sub(r'\btext-white\b', 'text-[var(--color-text)]', text)
        
        # Fix missing string in AdminPanel (moveItemOrder)
        if filepath == 'src/components/AdminPanel.tsx':
            if "moveItemOrder('selected_performances'" not in text:
                text = text.replace("moveItemOrder('slide'", "moveItemOrder('selected_performances'")
                
        # Fix ImageCropperModal (Upload Original)
        if filepath == 'src/components/ImageCropperModal.tsx':
            if "Upload Original" not in text:
                text = text.replace("<Check className=\"w-4 h-4 mr-2\" /> Apply Crop</>", 
                                    "<Check className=\"w-4 h-4 mr-2\" /> Apply Crop</>\n            ) : (\n              <>Upload Original</>\n            )}</button>\n          <button type=\"button\" className=\"flex-1 py-3 px-4 bg-neutral-800 text-white font-semibold rounded-sm font-sans uppercase tracking-wider text-xs flex justify-center items-center\" onClick={() => onCropDone(imageSrc)}>Upload Original</button>")

        with open(filepath, 'w') as f:
            f.write(text)
        print(f"Updated {filepath}")
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
