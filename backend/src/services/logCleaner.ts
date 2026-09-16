import { LogEntry } from '../types';

export interface CleaningSummary {
  totalLines: number;
  parsedCount: number;
  skippedCount: number;
}

export interface ParseResult {
  logs: LogEntry[];
  summary: CleaningSummary;
}

const monthMap: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/**
 * Removes non-printable characters, normalizes line breaks and whitespace,
 * and trims lines while filtering out empty lines.
 */
export function cleanRawText(text: string): string {
  if (!text) return '';

  return text
    // Normalize newlines
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove non-printable/control characters except \n and \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Split, trim, remove empty lines
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Extracts IPv4 address or remote host from text line
 */
function extractSourceIp(line: string): string {
  // 1. Check explicit rhost parameter (syslog standard)
  const rhostMatch = line.match(/rhost=([^\s]+)/i);
  if (rhostMatch && rhostMatch[1]) return rhostMatch[1];

  // 2. Check standard IPv4 address pattern
  const ipMatch = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  if (ipMatch && ipMatch[0]) return ipMatch[0];

  // 3. Check connection from <host/ip> or auth failed from <host/ip>
  const connMatch = line.match(/connection\s+from\s+([^\s,:]+)/i);
  if (connMatch && connMatch[1]) return connMatch[1];

  const authFromMatch = line.match(/Authentication\s+failed\s+from\s+([^\s,:]+)/i);
  if (authFromMatch && authFromMatch[1]) return authFromMatch[1];

  return 'internal';
}

/**
 * Parses timestamp from various common log formats (Syslog, ISO 8601, Apache/Nginx, etc.)
 */
function extractTimestamp(line: string): string {
  // 1. ISO 8601 format: 2026-08-24T18:15:22... or 2026-08-24 18:15:22
  const isoMatch = line.match(/\b(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\b/);
  if (isoMatch && isoMatch[1]) {
    try {
      const parsed = new Date(isoMatch[1].replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    } catch {}
  }

  // 2. Syslog format: "Jun 14 15:16:01"
  const syslogMatch = line.match(/^([A-Z][a-z]{2})\s+(\d+)\s+(\d{2}:\d{2}:\d{2})/);
  if (syslogMatch) {
    const [, monthStr, dayStr, timeStr] = syslogMatch;
    const month = monthMap[monthStr] || '01';
    const day = dayStr.padStart(2, '0');
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${month}-${day}T${timeStr}.000Z`;
  }

  // 3. Apache/Nginx format: "[24/Aug/2026:18:15:22 +0000]"
  const apacheMatch = line.match(/\[(\d{2})\/([A-Z][a-z]{2})\/(\d{4}):(\d{2}:\d{2}:\d{2})/);
  if (apacheMatch) {
    const [, day, monthStr, year, time] = apacheMatch;
    const month = monthMap[monthStr] || '01';
    return `${year}-${month}-${day}T${time}.000Z`;
  }

  return new Date().toISOString();
}

/**
 * Extracts hostname or server identifier from syslog / header if present
 */
function extractHostname(line: string): string {
  // Syslog format: Mon DD HH:MM:SS hostname process...
  const match = line.match(/^[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}\s+(\S+)/);
  if (match && match[1] && !match[1].includes(':')) {
    return match[1];
  }
  return 'uploaded-host';
}

/**
 * Infers eventType and severity from log contents using keyword heuristics
 */
function inferEventTypeAndSeverity(line: string): {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const lower = line.toLowerCase();

  // 1. Critical Web Attacks
  if (
    lower.includes("union select") ||
    lower.includes("' or '1'='1") ||
    lower.includes("waitfor delay") ||
    lower.includes("sql injection") ||
    lower.includes("information_schema") ||
    lower.includes("select * from")
  ) {
    return { eventType: 'sql_injection_attempt', severity: 'critical' };
  }

  if (
    lower.includes("<script>") ||
    lower.includes("javascript:") ||
    lower.includes("alert(") ||
    lower.includes("onerror=") ||
    lower.includes("xss")
  ) {
    return { eventType: 'xss_attempt', severity: 'critical' };
  }

  // 2. Malware & C2 Indicators
  if (
    lower.includes("trojan") ||
    lower.includes("clamd") ||
    lower.includes("cobaltstrike") ||
    lower.includes(".exe found") ||
    lower.includes("malware") ||
    lower.includes("beacon")
  ) {
    return { eventType: 'malware_signature', severity: 'critical' };
  }

  // 3. Brute Force & User Enumeration
  if (
    lower.includes("check pass; user unknown") ||
    lower.includes("invalid user") ||
    lower.includes("maximum authentication attempts exceeded") ||
    lower.includes("failed 4625")
  ) {
    return { eventType: 'brute_force', severity: 'high' };
  }

  // 4. Authentication Failures
  if (
    lower.includes("authentication failure") ||
    lower.includes("failed password") ||
    lower.includes("authentication failed") ||
    lower.includes("kerberos authentication failed") ||
    lower.includes("permission denied")
  ) {
    return { eventType: 'failed_login', severity: 'medium' };
  }

  // 5. Network Scanning / Probing
  if (
    lower.includes("potential syn stealth scan") ||
    lower.includes("nmap") ||
    lower.includes("port scan") ||
    lower.includes("connection from") ||
    lower.includes("user unknown timed out") ||
    (lower.includes(" 404 ") && lower.includes("get "))
  ) {
    return { eventType: 'port_scan', severity: 'medium' };
  }

  // 6. Service Alerts
  if (
    lower.includes("alert exited abnormally") ||
    lower.includes("error") ||
    lower.includes("segfault") ||
    lower.includes("panic")
  ) {
    return { eventType: 'service_alert', severity: 'medium' };
  }

  // 7. Normal operational traffic
  if (
    lower.includes("session opened") ||
    lower.includes("session closed") ||
    lower.includes("startup succeeded") ||
    lower.includes("shutdown succeeded") ||
    lower.includes("restart") ||
    lower.includes(" 200 ok") ||
    lower.includes(" 200 ") ||
    lower.includes("http get") ||
    lower.includes("http post")
  ) {
    return { eventType: 'normal_traffic', severity: 'low' };
  }

  // Fallback for lines with general telemetry
  return { eventType: 'system_telemetry', severity: 'low' };
}

/**
 * Validates if a line contains plausible security/system log content
 */
function isPlausibleLogLine(line: string): boolean {
  if (line.length < 10) return false;

  // Ignore page numbers, headers, single words, binary garbage
  if (/^(page\s+\d+|table of contents|\d+)$/i.test(line)) return false;
  if (/^---|^===|\*\*\*|^\/\//.test(line)) return false;

  // Check if it has either a date, an IP, a service name, or known keywords
  const hasDateOrTime = /\b\d{1,2}:\d{2}:\d{2}\b|\b\d{4}-\d{2}-\d{2}\b|[A-Z][a-z]{2}\s+\d+/.test(line);
  const hasIp = /\b(?:\d{1,3}\.){3}\d{1,3}\b|rhost=|localhost/i.test(line);
  const hasKeywords = /sshd|pam|su\(|ftpd|nginx|apache|http|kernel|logrotate|session|failed|error|auth|connect|user/i.test(line);

  return hasDateOrTime || hasIp || hasKeywords;
}

/**
 * Parses cleaned raw log text into an array of LogEntry objects
 */
export function parseCleanedText(cleanedText: string): ParseResult {
  const lines = cleanedText.split('\n').filter((l) => l.trim().length > 0);
  const totalLines = lines.length;

  const logs: LogEntry[] = [];
  let skippedCount = 0;

  lines.forEach((line, index) => {
    if (!isPlausibleLogLine(line)) {
      skippedCount++;
      return;
    }

    const timestamp = extractTimestamp(line);
    const sourceIp = extractSourceIp(line);
    const hostname = extractHostname(line);
    const { eventType, severity } = inferEventTypeAndSeverity(line);

    const logId = `upload-log-${String(logs.length + 1).padStart(3, '0')}`;

    logs.push({
      id: logId,
      timestamp,
      sourceIp,
      destIp: '10.0.0.1',
      eventType,
      severity,
      rawLog: line,
      hostname,
    });
  });

  return {
    logs,
    summary: {
      totalLines,
      parsedCount: logs.length,
      skippedCount,
    },
  };
}
