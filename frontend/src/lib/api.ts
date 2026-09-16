import { Incident, LogEntry, UploadResponse, ConsolidatedUploadReport } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function getLogs(): Promise<LogEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/logs`);

  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

export async function analyzeLog(logIdOrLog: string | LogEntry): Promise<Incident> {
  const payload = typeof logIdOrLog === 'string' ? { logId: logIdOrLog } : { log: logIdOrLog };
  
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to analyze log' }));
    throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function getIncidents(): Promise<Incident[]> {
  const response = await fetch(`${API_BASE_URL}/api/incidents`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch incidents: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

export async function getIncident(id: string): Promise<Incident> {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch incident details: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Uploads a .pdf or .txt log file to the backend
 */
export async function uploadLogFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('logFile', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'File upload failed' }));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Runs full multi-agent batch analysis on an uploaded file
 */
export async function analyzeUpload(uploadId: string): Promise<ConsolidatedUploadReport> {
  const response = await fetch(`${API_BASE_URL}/api/analyze-upload/${uploadId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Batch analysis failed' }));
    throw new Error(errorData.error || `Batch analysis failed with status ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Fetches an existing consolidated upload report
 */
export async function getUploadReport(uploadId: string): Promise<ConsolidatedUploadReport> {
  const response = await fetch(`${API_BASE_URL}/api/reports/${uploadId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch report: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Returns download URL for PDF report
 */
export function getReportDownloadUrl(uploadId: string): string {
  return `${API_BASE_URL}/api/reports/${uploadId}/download`;
}
