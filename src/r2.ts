export const isAIStudioPreview = (): boolean => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  const isDevMode = !!(import.meta as any).env?.DEV;
  return (
    isDevMode ||
    hostname.includes("ais-dev-") ||
    hostname.includes("ais-pre-") ||
    hostname.includes("aistudio") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
};

export const uploadToR2 = async (
  fileOrBase64: File | string,
  onProgress?: (progress: number) => void,
  folder?: string
): Promise<string> => {
  let file: File | Blob;
  let filename = "file";
  let contentType = "application/octet-stream";

  if (typeof fileOrBase64 === "string") {
    // Extract content type from base64 data URI if present
    const mimeMatch = fileOrBase64.match(/^data:([^;]+);base64,/);
    if (mimeMatch) {
      contentType = mimeMatch[1];
    }
    
    // Convert base64 to Blob
    const base64Content = fileOrBase64.includes("base64,") 
      ? fileOrBase64.split("base64,")[1] 
      : fileOrBase64;
    
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    file = new Blob([byteArray], { type: contentType });
  } else {
    filename = fileOrBase64.name;
    contentType = fileOrBase64.type;
    file = fileOrBase64;
  }

  if (onProgress) onProgress(0); // Start progress

  const queryParams = new URLSearchParams({
    filename: filename,
    contentType: contentType,
  });
  if (folder) {
    queryParams.append("folder", folder);
  }

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

  if (file.size <= CHUNK_SIZE) {
    // Single part upload
    const response = await fetch(`/api/upload?${queryParams.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to upload: ${response.status}`);
    }

    const { url: fileUrl } = await response.json();
    if (onProgress) onProgress(100);
    return fileUrl;
  }

  // Multipart upload
  const startRes = await fetch(`/api/upload-multipart?${queryParams.toString()}`, {
    method: "POST",
    headers: { "x-action": "start" },
  });
  
  if (!startRes.ok) {
    const errorData = await startRes.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to start multipart upload: ${startRes.status}`);
  }
  
  const { uploadId, key } = await startRes.json();
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  const parts = [];

  for (let i = 0; i < totalParts; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const partNumber = i + 1;

    const uploadRes = await fetch(`/api/upload-multipart?uploadId=${encodeURIComponent(uploadId)}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`, {
      method: "POST",
      headers: { 
        "x-action": "upload",
        "Content-Type": "application/octet-stream" 
      },
      body: chunk,
    });
    
    if (!uploadRes.ok) throw new Error(`Failed to upload part ${partNumber}`);
    
    const { ETag } = await uploadRes.json();
    parts.push({ PartNumber: partNumber, ETag });

    if (onProgress) onProgress(Math.round(((i + 1) / totalParts) * 100));
  }

  const completeRes = await fetch(`/api/upload-multipart`, {
    method: "POST",
    headers: { 
      "x-action": "complete", 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({ uploadId, key, parts }),
  });

  if (!completeRes.ok) throw new Error("Failed to complete upload");
  
  const { url: fileUrl } = await completeRes.json();
  if (onProgress) onProgress(100);
  return fileUrl;
};

export const deleteFromR2 = async (url: string): Promise<void> => {
  if (!url) return;

  const publicUrl = (import.meta as any).env.VITE_R2_PUBLIC_URL || "";
  if (!publicUrl) {
    console.warn("VITE_R2_PUBLIC_URL is not set. Cannot verify R2 URL ownership.");
    // Let's still attempt extraction from standard pathname if it looks like an R2 URL
    if (!url.includes("firebasestorage.googleapis.com") && !url.startsWith("data:")) {
      console.log("Attempting generic key extraction for R2...");
    } else {
      return;
    }
  }

  try {
    const urlObj = new URL(url);
    const pubUrlObj = publicUrl ? new URL(publicUrl) : null;

    // Check if the URL belongs to our R2 bucket, or is any non-Firebase URL
    if (!pubUrlObj || urlObj.hostname === pubUrlObj.hostname || urlObj.hostname.includes("r2.dev")) {
      const key = decodeURIComponent(
        urlObj.pathname.startsWith("/") ? urlObj.pathname.slice(1) : urlObj.pathname
      );
      
      if (key) {
        console.log(`Requesting deletion of R2 key: ${key}`);
        const response = await fetch("/api/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to delete from R2");
        }
        console.log(`Successfully deleted R2 key: ${key}`);
      }
    }
  } catch (err) {
    console.error("Error during R2 deletion:", err);
  }
};
