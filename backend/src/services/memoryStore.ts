import { LogEntry, FullIncidentAnalysis } from '../types';

export interface InMemoryUploadedLogs {
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

export interface InMemoryUploadReport {
  uploadId: string;
  filename: string;
  summary: {
    totalLogs: number;
    severityCounts: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    riskScore: number;
  };
  mitreTechniques: any[];
  cves: any[];
  executiveReport: any;
  incidents: FullIncidentAnalysis[];
  createdAt: Date;
  updatedAt: Date;
}

class MemoryStore {
  private uploadedLogs = new Map<string, InMemoryUploadedLogs>();
  private uploadReports = new Map<string, InMemoryUploadReport>();
  private incidents: FullIncidentAnalysis[] = [];

  // Uploaded Logs
  setUploadedLogs(record: InMemoryUploadedLogs) {
    this.uploadedLogs.set(record.uploadId, record);
  }

  getUploadedLogs(uploadId: string): InMemoryUploadedLogs | undefined {
    return this.uploadedLogs.get(uploadId);
  }

  // Upload Reports
  setUploadReport(report: InMemoryUploadReport) {
    this.uploadReports.set(report.uploadId, report);
  }

  getUploadReport(uploadId: string): InMemoryUploadReport | undefined {
    return this.uploadReports.get(uploadId);
  }

  // Incidents
  addIncident(incident: FullIncidentAnalysis) {
    this.incidents.unshift(incident);
  }

  getIncidents(): FullIncidentAnalysis[] {
    return this.incidents;
  }

  getIncidentById(id: string): FullIncidentAnalysis | undefined {
    return this.incidents.find((i) => i.logId === id || (i as any)._id === id);
  }
}

export const memoryStore = new MemoryStore();
