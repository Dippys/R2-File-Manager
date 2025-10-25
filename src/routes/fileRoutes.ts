import express, { Request, Response } from 'express';
import { R2Client } from '../r2Client';
import { config } from '../config';

const router = express.Router();
const r2Client = new R2Client(config.r2);

/**
 * List files and folders
 * GET /api/files?prefix=path/to/folder
 */
router.get('/files', async (req: Request, res: Response) => {
  try {
    const prefix = (req.query.prefix as string) || '';
    const files = await r2Client.listFiles(prefix);
    
    res.json({
      success: true,
      prefix,
      files,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get file metadata
 * GET /api/files/metadata?key=path/to/file.jpg
 */
router.get('/files/metadata', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required',
      });
    }

    const metadata = await r2Client.getFileMetadata(key);
    
    res.json({
      success: true,
      key,
      metadata,
    });
  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Download/Preview file
 * GET /api/files/download?key=path/to/file.jpg
 */
router.get('/files/download', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required',
      });
    }

    const [fileBuffer, metadata] = await Promise.all([
      r2Client.getFile(key),
      r2Client.getFileMetadata(key),
    ]);

    // Set appropriate content type
    if (metadata.contentType) {
      res.setHeader('Content-Type', metadata.contentType);
    } else {
      // Guess content type from extension
      const ext = key.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'json': 'application/json',
        'xml': 'application/xml',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'm4a': 'audio/mp4',
      };
      res.setHeader('Content-Type', contentTypes[ext || ''] || 'application/octet-stream');
    }

    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Upload file
 * POST /api/files/upload
 */
router.post('/files/upload', async (req: Request, res: Response) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
    const path = (req.body.path as string) || '';
    const key = path ? `${path}/${file.name}` : file.name;

    await r2Client.uploadFile(key, file.data, file.mimetype);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      key,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Replace file
 * PUT /api/files/replace
 */
router.put('/files/replace', async (req: Request, res: Response) => {
  try {
    const key = req.body.key as string;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required',
      });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Check if file exists
    const exists = await r2Client.fileExists(key);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;

    // Replace by uploading with same key (overwrites existing file)
    await r2Client.uploadFile(key, file.data, file.mimetype);

    res.json({
      success: true,
      message: 'File replaced successfully',
      key,
    });
  } catch (error) {
    console.error('Error replacing file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to replace file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete file
 * DELETE /api/files?key=path/to/file.jpg
 */
router.delete('/files', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required',
      });
    }

    await r2Client.deleteFile(key);

    res.json({
      success: true,
      message: 'File deleted successfully',
      key,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
