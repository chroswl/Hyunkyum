export const config = { api: { bodyParser: false } };
import { 
  CreateMultipartUploadCommand, 
  UploadPartCommand, 
  CompleteMultipartUploadCommand 
} from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName, getR2PublicUrl, checkR2EnvVars } from "./_r2-client";
import { URL } from 'url';

const getRequestBody = (req: any): Promise<Buffer> => {
  if (req.body) {
    if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
    if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body));
    if (typeof req.body === 'object') return Promise.resolve(Buffer.from(JSON.stringify(req.body)));
  }
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
  const envVars = checkR2EnvVars();
  console.log("[DIAGNOSTIC /api/upload-multipart] Incoming request method:", req.method);
  console.log("[DIAGNOSTIC /api/upload-multipart] Environment variables state:", JSON.stringify(envVars));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-action");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  let action = "unknown";
  let stage = "init";

  try {
    action = (req.headers['x-action'] || req.headers['X-Action'] || 'unknown') as string;
    console.log(`[DIAGNOSTIC /api/upload-multipart] Action header: "${action}"`);

    stage = "init_r2_client";
    const client = getR2Client();
    const bucket = getR2BucketName();
    const publicUrl = getR2PublicUrl();
    console.log(`[DIAGNOSTIC /api/upload-multipart] R2 initialized. Bucket=${bucket}, PublicUrl=${publicUrl}`);

    if (action === 'start') {
      stage = "multipart_start_params";
      const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const filename = urlObj.searchParams.get("filename") || "file";
      const contentType = urlObj.searchParams.get("contentType") || "application/octet-stream";
      const folder = urlObj.searchParams.get("folder") || "";

      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = folder ? `${folder}/${uniqueId}_${sanitizedFilename}` : `${uniqueId}_${sanitizedFilename}`;

      console.log(`[DIAGNOSTIC /api/upload-multipart] [start] filename=${filename}, contentType=${contentType}, key=${key}`);

      stage = "execute_create_multipart_upload";
      const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });

      const response = await client.send(command);
      console.log(`[DIAGNOSTIC /api/upload-multipart] [start] Created UploadId=${response.UploadId}`);
      return res.status(200).json({ uploadId: response.UploadId, key });
    } 
    
    else if (action === 'upload') {
      stage = "multipart_upload_params";
      const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const uploadId = urlObj.searchParams.get("uploadId");
      const key = urlObj.searchParams.get("key");
      const partNumber = parseInt(urlObj.searchParams.get("partNumber") || "1", 10);

      if (!uploadId || !key) {
        console.warn("[DIAGNOSTIC /api/upload-multipart] [upload] Missing uploadId or key");
        return res.status(400).json({ error: "Missing uploadId or key", envVars });
      }

      stage = "multipart_upload_read_body";
      const buffer = await getRequestBody(req);
      console.log(`[DIAGNOSTIC /api/upload-multipart] [upload] PartNumber=${partNumber}, Body size=${buffer.length} bytes`);

      stage = "execute_upload_part";
      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: buffer,
      });

      const response = await client.send(command);
      console.log(`[DIAGNOSTIC /api/upload-multipart] [upload] PartNumber=${partNumber} uploaded. ETag=${response.ETag}`);
      return res.status(200).json({ ETag: response.ETag });
    }
    
    else if (action === 'complete') {
      stage = "multipart_complete_read_body";
      const bodyStr = (await getRequestBody(req)).toString('utf-8');
      console.log(`[DIAGNOSTIC /api/upload-multipart] [complete] Raw body string length: ${bodyStr.length}`);

      stage = "multipart_complete_parse_json";
      let parsedBody: any = {};
      try {
        parsedBody = JSON.parse(bodyStr);
      } catch (jsonErr) {
        console.error("[DIAGNOSTIC /api/upload-multipart] [complete] Failed to parse JSON body:", jsonErr);
      }

      const { uploadId, key, parts } = parsedBody;

      if (!uploadId || !key || !parts || !Array.isArray(parts)) {
        console.warn("[DIAGNOSTIC /api/upload-multipart] [complete] Missing parameters or parts is not an array:", { uploadId, key, partsCount: parts?.length });
        return res.status(400).json({ error: "Missing complete parameters or invalid parts array", parsedBody, envVars });
      }

      console.log(`[DIAGNOSTIC /api/upload-multipart] [complete] Completing uploadId=${uploadId}, key=${key}, parts count=${parts.length}`);

      stage = "execute_complete_multipart_upload";
      const command = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts, // Array of { ETag, PartNumber }
        },
      });

      await client.send(command);
      const fileUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;
      console.log(`[DIAGNOSTIC /api/upload-multipart] [complete] Success! File URL=${fileUrl}`);
      return res.status(200).json({ url: fileUrl, key });
    }

    else {
      console.warn(`[DIAGNOSTIC /api/upload-multipart] Invalid action header: "${action}"`);
      return res.status(400).json({ error: `Invalid action header: "${action}"`, envVars });
    }

  } catch (error: any) {
    console.error(`[DIAGNOSTIC /api/upload-multipart] Error at action "${action}", stage "${stage}":`, error);
    return res.status(500).json({
      error: "Internal Server Error during multipart upload",
      failedAction: action,
      failedStage: stage,
      envVarsDetected: envVars,
      errorMessage: error.message || String(error),
      errorName: error.name || "UnknownError",
      errorCode: error.code || error.$metadata?.httpStatusCode || error.name,
      errorMetadata: error.$metadata || null,
      stack: error.stack || null,
    });
  }
}
