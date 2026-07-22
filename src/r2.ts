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
    contentType = fileOrBase64.type || "application/octet-stream";
    file = fileOrBase64;
  }

  if (onProgress) onProgress(0); // Start progress

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

  // For small files <= 5MB: use single presigned PUT upload
  if (file.size <= CHUNK_SIZE) {
    const queryParams = new URLSearchParams({
      filename,
      contentType,
      folder: folder || "",
    });

    const initRes = await fetch(`/api/upload?${queryParams.toString()}`, {
      method: "POST",
    });

    if (!initRes.ok) {
      const errData = await initRes.json().catch(() => ({}));
      throw new Error(errData.errorMessage || errData.error || `Failed to prepare upload: ${initRes.status}`);
    }

    const { presignedUrl, url: fileUrl } = await initRes.json();

    // Direct browser PUT upload to Cloudflare R2
    await uploadDirectXHR(presignedUrl, file, contentType, (loaded, total) => {
      if (onProgress && total > 0) {
        onProgress(Math.min(100, Math.round((loaded / total) * 100)));
      }
    });

    if (onProgress) onProgress(100);
    return fileUrl;
  }

  // For large files > 5MB: use multipart presigned PUT upload
  const startQueryParams = new URLSearchParams({
    filename,
    contentType,
    folder: folder || "",
  });

  const startRes = await fetch(`/api/upload-multipart?${startQueryParams.toString()}`, {
    method: "POST",
    headers: { "x-action": "start" },
  });

  if (!startRes.ok) {
    const errData = await startRes.json().catch(() => ({}));
    throw new Error(errData.errorMessage || errData.error || `Failed to start multipart upload: ${startRes.status}`);
  }

  const { uploadId, key, url: fileUrl } = await startRes.json();
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

  // Request presigned URLs for all parts
  const urlsRes = await fetch(`/api/upload-multipart`, {
    method: "POST",
    headers: { 
      "x-action": "get-part-urls",
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({ uploadId, key, partNumbers }),
  });

  if (!urlsRes.ok) {
    await abortMultipart(uploadId, key);
    throw new Error("Failed to generate presigned URLs for multipart upload.");
  }

  const { presignedUrls } = await urlsRes.json();

  // Track loaded bytes per part for smooth total progress calculation
  const loadedPerPart: number[] = new Array(totalParts).fill(0);
  const updateProgress = () => {
    if (!onProgress) return;
    const totalLoaded = loadedPerPart.reduce((acc, curr) => acc + curr, 0);
    const percent = Math.min(100, Math.round((totalLoaded / file.size) * 100));
    onProgress(percent);
  };

  const parts: { PartNumber: number; ETag: string }[] = [];

  try {
    // Upload chunks with controlled concurrency (3 parallel chunks at a time)
    const CONCURRENCY = 3;
    for (let i = 0; i < totalParts; i += CONCURRENCY) {
      const batchIndices = Array.from(
        { length: Math.min(CONCURRENCY, totalParts - i) },
        (_, idx) => i + idx
      );

      await Promise.all(
        batchIndices.map(async (partIdx) => {
          const partNum = partIdx + 1;
          const start = partIdx * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          const presignedUrl = presignedUrls[partNum];

          const { etag } = await uploadDirectXHR(
            presignedUrl,
            chunk,
            null, // Content-Type for parts is handled by presigned URL signature
            (loaded) => {
              loadedPerPart[partIdx] = loaded;
              updateProgress();
            },
            3 // Retry up to 3 times automatically
          );

          parts.push({
            PartNumber: partNum,
            ETag: etag || "",
          });
        })
      );
    }

    // Complete the multipart upload
    const completeRes = await fetch(`/api/upload-multipart`, {
      method: "POST",
      headers: {
        "x-action": "complete",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uploadId, key, parts }),
    });

    if (!completeRes.ok) {
      const errData = await completeRes.json().catch(() => ({}));
      throw new Error(errData.errorMessage || errData.error || "Failed to complete multipart upload");
    }

    const completeData = await completeRes.json();
    if (onProgress) onProgress(100);
    return completeData.url || fileUrl;

  } catch (err) {
    console.error("Multipart upload error, aborting upload session:", err);
    await abortMultipart(uploadId, key);
    throw err;
  }
};

const abortMultipart = async (uploadId: string, key: string) => {
  try {
    await fetch("/api/upload-multipart", {
      method: "POST",
      headers: {
        "x-action": "abort",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uploadId, key }),
    });
  } catch (err) {
    console.warn("Failed to abort multipart upload:", err);
  }
};

function uploadDirectXHR(
  url: string,
  data: Blob,
  contentType: string | null,
  onProgress?: (loaded: number, total: number) => void,
  maxRetries = 3
): Promise<{ etag: string }> {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    let targetHost = "R2 Endpoint";
    let targetPath = "";
    try {
      const parsedUrl = new URL(url);
      targetHost = parsedUrl.host;
      targetPath = parsedUrl.pathname;
    } catch (e) {
      // fallback
    }

    const execute = () => {
      attempt++;

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);

      if (contentType) {
        xhr.setRequestHeader("Content-Type", contentType);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(e.loaded, e.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let rawEtag = xhr.getResponseHeader("ETag") || xhr.getResponseHeader("etag") || "";
          const etag = rawEtag.trim();
          resolve({ etag });
        } else {
          const statusText = xhr.statusText || "Unknown Status";
          console.error(`Direct upload to ${targetHost} failed with HTTP status ${xhr.status} (${statusText})`);
          
          if (attempt < maxRetries) {
            setTimeout(execute, 1000 * Math.pow(2, attempt - 1));
          } else {
            reject(new Error(`Direct upload to R2 (${targetHost}) failed with HTTP status ${xhr.status}: ${statusText}`));
          }
        }
      };

      xhr.onerror = () => {
        if (attempt < maxRetries) {
          setTimeout(execute, 1000 * Math.pow(2, attempt - 1));
        } else {
          if (xhr.status === 0) {
            reject(new Error(
              `Direct upload to Cloudflare R2 (${targetHost}) failed with HTTP Status 0 (CORS or network policy block).\n` +
              `Ensure your Cloudflare R2 CORS settings allow Origin: *, Method: PUT, Allowed Headers: *, Expose Headers: ETag.`
            ));
          } else {
            reject(new Error(`Direct upload to Cloudflare R2 (${targetHost}) failed due to network error (HTTP Status: ${xhr.status}).`));
          }
        }
      };

      xhr.ontimeout = () => {
        if (attempt < maxRetries) {
          setTimeout(execute, 1000 * Math.pow(2, attempt - 1));
        } else {
          reject(new Error(`Direct upload to R2 (${targetHost}) timed out.`));
        }
      };

      xhr.send(data);
    };

    execute();
  });
}

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
