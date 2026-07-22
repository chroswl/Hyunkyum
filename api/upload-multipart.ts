import { 
  CreateMultipartUploadCommand, 
  UploadPartCommand, 
  CompleteMultipartUploadCommand 
} from "@aws-sdk/client-s3";
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-action");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const action = req.headers['x-action'];
    const client = getR2Client();
    const bucket = getR2BucketName();
    const publicUrl = getR2PublicUrl();

    if (action === 'start') {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const filename = urlObj.searchParams.get("filename") || "file";
      const contentType = urlObj.searchParams.get("contentType") || "application/octet-stream";
      const folder = urlObj.searchParams.get("folder") || "";

      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = folder ? `${folder}/${uniqueId}_${sanitizedFilename}` : `${uniqueId}_${sanitizedFilename}`;

      const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });

      const response = await client.send(command);
      return res.status(200).json({ uploadId: response.UploadId, key });
    } 
    
    else if (action === 'upload') {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const uploadId = urlObj.searchParams.get("uploadId");
      const key = urlObj.searchParams.get("key");
      const partNumber = parseInt(urlObj.searchParams.get("partNumber") || "1", 10);

      if (!uploadId || !key) {
        return res.status(400).json({ error: "Missing uploadId or key" });
      }

      const buffer = await getRequestBody(req);

      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: buffer,
      });

      const response = await client.send(command);
      return res.status(200).json({ ETag: response.ETag });
    }
    
    else if (action === 'complete') {
      const bodyStr = (await getRequestBody(req)).toString('utf-8');
      const { uploadId, key, parts } = JSON.parse(bodyStr);

      if (!uploadId || !key || !parts) {
        return res.status(400).json({ error: "Missing complete parameters" });
      }

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
      return res.status(200).json({ url: fileUrl, key });
    }

    else {
      return res.status(400).json({ error: "Invalid action header" });
    }

  } catch (error: any) {
    console.error("Multipart Upload Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during upload",
      message: error.message || String(error),
    });
  }
}
