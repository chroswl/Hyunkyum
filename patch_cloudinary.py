import re

with open("src/cloudinary.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_url = "const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;"
new_url = "const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;"

content = content.replace(old_url, new_url)

old_vars = """  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;"""

new_vars = """  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "f77c65b5-bf1b-4675-913f-7a3915d012f9";
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "Hompage";"""

content = content.replace(old_vars, new_vars)

with open("src/cloudinary.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched src/cloudinary.ts")
