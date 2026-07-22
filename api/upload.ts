import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName, getR2PublicUrl } from "./_r2-client.ts";
import { URL } from 'url';

const getRequestBody = (req: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
};

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    let filename = "file";
    let contentType = "application/octet-stream";
    let folder = "";
    
    // Check if there's a query string for raw stream uploads
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    if (urlObj.searchParams.has("filename")) {
      filename = urlObj.searchParams.get("filename") || "file";
      contentType = urlObj.searchParams.get("contentType") || "application/octet-stream";
      folder = urlObj.searchParams.get("folder") || "";
    } else {
      return res.status(400).json({ error: "Missing filename in query parameters" });
    }

    // Check if Cloudflare R2 is configured
    let useR2 = true;
    try {
      getR2Client();
      getR2BucketName();
      getR2PublicUrl();
    } catch (e) {
      useR2 = false;
    }

    if (!useR2) {
      return res.status(500).json({ error: "Cloudflare R2 is not configured. Direct upload requires R2 credentials." });
    }

    const finalContentType = contentType || "application/octet-stream";

    // Generate unique Key
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const sanitizedFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "file";
      
    const key = folder 
      ? `${folder}/${uniqueId}_${sanitizedFilename}`
      : `${uniqueId}_${sanitizedFilename}`;

    const client = getR2Client();
    const bucket = getR2BucketName();
    const publicUrl = getR2PublicUrl();

    // Read the whole body into a Buffer
    const buffer = await getRequestBody(req);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: finalContentType,
      Body: buffer, // Buffer explicitly gives length to AWS SDK
    });

    await client.send(command);

    const fileUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

    return res.status(200).json({
      success: true,
      url: fileUrl,
      key: key,
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during upload",
      message: error.message || String(error),
    });
  }
}
