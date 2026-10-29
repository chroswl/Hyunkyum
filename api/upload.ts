import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2BucketName, getR2PublicUrl, checkR2EnvVars } from "./_r2-client.js";
import { verifyAdminAuth } from "./_auth.js";
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-direct-upload, x-upload-mode, x-filename, x-folder");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use POST or GET." });
  }

  // Enforce Administrator Permissions for uploads
  if (req.method === "POST") {
    const authCheck = await verifyAdminAuth(req);
    if (!authCheck.authorized) {
      return res.status(401).json({
        error: "Unauthorized",
        message: authCheck.error || "Administrator permissions required. Only chroswl@gmail.com is authorized."
      });
    }
  }

  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const isDirect = 
      req.headers["x-direct-upload"] === "true" || 
      urlObj.searchParams.get("direct") === "1" ||
      req.headers["x-upload-mode"] === "direct";

    let filename = urlObj.searchParams.get("filename") || (req.headers["x-filename"] as string) || "file";
    let contentType = urlObj.searchParams.get("contentType") || (req.headers["content-type"] as string) || "application/octet-stream";
    let folder = urlObj.searchParams.get("folder") || (req.headers["x-folder"] as string) || "";

    const client = getR2Client();
    const bucket = getR2BucketName();
    const publicUrl = getR2PublicUrl();

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const sanitizedFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "file";
    const key = folder 
      ? `${folder}/${uniqueId}_${sanitizedFilename}`
      : `${uniqueId}_${sanitizedFilename}`;

    if (isDirect) {
      // Direct stream pipe to Cloudflare R2 avoiding browser CORS restrictions
      const uploader = new Upload({
        client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: req,
          ContentType: contentType,
        },
      });

      await uploader.done();
      const fileUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

      return res.status(200).json({
        success: true,
        url: fileUrl,
        key,
      });
    }

    const bodyObj = await parseJsonBody(req);
    filename = urlObj.searchParams.get("filename") || bodyObj.filename || filename;
    contentType = urlObj.searchParams.get("contentType") || bodyObj.contentType || contentType;
    folder = urlObj.searchParams.get("folder") || bodyObj.folder || folder;

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

