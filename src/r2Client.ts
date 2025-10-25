import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export interface FileObject {
  key: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
}

export class R2Client {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: R2Config) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucketName = config.bucketName;
  }

  /**
   * List files and folders in a directory
   * Now supports fetching all items for large directories
   */
  async listFiles(prefix: string = ''): Promise<FileObject[]> {
    const files: FileObject[] = [];
    let continuationToken: string | undefined = undefined;
    
    // Fetch all files with pagination (handle folders with 15k+ files)
    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        Delimiter: '/',
        MaxKeys: 1000, // Fetch 1000 items per request
        ContinuationToken: continuationToken,
      });

      const response: ListObjectsV2CommandOutput = await this.s3Client.send(command);

      // Add folders (common prefixes)
      if (response.CommonPrefixes) {
        for (const commonPrefix of response.CommonPrefixes) {
          if (commonPrefix.Prefix) {
            files.push({
              key: commonPrefix.Prefix,
              size: 0,
              lastModified: new Date(),
              isDirectory: true,
            });
          }
        }
      }

      // Add files
      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Key && item.Key !== prefix) {
            files.push({
              key: item.Key,
              size: item.Size || 0,
              lastModified: item.LastModified || new Date(),
              isDirectory: false,
            });
          }
        }
      }

      // Check if there are more results
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return files;
  }

  /**
   * Get file content as buffer
   */
  async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error('No file content received');
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<{ contentType?: string; size: number }> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    return {
      contentType: response.ContentType,
      size: response.ContentLength || 0,
    };
  }

  /**
   * Upload a file
   */
  async uploadFile(key: string, content: Buffer, contentType?: string): Promise<void> {
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: content,
        ContentType: contentType,
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024, // 5MB chunks for multipart upload
    });

    await upload.done();
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileMetadata(key);
      return true;
    } catch (error) {
      return false;
    }
  }
}
