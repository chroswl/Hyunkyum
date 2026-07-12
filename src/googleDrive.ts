export const uploadToGoogleDrive = async (
  fileOrBase64: File | string,
  accessToken: string,
  onProgress?: (p: number) => void
): Promise<string> => {
  if (!accessToken) {
    throw new Error("Google access token is missing. Please log in again to authorize Google Drive access.");
  }

  // 1. Prepare Blob, mimeType, and fileName
  let blob: Blob;
  let mimeType: string;
  let fileName: string;

  if (typeof fileOrBase64 === 'string') {
    if (!fileOrBase64.startsWith('data:')) {
      throw new Error("Invalid base64 format");
    }
    const arr = fileOrBase64.split(',');
    mimeType = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    blob = new Blob([u8arr], { type: mimeType });
    const ext = mimeType.split('/')[1] || 'jpg';
    fileName = `upload_${Date.now()}.${ext}`;
  } else {
    blob = fileOrBase64;
    mimeType = fileOrBase64.type || 'image/jpeg';
    fileName = fileOrBase64.name || `upload_${Date.now()}.jpg`;
  }

  // 2. Build Multipart/Related body
  const boundary = 'foo_bar_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: mimeType
  };

  const metadataPart = 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata);

  // Convert blob to ArrayBuffer to construct the final multipart Body
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });

  const parts = [
    delimiter,
    metadataPart,
    delimiter,
    `Content-Type: ${mimeType}\r\n\r\n`,
    new Uint8Array(arrayBuffer),
    close_delim
  ];

  const multipartBody = new Blob(parts, { type: `multipart/related; boundary=${boundary}` });

  // 3. Upload file via XMLHttpRequest
  const uploadResponse = await new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (err) {
          reject(new Error("Failed to parse upload response"));
        }
      } else {
        console.error("Google Drive upload failed:", xhr.responseText);
        reject(new Error(`Google Drive upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during Google Drive upload"));
    };

    xhr.send(multipartBody);
  });

  const fileId = uploadResponse.id;
  if (!fileId) {
    throw new Error("Upload succeeded but file ID was not returned");
  }

  // 4. Set file permission to public (anyone reader)
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      console.warn("Failed to set public permission on uploaded file:", text);
    }
  }).catch((err) => {
    console.warn("Failed to set public permission:", err);
  });

  // 5. Return direct view URL
  return `https://lh3.googleusercontent.com/d/${fileId}`;
};
