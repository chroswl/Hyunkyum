import re

with open("src/components/AdminPanel.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add import
content = content.replace("import { auth, db } from '../firebase';", "import { auth, db } from '../firebase';\nimport { uploadToCloudinary } from '../cloudinary';")

# Replace uploadBase64ImageWithProgress calls
old_upload = """          const downloadUrl = await uploadBase64ImageWithProgress(
            uploadedStoragePath, 
            editingPortfolio.url,
            (progress) => {
              setUploadProgress(progress);
            }
          );"""

new_upload = """          let downloadUrl = '';
          try {
            downloadUrl = await uploadToCloudinary(editingPortfolio.url, (progress) => {
              setUploadProgress(progress);
            });
          } catch (e) {
            console.warn("Cloudinary upload failed, falling back to Firebase Storage", e);
            downloadUrl = await uploadBase64ImageWithProgress(
              uploadedStoragePath, 
              editingPortfolio.url,
              (progress) => {
                setUploadProgress(progress);
              }
            );
          }"""
          
content = content.replace(old_upload, new_upload)

with open("src/components/AdminPanel.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched AdminPanel.tsx for Cloudinary")
