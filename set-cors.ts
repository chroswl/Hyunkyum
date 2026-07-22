import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName } from "./api/_r2-client.ts";

async function setCors() {
  const client = getR2Client();
  const bucket = getR2BucketName();
  
  const command = new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          AllowedOrigins: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  });

  try {
    await client.send(command);
    console.log("CORS configured successfully.");
  } catch (error) {
    console.error("Error configuring CORS:", error);
  }
}

setCors();
