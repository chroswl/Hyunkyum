import re

with open("src/components/SelectedPerformances.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_statement = "import { uploadToCloudinary } from '../cloudinary';"
if import_statement not in content:
    content = content.replace("import { doc, updateDoc } from 'firebase/firestore';", "import { doc, updateDoc } from 'firebase/firestore';\n" + import_statement)

old_block = r"""    const storageRef = ref\(storage, `hero_slides/\$\{Date\.now\(\)\}_\$\{file\.name\}`\);[\s\S]*?setUploadProgress\(null\);\s*\}\s*\);\s*\}\s*\);"""

new_block = """    setUploadProgress(0);
    try {
      let downloadURL = '';
      try {
        downloadURL = await uploadToCloudinary(file, (progress) => {
          setUploadProgress(progress);
        });
      } catch (cloudErr) {
        console.warn("Cloudinary failed, falling back to Firebase Storage", cloudErr);
        const storageRef = ref(storage, `hero_slides/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        downloadURL = await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }
      setEditingItem(prev => prev ? { 
        ...prev, 
        image: downloadURL,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image'
      } : null);
      showNotification("File uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      showNotification(`Failed to upload file: ${error.message}`, "error");
    } finally {
      setUploadProgress(null);
    }"""

content = re.sub(old_block, new_block, content)

with open("src/components/SelectedPerformances.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched SelectedPerformances")
