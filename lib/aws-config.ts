
import { S3Client } from '@aws-sdk/client-s3';

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME!,
    folderPrefix: process.env.AWS_FOLDER_PREFIX || '',
  };
}

export function createS3Client() {
  const config: any = {
    region: process.env.AWS_REGION || 'us-west-2',
  };

  // Use default credential provider chain
  // This will automatically use IAM roles, environment variables, etc.
  return new S3Client(config);
}
