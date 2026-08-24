import { groq, GROQ_MODEL } from '../config/groq';
import { ThreatIntelResult } from '../types';

export async function checkThreatIntel(ip: string): Promise<ThreatIntelResult> {
  // Check for private / internal RFC 1918 addresses
  const isPrivate =
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    (ip.startsWith('172.') &&
      parseInt(ip.split('.')[1], 10) >= 16 &&
      parseInt(ip.split('.')[1], 10) <= 31) ||
    ip === '127.0.0.1';

  const prompt = `
You are a Cyber Threat Intelligence (CTI) Analyst.
Analyze the following IP address for threat reputation:
IP: ${ip}
Is Internal/Private IP: ${isPrivate}

Provide a simulated threat intelligence assessment.
If it is a private/internal IP (e.g. 10.x, 192.168.x), classify reputation as "clean" or "suspicious" if linked to lateral movement, noting it is an internal asset.
If it is a public IP, assess if it resembles known scanner ranges, bulletproof hosters, Tor exit nodes, or malicious C2 infrastructure.

Respond ONLY with a valid JSON object matching this schema:
{
  "ipReputation": "clean" | "suspicious" | "malicious",
  "knownThreatActor": "string or null",
  "notes": "string explaining the assessment, including geolocation or threat context (clearly noted as simulated intelligence)"
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a Threat Intelligence Analyst. Provide simulated threat intel reports in valid JSON without markdown.',
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
      ipReputation: ['clean', 'suspicious', 'malicious'].includes(parsed.ipReputation)
        ? parsed.ipReputation
        : isPrivate
        ? 'clean'
        : 'suspicious',
      knownThreatActor: parsed.knownThreatActor || null,
      notes: parsed.notes
        ? `${parsed.notes} [Simulated Intel]`
        : `Simulated threat intelligence evaluation for IP ${ip}.`,
      isSimulated: true,
    };
  } catch (error) {
    console.error('Error in threatIntel agent:', error);
    return {
      ipReputation: isPrivate ? 'clean' : 'suspicious',
      knownThreatActor: null,
      notes: `Simulated fallback threat intel assessment for ${ip}.`,
      isSimulated: true,
    };
  }
}
