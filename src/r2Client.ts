import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

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

export interface FileCache {
  [prefix: string]: {
    files: FileObject[];
    lastUpdated: number;
    isFull: boolean; // Whether we've fetched all files for this prefix
  };
}

export class R2Client {
  private s3Client: S3Client;
  private bucketName: string;
  private cache: FileCache = {};
  private cacheTTL: number = 24 * 60 * 60 * 1000; // 24 hours cache
  private isPreloading: boolean = false;
  private preloadPromise: Promise<void> | null = null;
  private cacheFilePath: string;

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
    this.cacheFilePath = path.join(process.cwd(), 'cache', 'r2-cache.json');
    
    // Load cache from file if available
    this.loadCacheFromFile();
  }

  /**
   * Preload ALL directories recursively into cache on startup
   */
  async preloadRootDirectory(): Promise<void> {
    if (this.isPreloading || this.preloadPromise) {
      return this.preloadPromise!;
    }

    this.isPreloading = true;
    console.log('🔄 Starting full recursive preload of all directories...');
    const startTime = Date.now();

    this.preloadPromise = (async () => {
      try {
        await this.preloadRecursive('');
        
        const totalFolders = Object.keys(this.cache).length;
        const totalFiles = Object.values(this.cache).reduce((sum, c) => sum + c.files.length, 0);
        const duration = Date.now() - startTime;
        
        console.log(`✅ Full preload complete in ${duration}ms`);
        console.log(`   📊 Loaded ${totalFolders} folders with ${totalFiles} total items`);
        
        // Save cache to file after successful preload
        await this.saveCacheToFile();
      } catch (error) {
        console.error('❌ Error during full preload:', error);
      } finally {
        this.isPreloading = false;
      }
    })();

    return this.preloadPromise;
  }

  /**
   * Recursively preload a folder and all its subfolders
   */
  private async preloadRecursive(prefix: string, depth: number = 0): Promise<void> {
    const indent = '  '.repeat(depth);
    console.log(`${indent}🔍 Loading: "${prefix || 'root'}"`);
    
    // Load this directory
    const files = await this.listFilesInternal(prefix, true);
    
    // Find all subfolders
    const folders = files.filter(f => f.isDirectory);
    
    if (folders.length > 0) {
      console.log(`${indent}� Found ${folders.length} subfolders, loading recursively...`);
      
      // Process folders in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < folders.length; i += batchSize) {
        const batch = folders.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(folder => 
            this.preloadRecursive(folder.key, depth + 1).catch(err => {
              console.error(`${indent}❌ Failed to preload ${folder.key}:`, err.message);
            })
          )
        );
      }
    }
  }

  /**
   * Preload folders in batches to avoid overwhelming the API
   */
  private async preloadFoldersInBatches(folders: FileObject[], batchSize: number): Promise<void> {
    for (let i = 0; i < folders.length; i += batchSize) {
      const batch = folders.slice(i, i + batchSize);
      await Promise.all(
        batch.map(folder => 
          this.listFilesInternal(folder.key, true).catch(err => {
            console.error(`Failed to preload folder ${folder.key}:`, err.message);
          })
        )
      );
      
      if (i + batchSize < folders.length) {
        console.log(`  📦 Preloaded ${i + batchSize}/${folders.length} folders...`);
      }
    }
  }

  /**
   * Preload subfolders of a given prefix in the background (lazy loading)
   */
  async preloadSubfolders(prefix: string): Promise<void> {
    // Don't block - do this in background
    setImmediate(async () => {
      try {
        const files = await this.listFilesInternal(prefix, false); // Get from cache or fetch
        const subfolders = files.filter(f => f.isDirectory);
        
        if (subfolders.length > 0) {
          console.log(`🔄 Background preloading ${subfolders.length} subfolders of "${prefix}"`);
          await this.preloadFoldersInBatches(subfolders, 3);
          console.log(`✅ Finished background preload of "${prefix}" subfolders`);
        }
      } catch (error) {
        console.error(`Failed to preload subfolders of ${prefix}:`, error);
      }
    });
  }

  /**
   * Clear cache for a specific prefix or all cache
   */
  clearCache(prefix?: string): void {
    if (prefix) {
      delete this.cache[prefix];
    } else {
      this.cache = {};
      // Delete cache file when clearing all cache
      try {
        if (fs.existsSync(this.cacheFilePath)) {
          fs.unlinkSync(this.cacheFilePath);
          console.log('🗑️  Cache file deleted');
        }
      } catch (error) {
        console.error('❌ Failed to delete cache file:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { cachedFolders: number; totalCachedItems: number; oldestCacheAge: number } {
    const folders = Object.keys(this.cache);
    const totalItems = folders.reduce((sum, key) => sum + this.cache[key].files.length, 0);
    
    let oldestAge = 0;
    const now = Date.now();
    folders.forEach(key => {
      const age = now - this.cache[key].lastUpdated;
      if (age > oldestAge) oldestAge = age;
    });
    
    return {
      cachedFolders: folders.length,
      totalCachedItems: totalItems,
      oldestCacheAge: Math.round(oldestAge / 1000), // seconds
    };
  }

  /**
   * Check if cache is valid for a prefix
   */
  private isCacheValid(prefix: string): boolean {
    const cached = this.cache[prefix];
    if (!cached) return false;
    
    const age = Date.now() - cached.lastUpdated;
    return age < this.cacheTTL;
  }

  /**
   * List files and folders in a directory (with caching)
   */
  async listFiles(prefix: string = '', forceRefresh: boolean = false): Promise<FileObject[]> {
    // If force refresh, skip cache
    if (forceRefresh) {
      console.log(`🔄 Force refreshing cache for prefix: "${prefix}"`);
      return this.listFilesInternal(prefix, true);
    }
    
    // Check cache first
    if (this.isCacheValid(prefix)) {
      console.log(`📦 Cache hit for prefix: "${prefix}"`);
      return this.cache[prefix].files;
    }

    // If not in cache, fetch from S3
    return this.listFilesInternal(prefix, true);
  }

  /**
   * Internal method to list files from S3 (with optional caching)
   */
  private async listFilesInternal(prefix: string = '', useCache: boolean = true): Promise<FileObject[]> {
    console.log(`🔍 Fetching files for prefix: "${prefix}"`);
    const files: FileObject[] = [];
    let continuationToken: string | undefined = undefined;
    let itemCount = 0;
    
    // Fetch all files with pagination (handle folders with 40k+ files)
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
            itemCount++;
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
            itemCount++;
          }
        }
      }

      // Check if there are more results
      continuationToken = response.NextContinuationToken;
      
      // Log progress for large folders
      if (itemCount > 0 && itemCount % 5000 === 0) {
        console.log(`  📊 Loaded ${itemCount} items so far...`);
      }
    } while (continuationToken);

    console.log(`✅ Loaded ${itemCount} items for prefix: "${prefix}"`);

    // Store in cache if requested
    if (useCache) {
      this.cache[prefix] = {
        files,
        lastUpdated: Date.now(),
        isFull: true,
      };
    }

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

  /**
   * Save cache to JSON file
   */
  private async saveCacheToFile(): Promise<void> {
    try {
      const cacheDir = path.dirname(this.cacheFilePath);
      
      // Ensure cache directory exists
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Write cache to file
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.cache, null, 2), 'utf-8');
      
      const totalFolders = Object.keys(this.cache).length;
      const totalFiles = Object.values(this.cache).reduce((sum, c) => sum + c.files.length, 0);
      console.log(`💾 Cache saved to ${this.cacheFilePath} (${totalFolders} folders, ${totalFiles} files)`);
    } catch (error) {
      console.error('❌ Failed to save cache to file:', error);
    }
  }

  /**
   * Load cache from JSON file if it exists and is not expired
   */
  private loadCacheFromFile(): void {
    try {
      if (!fs.existsSync(this.cacheFilePath)) {
        console.log('📂 No cache file found, will preload from R2');
        return;
      }

      const cacheData = fs.readFileSync(this.cacheFilePath, 'utf-8');
      const loadedCache: FileCache = JSON.parse(cacheData);

      // Validate that cache is not expired
      const now = Date.now();
      let validEntries = 0;
      let expiredEntries = 0;

      for (const [prefix, entry] of Object.entries(loadedCache)) {
        if (now - entry.lastUpdated < this.cacheTTL) {
          this.cache[prefix] = entry;
          validEntries++;
        } else {
          expiredEntries++;
        }
      }

      if (validEntries > 0) {
        const totalFiles = Object.values(this.cache).reduce((sum, c) => sum + c.files.length, 0);
        console.log(`✅ Loaded cache from file: ${validEntries} folders, ${totalFiles} files`);
        if (expiredEntries > 0) {
          console.log(`   ⚠️  Skipped ${expiredEntries} expired entries`);
        }
      } else {
        console.log('⚠️  All cache entries expired, will preload from R2');
      }
    } catch (error) {
      console.error('❌ Failed to load cache from file:', error);
      console.log('   Will preload from R2 instead');
    }
  }
}
