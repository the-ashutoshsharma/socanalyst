import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { cleanRawText, parseCleanedText } from '../services/logCleaner';
import { UploadedLogs } from '../models/UploadedLogs';
import { memoryStore } from '../services/memoryStore';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

const router = Router();

// Configure multer for in-memory upload, max 5MB, filter for .pdf and .txt
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    const isTxt =
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.toLowerCase().endsWith('.txt') ||
      file.originalname.toLowerCase().endsWith('.log');

    if (isPdf || isTxt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only .pdf and .txt files are supported.'));
    }
  },
});

// POST /api/upload - Handles single file upload (.pdf / .txt), extracts, cleans, parses, and saves
router.post(
  '/upload',
  upload.single('logFile'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded. Please provide a "logFile".' });
        return;
      }

      const file = req.file;
      const originalName = file.originalname;
      const isPdf =
        file.mimetype === 'application/pdf' ||
        originalName.toLowerCase().endsWith('.pdf');
      const fileType = isPdf ? 'pdf' : 'txt';

      let rawExtractedText = '';

      if (isPdf) {
        try {
          const pdfData = await pdfParse(file.buffer);
          rawExtractedText = pdfData.text || '';
        } catch (pdfErr: any) {
          console.error('PDF parsing error:', pdfErr);
          res.status(400).json({
            success: false,
            error: 'Failed to extract text from PDF. The file may be corrupt or encrypted.',
          });
          return;
        }
      } else {
        rawExtractedText = file.buffer.toString('utf-8');
      }

      if (!rawExtractedText || rawExtractedText.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'The uploaded file is empty or contains no readable text.',
        });
        return;
      }

      // Clean & parse raw text
      const cleaned = cleanRawText(rawExtractedText);
      const parseResult = parseCleanedText(cleaned);

      if (parseResult.logs.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Could not extract valid security logs from this file. Please check file format.',
          summary: parseResult.summary,
        });
        return;
      }

      const uploadId = `upload-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

      const uploadedData = {
        uploadId,
        filename: originalName,
        fileType,
        fileSize: file.size,
        summary: parseResult.summary,
        logs: parseResult.logs,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in memory for instant reliability
      memoryStore.setUploadedLogs(uploadedData);

      // Persist to MongoDB if connected
      if (mongoose.connection.readyState === 1) {
        try {
          const uploadedDoc = new UploadedLogs(uploadedData);
          await uploadedDoc.save();
          console.log(`[MongoDB] Uploaded logs saved: ${uploadId}`);
        } catch (dbError: any) {
          console.warn(`[MongoDB] Warning: Failed to persist upload ${uploadId} to MongoDB:`, dbError.message);
        }
      }

      res.json({
        success: true,
        uploadId,
        filename: originalName,
        fileType,
        fileSize: file.size,
        summary: parseResult.summary,
        logs: parseResult.logs,
      });
    } catch (error: any) {
      console.error('File upload handling failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error while processing upload.',
      });
    }
  }
);

// GET /api/uploaded-logs/:uploadId - Retrieves uploaded logs for a specific upload
router.get('/uploaded-logs/:uploadId', async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadId = req.params.uploadId as string;

    // Check memory store first
    let uploadedRecord: any = memoryStore.getUploadedLogs(uploadId);

    // Fall back to MongoDB if connected and not in memory
    if (!uploadedRecord && mongoose.connection.readyState === 1) {
      try {
        uploadedRecord = await UploadedLogs.findOne({ uploadId });
      } catch (dbError) {
        console.warn(`[MongoDB] Warning: Failed to query MongoDB for upload ${uploadId}`);
      }
    }

    if (!uploadedRecord) {
      res.status(404).json({ success: false, error: 'Uploaded logs not found.' });
      return;
    }

    res.json({
      success: true,
      data: uploadedRecord,
    });
  } catch (error: any) {
    console.error('Error fetching uploaded logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch uploaded logs.',
    });
  }
});

export default router;
