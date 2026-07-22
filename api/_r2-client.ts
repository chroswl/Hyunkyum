import { S3Client } from "@aws-sdk/client-s3";

export const checkR2EnvVars = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL;

  return {
    R2_ACCOUNT_ID: !!accountId,
    R2_ACCESS_KEY_ID: !!accessKeyId,
    R2_SECRET_ACCESS_KEY: !!secretAccessKey,
    R2_BUCKET_NAME: !!bucketName,
    R2_PUBLIC_URL: !!process.env.R2_PUBLIC_URL,
    VITE_R2_PUBLIC_URL: !!process.env.VITE_R2_PUBLIC_URL,
    resolvedPublicUrl: publicUrl || null,
  };
};

export const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  const envs = checkR2EnvVars();
  console.log("[DIAGNOSTIC] Checking R2 Client environment variables:", JSON.stringify(envs));

  if (!accountId || !accessKeyId || !secretAccessKey) {
    const missing = [];
    if (!accountId) missing.push("R2_ACCOUNT_ID");
    if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
    throw new Error(`Missing R2 credentials in environment variables: ${missing.join(", ")}`);
  }

  return new S3Client({
    endpoint: `https://${accountId.trim()}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    },
    region: "auto",
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
};

export const getR2BucketName = () => {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("Missing R2_BUCKET_NAME in environment variables.");
  }
  return bucketName.trim();
};

export const getR2PublicUrl = () => {
  const publicUrl = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("Missing R2_PUBLIC_URL / VITE_R2_PUBLIC_URL in environment variables.");
  }
  return publicUrl.trim();
};
