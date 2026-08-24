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
