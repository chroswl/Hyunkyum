import { 
  CreateMultipartUploadCommand, 
  UploadPartCommand, 
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2BucketName, getR2PublicUrl, checkR2EnvVars } from "./_r2-client.js";
import { URL } from 'url';

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

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-action");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use POST or GET." });
  }

  let action = "unknown";

  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const bodyObj = await parseJsonBody(req);

    action = (
      req.headers['x-action'] || 
      req.headers['X-Action'] || 
      urlObj.searchParams.get('action') || 
      bodyObj.action || 
      'unknown'
    ) as string;

    const client = getR2Client();
    const bucket = getR2BucketName();
    const publicUrl = getR2PublicUrl();

    // ACTION: START MULTIPART UPLOAD
    if (action === 'start') {
      const filename = urlObj.searchParams.get("filename") || bodyObj.filename || "file";
      const contentType = urlObj.searchParams.get("contentType") || bodyObj.contentType || "application/octet-stream";
      const folder = urlObj.searchParams.get("folder") || bodyObj.folder || "";

      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = folder ? `${folder}/${uniqueId}_${sanitizedFilename}` : `${uniqueId}_${sanitizedFilename}`;

      const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });

      const response = await client.send(command);
      const fileUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

      return res.status(200).json({ 
        uploadId: response.UploadId, 
        key,
        url: fileUrl 
      });
    } 

    // ACTION: GET PRESIGNED PART URL(S) (or legacy 'upload')
    if (action === 'get-part-url' || action === 'get-part-urls' || action === 'upload') {
      const uploadId = urlObj.searchParams.get("uploadId") || bodyObj.uploadId;
      const key = urlObj.searchParams.get("key") || bodyObj.key;

      if (!uploadId || !key) {
        return res.status(400).json({ error: "Missing uploadId or key parameter", envVars });
      }

      // Check for batch part numbers request
      const partNumbers = bodyObj.partNumbers || (urlObj.searchParams.get("partNumbers") ? urlObj.searchParams.get("partNumbers")?.split(',').map(Number) : null);

      if (Array.isArray(partNumbers) && partNumbers.length > 0) {
        const presignedUrls: Record<number, string> = {};
        await Promise.all(
          partNumbers.map(async (pNum: number) => {
            const command = new UploadPartCommand({
              Bucket: bucket,
              Key: key,
              UploadId: uploadId,
              PartNumber: Number(pNum),
            });
            presignedUrls[pNum] = await getSignedUrl(client as any, command, { expiresIn: 3600 });
          })
        );
        return res.status(200).json({ presignedUrls });
      }

      // Single part number request
      const partNumber = parseInt(urlObj.searchParams.get("partNumber") || bodyObj.partNumber || "1", 10);
      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const presignedUrl = await getSignedUrl(client as any, command, { expiresIn: 3600 });
      return res.status(200).json({ presignedUrl, partNumber });
    }

    // ACTION: COMPLETE MULTIPART UPLOAD
    if (action === 'complete') {
      const { uploadId, key, parts } = bodyObj;

      if (!uploadId || !key || !parts || !Array.isArray(parts)) {
        return res.status(400).json({ error: "Missing complete parameters or invalid parts array", bodyObj, envVars });
      }

      // Sort parts by PartNumber ascending
      const sortedParts = [...parts].sort((a, b) => Number(a.PartNumber) - Number(b.PartNumber));

      const command = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts.map(p => ({
            PartNumber: Number(p.PartNumber),
            ETag: p.ETag,
          })),
        },
      });

      await client.send(command);
      const fileUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;
      return res.status(200).json({ success: true, url: fileUrl, key });
    }

    // ACTION: ABORT MULTIPART UPLOAD
    if (action === 'abort') {
      const uploadId = urlObj.searchParams.get("uploadId") || bodyObj.uploadId;
      const key = urlObj.searchParams.get("key") || bodyObj.key;

      if (!uploadId || !key) {
        return res.status(400).json({ error: "Missing uploadId or key for abort", envVars });
      }

      const command = new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      });

      await client.send(command);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Invalid or missing action: "${action}"`, envVars });

  } catch (error: any) {
    console.error(`[/api/upload-multipart] Error during action "${action}":`, error);
    return res.status(500).json({
      error: "Internal Server Error during multipart presigned operation",
      failedAction: action,
      envVarsDetected: envVars,
      errorMessage: error.message || String(error),
      errorCode: error.code || error.$metadata?.httpStatusCode || error.name,
      stack: error.stack || null,
    });
  }
}

