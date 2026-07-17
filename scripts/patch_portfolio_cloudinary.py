import re

with open("src/components/PortfolioGallery.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { db, storage } from '../firebase';", "import { db, storage } from '../firebase';\nimport { uploadToCloudinary } from '../cloudinary';")

old_upload = """    const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadProgress(0);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
        setUploadProgress(null);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const newItem: PortfolioItem = {
          id: '',
          url: downloadURL,
          title: file.name,
          titleEN: file.name,
          titleDE: file.name,
          titleKO: file.name,
          order: items.length
        };
        const savedItem = await savePortfolioItem(newItem);
        onItemsUpdated([...items, savedItem]);
        setUploadProgress(null);
      }
    );"""

new_upload = """    setUploadProgress(0);
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
      
      const newItem: PortfolioItem = {
        id: '',
        url: downloadURL,
        title: file.name,
        titleEN: file.name,
        titleDE: file.name,
        titleKO: file.name,
        order: items.length
      };
      const savedItem = await savePortfolioItem(newItem);
      onItemsUpdated([...items, savedItem]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploadProgress(null);
    }"""

content = content.replace(old_upload, new_upload)

with open("src/components/PortfolioGallery.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched PortfolioGallery.tsx for Cloudinary")
