with open('src/components/AdminPanel.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const handleLogin = " in line:
        insert_idx = i
        break

code = """
  const handleImageCropUpload = (file: File | undefined, onCropSuccess: (base64: string) => void, aspect?: number) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setCropTarget({ 
          src: e.target.result, 
          aspect, 
          onCrop: (base64) => { 
            onCropSuccess(base64); 
            setCropTarget(null); 
            triggerAlert('success', 'Image processed successfully!');
          } 
        });
      }
    };
    reader.readAsDataURL(file);
  };
"""

lines.insert(insert_idx, code)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.writelines(lines)
print("Done")
