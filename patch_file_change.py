import re

with open("src/components/PortfolioGallery.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add import if missing
if "uploadToCloudinary" not in content:
    content = content.replace("import { db, storage, savePortfolioItem, deletePortfolioItem } from '../firebase';", "import { db, storage, savePortfolioItem, deletePortfolioItem } from '../firebase';\nimport { uploadToCloudinary } from '../cloudinary';")

# Replace handleFileChange body
old_block_match = re.search(r'const storageRef = ref\(storage, `gallery/\$\{Date\.now\(\)\}_\$\{file\.name\}`\);[\s\S]*?async \(\) => \{[\s\S]*?setUploadProgress\(null\);\s*\}\s*\);', content)
if old_block_match:
    new_block = """setUploadProgress(0);
    try {
      let downloadURL = '';
      try {
        downloadURL = await uploadToCloudinary(file, (progress) => {
          setUploadProgress(progress);
        });
      } catch (cloudErr) {
        console.warn("Cloudinary failed, falling back to Firebase Storage", cloudErr);
        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
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
      
      setEditingItem(prev => ({
        ...prev,
        url: downloadURL
      }));
      showNotification("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Upload failed:", error);
      showNotification(`Failed to upload image: ${error.message || 'Unknown error'}`, "error");
    } finally {
      setUploadProgress(null);
    }"""
    content = content[:old_block_match.start()] + new_block + content[old_block_match.end():]
    with open("src/components/PortfolioGallery.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched handleFileChange successfully")
else:
    print("Could not find the block to patch")
