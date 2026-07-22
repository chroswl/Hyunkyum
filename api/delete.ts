import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName } from "./_r2-client.ts";

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

    const { key } = body || {};

    if (!key) {
      return res.status(400).json({ error: "Missing required parameter: key" });
    }

    const client = getR2Client();
    const bucket = getR2BucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);

    return res.status(200).json({
      success: true,
      message: `Object with key "${key}" deleted successfully from Cloudflare R2.`,
    });
  } catch (error: any) {
    console.error("R2 Delete Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during deletion",
      message: error.message || String(error),
    });
  }
}
