
import { uploadFile, getDownloadUrl } from './s3';

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  cloudStoragePath: string;
}

/**
 * Upload a file from the chat interface to S3
 * @param file - The file to upload
 * @param conversationId - The conversation ID for organizing files
 * @returns UploadedFile metadata
 */
export async function uploadChatFile(file: File, conversationId: string): Promise<UploadedFile> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate S3 key with conversation organization
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `chat/${conversationId}/${timestamp}-${sanitizedName}`;

  // Upload to S3
  const cloudStoragePath = await uploadFile(buffer, fileName, file.type);

  // Generate signed URL for immediate access
  const url = await getDownloadUrl(cloudStoragePath, 86400); // 24 hours

  return {
    name: file.name,
    url,
    type: file.type,
    size: file.size,
    cloudStoragePath,
  };
}

/**
 * Upload multiple files at once
 */
export async function uploadChatFiles(files: File[], conversationId: string): Promise<UploadedFile[]> {
  const uploadPromises = files.map(file => uploadChatFile(file, conversationId));
  return Promise.all(uploadPromises);
}

/**
 * Get a fresh signed URL for a chat file
 */
export async function refreshChatFileUrl(cloudStoragePath: string): Promise<string> {
  return getDownloadUrl(cloudStoragePath, 86400); // 24 hours
}

/**
 * Check if a file type is allowed
 */
export function isAllowedFileType(type: string): boolean {
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text files
    'text/plain',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    // Code files
    'application/x-python',
    'application/x-typescript',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
  ];

  return allowedTypes.includes(type) || type.startsWith('text/') || type.startsWith('application/');
}

/**
 * Check if file size is within limits (50MB)
 */
export function isWithinSizeLimit(size: number): boolean {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  return size <= MAX_SIZE;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isAllowedFileType(file.type)) {
    return {
      valid: false,
      error: 'Dit bestandstype wordt niet ondersteund',
    };
  }

  if (!isWithinSizeLimit(file.size)) {
    return {
      valid: false,
      error: 'Bestand is te groot (max 50MB)',
    };
  }

  return { valid: true };
}
