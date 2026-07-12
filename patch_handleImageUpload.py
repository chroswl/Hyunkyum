import re

with open("src/components/AdminPanel.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_code = """    const reader = new FileReader();
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
    reader.readAsDataURL(file);"""

new_code = """    const objectUrl = URL.createObjectURL(file);
    setCropTarget({ 
      src: objectUrl, 
      aspect, 
      onCrop: (base64) => { 
        onCropSuccess(base64); 
        setCropTarget(null); 
        URL.revokeObjectURL(objectUrl);
        triggerAlert('success', 'Image processed successfully!');
      }
    });"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open("src/components/AdminPanel.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched handleImageUpload")
else:
    print("Could not find old_code")
