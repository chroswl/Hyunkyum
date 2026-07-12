import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName, getR2PublicUrl } from "./_r2-client";

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
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const { file, filename, contentType, folder } = body || {};

    if (!file) {
      return res.status(400).json({ error: "Missing required parameter: file (Base64 string)" });
    }

    // Decode base64
    const base64Content = file.includes("base64,")
      ? file.split("base64,")[1]
      : file;
    const buffer = Buffer.from(base64Content, "base64");

    const finalContentType = contentType || "application/octet-stream";

    // Generate unique Key
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const sanitizedFilename = filename
      ? filename.replace(/[^a-zA-Z0-9.-]/g, "_")
      : "file";
    
    const key = folder 
      ? `${folder}/${uniqueId}_${sanitizedFilename}`
      : `${uniqueId}_${sanitizedFilename}`;

    const client = getR2Client();
    const bucket = getR2BucketName();
    const publicUrl = getR2PublicUrl();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: finalContentType,
    });

    await client.send(command);

    const fileUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

    return res.status(200).json({
      success: true,
      url: fileUrl,
      key: key,
    });
  } catch (error: any) {
    console.error("R2 Upload Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during upload",
      message: error.message || String(error),
    });
  }
}
