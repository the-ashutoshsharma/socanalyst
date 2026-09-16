import mongoose, { Schema, Document } from 'mongoose';
import { LogEntry } from '../types';

export interface UploadedLogsDocument extends Document {
  uploadId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  summary: {
    totalLines: number;
    parsedCount: number;
    skippedCount: number;
  };
  logs: LogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const UploadedLogsSchema = new Schema<UploadedLogsDocument>(
  {
    uploadId: { type: String, required: true, unique: true, index: true },
    filename: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    summary: {
      totalLines: { type: Number, required: true },
      parsedCount: { type: Number, required: true },
      skippedCount: { type: Number, required: true },
    },
    logs: [
      {
        id: { type: String, required: true },
        timestamp: { type: String, required: true },
        sourceIp: { type: String, required: true },
        destIp: { type: String, required: true },
        eventType: { type: String, required: true },
        severity: { type: String, required: true },
        rawLog: { type: String, required: true },
        hostname: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const UploadedLogs = mongoose.model<UploadedLogsDocument>(
  'UploadedLogs',
  UploadedLogsSchema
);
