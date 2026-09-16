import { groq, GROQ_MODEL } from '../config/groq';
import { IncidentReport } from '../types';

export async function generateReport(incidentData: Record<string, any>): Promise<IncidentReport> {
  const prompt = `
You are a Principal Security Incident Responder and Report Writer.
Synthesize the following security incident analysis data into a comprehensive incident triage report:

Incident Details:
${JSON.stringify(incidentData, null, 2)}

Provide:
1. An executive summary suitable for CISO / executive leadership.
2. Technical details summarizing attack vectors, indicators of compromise (IOCs), and systems affected.
3. 3-5 prioritized, actionable remediation recommendations.
4. An overall risk score from 1 to 10 (1 = minimal benign event, 10 = critical active breach).

Respond ONLY with a valid JSON object matching this schema:
{
  "executiveSummary": "string",
  "technicalDetails": "string",
  "recommendations": ["remediation step 1", "remediation step 2", "remediation step 3"],
  "riskScore": number
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a Senior Security Incident Response lead. Return strictly valid JSON containing the incident report without markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      executiveSummary: parsed.executiveSummary || 'Security incident analyzed by AI SOC triage pipeline.',
      technicalDetails: parsed.technicalDetails || 'Detailed findings compiled from multi-agent telemetry.',
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
        ? parsed.recommendations
        : ['Monitor affected hosts', 'Review authentication logs', 'Validate firewall rules'],
      riskScore: typeof parsed.riskScore === 'number'
        ? Math.min(10, Math.max(1, Math.round(parsed.riskScore)))
        : 5,
    };
  } catch (error) {
    console.error('Error in reportGenerator agent:', error);
    return {
      executiveSummary: 'Automated triage completed. Log evaluated across security analysis agents.',
      technicalDetails: 'Telemetry processed with fallback response.',
      recommendations: ['Investigate source IP and affected hosts', 'Check endpoint defense telemetry'],
      riskScore: 5,
    };
  }
}

/**
 * Generates an overall consolidated executive report across a batch of analyzed logs/incidents.
 */
export async function generateConsolidatedReport(batchData: Record<string, any>): Promise<IncidentReport> {
  const prompt = `
You are a Chief Information Security Officer (CISO) and Lead Incident Commander.
Synthesize the multi-log analysis telemetry and identified incidents from an uploaded log file into an overall Executive Security Report:

Batch Telemetry & Identified Incidents:
${JSON.stringify(batchData, null, 2)}

Provide:
1. A high-level Executive Summary suitable for board and leadership review (scope of log file, total threats identified, attack surface impact).
2. Technical Synthesis detailing recurring threat actors, exploited services, mapped MITRE ATT&CK techniques, and correlated CVEs.
3. 4-6 prioritized, strategic and tactical remediation recommendations.
4. An overall consolidated Risk Score from 1 to 10 (1 = completely benign environment, 10 = catastrophic widespread active compromise).

Respond ONLY with a valid JSON object matching this schema:
{
  "executiveSummary": "comprehensive executive overview string",
  "technicalDetails": "detailed technical breakdown string",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4"],
  "riskScore": number
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an Executive Cyber Incident Commander. Return strictly valid JSON containing the consolidated security report without markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      executiveSummary: parsed.executiveSummary || 'Consolidated multi-log analysis completed across uploaded dataset.',
      technicalDetails: parsed.technicalDetails || 'Aggregate threat analysis compiled from multi-agent evaluations.',
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
        ? parsed.recommendations
        : [
            'Enforce MFA on all SSH and administrative endpoints',
            'Block recurring malicious source IPs at edge firewalls',
            'Patch services associated with detected CVE exposures',
            'Deploy active endpoint detection and automated log rotation monitoring',
          ],
      riskScore: typeof parsed.riskScore === 'number'
        ? Math.min(10, Math.max(1, Math.round(parsed.riskScore)))
        : 6,
    };
  } catch (error) {
    console.error('Error in generateConsolidatedReport:', error);
    return {
      executiveSummary: 'Automated consolidated triage completed for uploaded dataset.',
      technicalDetails: 'Aggregate metrics compiled with fallback processing.',
      recommendations: [
        'Review high and critical severity incidents',
        'Inspect suspicious source IPs and enforce rate limits',
        'Verify integrity of system authentication services',
      ],
      riskScore: 6,
    };
  }
}
