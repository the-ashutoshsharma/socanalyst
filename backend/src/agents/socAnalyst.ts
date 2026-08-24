import { groq, GROQ_MODEL } from '../config/groq';
import { LogEntry, SocAnalysisResult } from '../types';

export async function analyzeLog(log: LogEntry): Promise<SocAnalysisResult> {
  const prompt = `
You are a Tier 1/2 SOC Analyst. Analyze the following security log entry:
- ID: ${log.id}
- Timestamp: ${log.timestamp}
- Hostname: ${log.hostname}
- Source IP: ${log.sourceIp}
- Destination IP: ${log.destIp}
- Event Type: ${log.eventType}
- Initial Severity: ${log.severity}
- Raw Log: ${log.rawLog}

Decide if this log entry is suspicious/malicious or benign.
Respond ONLY with a valid JSON object matching this schema:
{
  "isSuspicious": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "reasoning": "1-2 sentences explaining why this is suspicious or benign",
  "suggestedEventCategory": "string category such as Web Attack, Authentication, Network Reconnaissance, Benign Traffic, Malware, etc."
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert SOC Analyst. You always return strictly valid JSON matching the requested structure without any markdown formatting or commentary.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      isSuspicious: typeof parsed.isSuspicious === 'boolean' ? parsed.isSuspicious : log.severity !== 'low',
      severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity)
        ? parsed.severity
        : log.severity,
      reasoning: parsed.reasoning || 'Log analyzed by SOC Analyst agent.',
      suggestedEventCategory: parsed.suggestedEventCategory || log.eventType,
    };
  } catch (error) {
    console.error('Error in socAnalyst agent:', error);
    return {
      isSuspicious: log.severity === 'high' || log.severity === 'critical',
      severity: log.severity,
      reasoning: 'Fallback analysis: Triaged based on initial log parameters due to LLM parsing issue.',
      suggestedEventCategory: log.eventType,
    };
  }
}
