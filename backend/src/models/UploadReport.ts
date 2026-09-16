import mongoose, { Schema, Document } from 'mongoose';
import { FullIncidentAnalysis, MitreTechniqueMatch, CveMatch, IncidentReport } from '../types';

export interface ConsolidatedSummary {
  totalLogs: number;
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  riskScore: number;
}

export interface UploadReportDocument extends Document {
  uploadId: string;
  filename: string;
  summary: ConsolidatedSummary;
  mitreTechniques: MitreTechniqueMatch[];
  cves: CveMatch[];
  executiveReport: IncidentReport;
  incidents: FullIncidentAnalysis[];
  createdAt: Date;
  updatedAt: Date;
}

const UploadReportSchema = new Schema<UploadReportDocument>(
  {
    uploadId: { type: String, required: true, unique: true, index: true },
    filename: { type: String, required: true },
    summary: {
      totalLogs: { type: Number, required: true },
      severityCounts: {
        critical: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        low: { type: Number, default: 0 },
      },
      riskScore: { type: Number, required: true },
    },
    mitreTechniques: [
      {
        techniqueId: { type: String },
        name: { type: String },
        tactic: { type: String },
      },
    ],
    cves: [
      {
        cveId: { type: String },
        description: { type: String },
        cvssScore: { type: Number },
        affectedProduct: { type: String },
      },
    ],
    executiveReport: {
      executiveSummary: { type: String, required: true },
      technicalDetails: { type: String, required: true },
      recommendations: [{ type: String }],
      riskScore: { type: Number, required: true },
    },
    incidents: [Schema.Types.Mixed],
  },
  {
    timestamps: true,
  }
);

export const UploadReport = mongoose.model<UploadReportDocument>(
  'UploadReport',
  UploadReportSchema
);
