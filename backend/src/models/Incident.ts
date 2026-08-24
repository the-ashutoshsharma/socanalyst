import mongoose, { Schema, Document } from 'mongoose';
import { FullIncidentAnalysis } from '../types';

export interface IncidentDocument extends Omit<FullIncidentAnalysis, 'createdAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IncidentDocument>(
  {
    logId: { type: String, required: true, index: true },
    timestamp: { type: String, required: true },
    log: {
      id: { type: String, required: true },
      timestamp: { type: String, required: true },
      sourceIp: { type: String, required: true },
      destIp: { type: String, required: true },
      eventType: { type: String, required: true },
      severity: { type: String, required: true },
      rawLog: { type: String, required: true },
      hostname: { type: String, required: true },
    },
    socAnalysis: {
      isSuspicious: { type: Boolean, required: true },
      severity: { type: String, required: true },
      reasoning: { type: String, required: true },
      suggestedEventCategory: { type: String, required: true },
    },
    malwareAnalysis: {
      isLikelyMalware: { type: Boolean },
      malwareFamily: { type: String, default: null },
      behaviorSummary: { type: String },
      confidence: { type: Number },
    },
    threatIntel: {
      ipReputation: { type: String, enum: ['clean', 'suspicious', 'malicious'] },
      knownThreatActor: { type: String, default: null },
      notes: { type: String },
      isSimulated: { type: Boolean, default: true },
    },
    vulnerabilityAnalysis: {
      mitreTechniques: [
        {
          techniqueId: { type: String },
          name: { type: String },
          tactic: { type: String },
        },
      ],
      relatedCves: [
        {
          cveId: { type: String },
          description: { type: String },
          cvssScore: { type: Number },
          affectedProduct: { type: String },
        },
      ],
      justification: { type: String },
    },
    report: {
      executiveSummary: { type: String, required: true },
      technicalDetails: { type: String, required: true },
      recommendations: [{ type: String }],
      riskScore: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

export const Incident = mongoose.model<IncidentDocument>('Incident', IncidentSchema);
