import {
  LogEntry,
  FullIncidentAnalysis,
  MalwareAnalysisResult,
  ThreatIntelResult,
  VulnerabilityAnalysisResult,
} from './types';
import { analyzeLog } from './agents/socAnalyst';
import { analyzeMalwareIndicators } from './agents/malwareAnalyst';
import { checkThreatIntel } from './agents/threatIntel';
import { mapToMitreAndCve } from './agents/vulnerabilityAnalyst';
import { generateReport } from './agents/reportGenerator';

export async function runFullAnalysis(log: LogEntry): Promise<FullIncidentAnalysis> {
  console.log(`\n========================================`);
  console.log(`[ORCHESTRATOR] Starting analysis for Log ID: ${log.id} (${log.eventType})`);
  console.log(`========================================`);

  // Step 1: SOC Analyst Triage
  console.log(`[1/3] [SOC Analyst] Analyzing log severity and suspicion...`);
  const socAnalysis = await analyzeLog(log);
  console.log(`[SOC Analyst Result] Suspicious: ${socAnalysis.isSuspicious} | Severity: ${socAnalysis.severity} | Category: ${socAnalysis.suggestedEventCategory}`);

  let malwareAnalysis: MalwareAnalysisResult | undefined = undefined;
  let threatIntel: ThreatIntelResult | undefined = undefined;
  let vulnerabilityAnalysis: VulnerabilityAnalysisResult | undefined = undefined;

  // Step 2: Parallel Deep Analysis if suspicious
  if (socAnalysis.isSuspicious) {
    console.log(`[2/3] [Deep Analysis] Log flagged as suspicious. Dispatching 3 specialized agents in parallel...`);

    const [threatIntelRes, malwareRes, vulnRes] = await Promise.all([
      (async () => {
        console.log(`  -> [Threat Intel Agent] Querying reputation for IP: ${log.sourceIp}...`);
        const res = await checkThreatIntel(log.sourceIp);
        console.log(`  <- [Threat Intel Result] Reputation: ${res.ipReputation}`);
        return res;
      })(),
      (async () => {
        console.log(`  -> [Malware Analyst Agent] Checking payload & binary indicators...`);
        const res = await analyzeMalwareIndicators(log);
        console.log(`  <- [Malware Analyst Result] Likely Malware: ${res.isLikelyMalware}`);
        return res;
      })(),
      (async () => {
        console.log(`  -> [Vulnerability Analyst Agent] Mapping to MITRE ATT&CK and CVE database...`);
        const res = await mapToMitreAndCve(log);
        console.log(`  <- [Vulnerability Analyst Result] Techniques: ${res.mitreTechniques.map(t => t.techniqueId).join(', ') || 'None'} | CVEs: ${res.relatedCves.map(c => c.cveId).join(', ') || 'None'}`);
        return res;
      })(),
    ]);

    threatIntel = threatIntelRes;
    malwareAnalysis = malwareRes;
    vulnerabilityAnalysis = vulnRes;
  } else {
    console.log(`[2/3] [Deep Analysis] Log classified as benign. Skipping deep threat analysis.`);
    threatIntel = {
      ipReputation: 'clean' as const,
      knownThreatActor: null,
      notes: 'Benign traffic - internal/standard communication.',
      isSimulated: true,
    };
    malwareAnalysis = {
      isLikelyMalware: false,
      malwareFamily: null,
      behaviorSummary: 'Benign operational activity.',
      confidence: 1.0,
    };
    vulnerabilityAnalysis = {
      mitreTechniques: [],
      relatedCves: [],
      justification: 'No malicious activity or exploit indicators identified.',
    };
  }

  // Step 3: Synthesis and Final Report Generation
  console.log(`[3/3] [Report Generator] Synthesizing incident data and creating final report...`);
  const incidentPayload = {
    log,
    socAnalysis,
    malwareAnalysis,
    threatIntel,
    vulnerabilityAnalysis,
  };

  const report = await generateReport(incidentPayload);
  console.log(`[Report Generator Result] Risk Score: ${report.riskScore}/10 | Recs: ${report.recommendations.length}`);
  console.log(`========================================\n`);

  return {
    logId: log.id,
    timestamp: log.timestamp,
    log,
    socAnalysis,
    malwareAnalysis,
    threatIntel,
    vulnerabilityAnalysis,
    report,
    createdAt: new Date().toISOString(),
  };
}
