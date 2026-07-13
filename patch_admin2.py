import re

with open("src/components/AdminPanel.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_statement = "import { uploadToCloudinary } from '../cloudinary';"
if import_statement not in content:
    content = content.replace("import { auth, db } from '../firebase';", "import { auth, db } from '../firebase';\n" + import_statement)

old_upload = """          const downloadUrl = await uploadBase64ImageWithProgress(
            uploadedStoragePath, 
            cropTarget.src,
            (progress) => {
              setUploadProgress(progress);
            }
          );"""

new_upload = """          let downloadUrl = '';
          try {
            downloadUrl = await uploadToCloudinary(cropTarget.src, (progress) => {
              setUploadProgress(progress);
            });
          } catch (e) {
            console.warn("Cloudinary upload failed, falling back to Firebase Storage", e);
            downloadUrl = await uploadBase64ImageWithProgress(
              uploadedStoragePath, 
              cropTarget.src,
              (progress) => {
                setUploadProgress(progress);
              }
            );
          }"""

# Actually, AdminPanel has multiple uploadBase64ImageWithProgress calls. Let's find them all.
content = re.sub(r'const\s+([a-zA-Z0-9_]+)\s*=\s*await\s+uploadBase64ImageWithProgress\(\s*([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_\.]+),\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>\s*\{\s*setUploadProgress\(\4\);\s*\}\s*\);',
r'''let \1 = '';
          try {
            \1 = await uploadToCloudinary(\3, (\4) => {
              setUploadProgress(\4);
            });
          } catch (e) {
            console.warn("Cloudinary upload failed, falling back to Firebase Storage", e);
            \1 = await uploadBase64ImageWithProgress(
              \2, 
              \3,
              (\4) => {
                setUploadProgress(\4);
              }
            );
          }''', content)

with open("src/components/AdminPanel.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched AdminPanel")
