import fs from 'fs';
import path from 'path';
import { LogEntry } from '../types';

const rawFilePath = path.join(__dirname, '../data/real-logs-raw.txt');
const outputFilePath = path.join(__dirname, '../data/real-logs.json');

const monthMap: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function parseAll(): void {
  if (!fs.existsSync(rawFilePath)) {
    console.error(`Raw log file not found at: ${rawFilePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(rawFilePath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const parsedEntries: LogEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([A-Z][a-z]{2})\s+(\d+)\s+(\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:]+):\s*(.*)$/);
    if (!match) continue;

    const [, monthStr, dayStr, timeStr, hostname, , message] = match;
    const month = monthMap[monthStr] || '06';
    const day = dayStr.padStart(2, '0');
    const timestamp = `2005-${month}-${day}T${timeStr}.000Z`;

    // Extract real source IP / remote host without alteration
    let sourceIp = 'internal';
    const rhostMatch = message.match(/rhost=([^\s]+)/);
    const connMatch = message.match(/connection from\s+([^\s]+)/i);
    const authFromMatch = message.match(/Authentication failed from\s+([^\s]+)/i);
    const ipRegexMatch = message.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);

    if (rhostMatch && rhostMatch[1]) {
      sourceIp = rhostMatch[1];
    } else if (connMatch && connMatch[1]) {
      sourceIp = connMatch[1];
    } else if (authFromMatch && authFromMatch[1]) {
      sourceIp = authFromMatch[1];
    } else if (ipRegexMatch && ipRegexMatch[0]) {
      sourceIp = ipRegexMatch[0];
    }

    // Infer eventType strictly from real keywords already present in the line
    let eventType = 'normal_traffic';
    if (message.includes('check pass; user unknown') || message.includes('Invalid user')) {
      eventType = 'brute_force';
    } else if (
      message.includes('authentication failure') ||
      message.includes('Authentication failed') ||
      message.includes('Kerberos authentication failed')
    ) {
      eventType = 'failed_login';
    } else if (message.includes('connection from') || message.includes('timed out')) {
      eventType = 'port_scan';
    } else if (message.includes('session opened') || message.includes('session closed')) {
      eventType = 'normal_traffic';
    } else if (message.includes('ALERT exited abnormally')) {
      eventType = 'service_alert';
    } else if (
      message.includes('startup succeeded') ||
      message.includes('shutdown succeeded') ||
      message.includes('restart')
    ) {
      eventType = 'normal_traffic';
    }

    // Infer severity based on real indicators (repeated bursts = high, single failure = medium, normal = low)
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (eventType === 'brute_force') {
      severity = 'high';
    } else if (eventType === 'failed_login') {
      let burstCount = 0;
      for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 5); j++) {
        if (sourceIp !== 'internal' && lines[j].includes(sourceIp)) {
          burstCount++;
        }
      }
      severity = burstCount >= 4 ? 'high' : 'medium';
    } else if (eventType === 'service_alert' || eventType === 'port_scan') {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    parsedEntries.push({
      id: '', // to be assigned on selection
      timestamp,
      sourceIp,
      destIp: '10.0.0.1',
      eventType,
      severity,
      rawLog: line,
      hostname,
    });
  }

  // Select ~40 diverse, representative parsed entries (mix of failed logins, invalid user/brute force, normal sessions, service alerts, connections)
  // Categorize
  const bruteForceEntries = parsedEntries.filter((e) => e.eventType === 'brute_force');
  const failedLoginEntries = parsedEntries.filter((e) => e.eventType === 'failed_login');
  const normalEntries = parsedEntries.filter((e) => e.eventType === 'normal_traffic');
  const portScanEntries = parsedEntries.filter((e) => e.eventType === 'port_scan');
  const alertEntries = parsedEntries.filter((e) => e.eventType === 'service_alert');

  console.log(`Total parsed lines: ${parsedEntries.length}`);
  console.log(`Available categories: Brute Force (${bruteForceEntries.length}), Failed Login (${failedLoginEntries.length}), Normal (${normalEntries.length}), Port Scan (${portScanEntries.length}), Alert (${alertEntries.length})`);

  const selected: LogEntry[] = [];

  // Pick representative slice: ~10 brute force, ~12 failed logins (from different IPs), ~10 normal traffic, ~6 port scan / connection events, ~2 service alerts
  const sampleFrom = (arr: LogEntry[], count: number) => {
    if (arr.length <= count) return arr;
    const step = Math.floor(arr.length / count);
    const result: LogEntry[] = [];
    for (let k = 0; k < arr.length && result.length < count; k += step) {
      result.push(arr[k]);
    }
    return result;
  };

  selected.push(...sampleFrom(normalEntries, 10));
  selected.push(...sampleFrom(failedLoginEntries, 12));
  selected.push(...sampleFrom(bruteForceEntries, 10));
  selected.push(...sampleFrom(portScanEntries, 6));
  selected.push(...sampleFrom(alertEntries, 2));

  // Sort by timestamp
  selected.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));

  // Assign clean sequential IDs
  const finalEntries = selected.map((entry, idx) => ({
    ...entry,
    id: `log-${String(idx + 1).padStart(3, '0')}`,
  }));

  fs.writeFileSync(outputFilePath, JSON.stringify(finalEntries, null, 2), 'utf-8');
  console.log(`Successfully generated ${finalEntries.length} real log entries into: ${outputFilePath}`);
}

parseAll();
