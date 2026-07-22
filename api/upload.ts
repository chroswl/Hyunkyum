import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2BucketName, getR2PublicUrl, checkR2EnvVars } from "./_r2-client.js";
import { URL } from "url";

const parseJsonBody = async (req: any): Promise<any> => {
  if (req.body) {
    if (typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
      try { return JSON.parse(req.body); } catch (e) { return {}; }
    }
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: any) => { data += chunk; });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
};

export default async function handler(req: any, res: any) {
  const envVars = checkR2EnvVars();

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use POST or GET." });
  }

  try {
    const bodyObj = await parseJsonBody(req);
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    let filename = urlObj.searchParams.get("filename") || bodyObj.filename || "file";
    let contentType = urlObj.searchParams.get("contentType") || bodyObj.contentType || "application/octet-stream";
    let folder = urlObj.searchParams.get("folder") || bodyObj.folder || "";

    const client = getR2Client();
    const bucket = getR2BucketName();
    const publicUrl = getR2PublicUrl();

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const sanitizedFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "file";
    const key = folder 
      ? `${folder}/${uniqueId}_${sanitizedFilename}`
      : `${uniqueId}_${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL for direct browser PUT upload (expires in 1 hour)
    const presignedUrl = await getSignedUrl(client as any, command, { expiresIn: 3600 });
    const fileUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

    return res.status(200).json({
      success: true,
      presignedUrl,
      key,
      url: fileUrl,
    });
  } catch (error: any) {
    console.error("[/api/upload] Error generating presigned URL:", error);
    return res.status(500).json({
      error: "Internal Server Error generating presigned URL",
      envVarsDetected: envVars,
      errorMessage: error.message || String(error),
      errorCode: error.code || error.$metadata?.httpStatusCode || error.name,
      stack: error.stack || null,
    });
  }
}

