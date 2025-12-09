
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

export async function uploadFile(buffer: Buffer, fileName: string, contentType?: string): Promise<string> {
  // Detect file type based on fileName prefix
  const isVideo = fileName.startsWith('videos/');
  const isChatImage = fileName.startsWith('chat-images/');
  
  let key: string;
  if (isVideo) {
    key = `${folderPrefix}${fileName}`; // Videos use their own folder
  } else if (isChatImage) {
    key = `${folderPrefix}${fileName}`; // Chat images use their own folder
  } else {
    key = `${folderPrefix}deliverables/${Date.now()}-${fileName}`; // Deliverables use timestamp
  }
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
  });

  await s3Client.send(command);
  return key; // Return the S3 key (cloud_storage_path)
}

export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

export async function getFileBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as any;
  const chunks: Uint8Array[] = [];
  
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  // S3 doesn't have a rename operation, so we need to copy and delete
  // For simplicity, we'll just return the old key
  // In production, you might want to implement copy + delete
  return oldKey;
}

export function getPublicUrl(s3Key: string): string {
  const s3BucketName = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
  const s3Region = process.env.AWS_REGION || process.env.S3_REGION || 'eu-west-1';
  const cdnDomain = process.env.CDN_DOMAIN || process.env.CLOUDFRONT_DOMAIN;
  
  if (cdnDomain) {
    return `https://${cdnDomain}/${s3Key}`;
  } else if (s3BucketName) {
    return `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${s3Key}`;
  }
  return s3Key;
}
