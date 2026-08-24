import { Incident, LogEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
