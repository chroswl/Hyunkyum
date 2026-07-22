export const config = { api: { bodyParser: false } };
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName, getR2PublicUrl, checkR2EnvVars } from "./_r2-client.js";
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
  console.log("[DIAGNOSTIC /api/upload] Incoming request method:", req.method);
  console.log("[DIAGNOSTIC /api/upload] Environment variables state:", JSON.stringify(envVars));

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

  let stage = "init";

  try {
    stage = "parse_query_params";
    let filename = "file";
    let contentType = "application/octet-stream";
    let folder = "";
    
    // Check if there's a query string for raw stream uploads
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (urlObj.searchParams.has("filename")) {
      filename = urlObj.searchParams.get("filename") || "file";
      contentType = urlObj.searchParams.get("contentType") || "application/octet-stream";
      folder = urlObj.searchParams.get("folder") || "";
    } else {
      console.warn("[DIAGNOSTIC /api/upload] Missing filename in query parameters.");
      return res.status(400).json({ error: "Missing filename in query parameters", envVars });
    }

    console.log(`[DIAGNOSTIC /api/upload] Parameters: filename=${filename}, contentType=${contentType}, folder=${folder}`);

    stage = "init_r2_client";
    const client = getR2Client();
    const bucket = getR2BucketName();
    const publicUrl = getR2PublicUrl();
    console.log(`[DIAGNOSTIC /api/upload] R2 initialized successfully. Bucket=${bucket}, PublicUrl=${publicUrl}`);

    stage = "read_request_body";
    const buffer = await getRequestBody(req);
    console.log(`[DIAGNOSTIC /api/upload] Body read complete. Buffer byte size: ${buffer.length}`);

    const finalContentType = contentType || "application/octet-stream";

    // Generate unique Key
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const sanitizedFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "file";
      
    const key = folder 
      ? `${folder}/${uniqueId}_${sanitizedFilename}`
      : `${uniqueId}_${sanitizedFilename}`;

    stage = "execute_put_object";
    console.log(`[DIAGNOSTIC /api/upload] Executing PutObjectCommand for key: ${key}`);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: finalContentType,
      Body: buffer, // Buffer explicitly gives length to AWS SDK
    });

    const sendResult = await client.send(command);
    console.log("[DIAGNOSTIC /api/upload] PutObjectCommand success:", sendResult);

    const fileUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

    return res.status(200).json({
      success: true,
      url: fileUrl,
      key: key,
    });
  } catch (error: any) {
    console.error(`[DIAGNOSTIC /api/upload] Error at stage "${stage}":`, error);
    
    return res.status(500).json({
      error: "Internal Server Error during single upload",
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
