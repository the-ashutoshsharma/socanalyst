export interface LogEntry {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rawLog: string;
  hostname: string;
}

export interface SocAnalysisResult {
  isSuspicious: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  suggestedEventCategory: string;
}

export interface MalwareAnalysisResult {
  isLikelyMalware: boolean;
  malwareFamily: string | null;
  behaviorSummary: string;
  confidence: number;
}

export interface ThreatIntelResult {
  ipReputation: 'clean' | 'suspicious' | 'malicious';
  knownThreatActor: string | null;
  notes: string;
  isSimulated: boolean;
}

export interface MitreTechniqueMatch {
  techniqueId: string;
  name: string;
  tactic: string;
}

export interface CveMatch {
  cveId: string;
  description: string;
  cvssScore: number;
  affectedProduct?: string;
}

export interface VulnerabilityAnalysisResult {
  mitreTechniques: MitreTechniqueMatch[];
  relatedCves: CveMatch[];
  justification: string;
}

export interface IncidentReport {
  executiveSummary: string;
  technicalDetails: string;
  recommendations: string[];
  riskScore: number; // 1-10
}

export interface FullIncidentAnalysis {
  logId: string;
  timestamp: string;
  log: LogEntry;
  socAnalysis: SocAnalysisResult;
  malwareAnalysis?: MalwareAnalysisResult;
  threatIntel?: ThreatIntelResult;
  vulnerabilityAnalysis?: VulnerabilityAnalysisResult;
  report: IncidentReport;
  createdAt?: string | Date;
}
