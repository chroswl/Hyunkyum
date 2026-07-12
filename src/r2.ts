const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

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
  if (isAIStudioPreview()) {
    throw new Error("R2 upload skipped in AI Studio Preview environment.");
  }
  let fileData: string;
  let filename = "file";
  let contentType = "application/octet-stream";

  if (typeof fileOrBase64 === "string") {
    fileData = fileOrBase64;
    // Extract content type from base64 data URI if present
    const mimeMatch = fileOrBase64.match(/^data:([^;]+);base64,/);
    if (mimeMatch) {
      contentType = mimeMatch[1];
    }
  } else {
    filename = fileOrBase64.name;
    contentType = fileOrBase64.type;
    fileData = await fileToBase64(fileOrBase64);
  }

  const payload = {
    file: fileData,
    filename,
    contentType,
    folder,
  };

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.url) {
            resolve(response.url);
          } else {
            reject(new Error(response.error || "Upload failed: Invalid response from server."));
          }
        } catch (e) {
          reject(new Error("Upload failed: Invalid JSON response from server."));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          reject(new Error(response.error || `Upload failed with status code: ${xhr.status}`));
        } catch (e) {
          reject(new Error(`Upload failed with status code: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload to R2 API."));
    };

    xhr.send(JSON.stringify(payload));
  });
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
