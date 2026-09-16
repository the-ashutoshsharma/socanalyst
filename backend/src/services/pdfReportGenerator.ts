import puppeteer from 'puppeteer';
import { UploadReportDocument } from '../models/UploadReport';

export async function generateReportPdf(report: UploadReportDocument | any): Promise<Buffer> {
  const summary = report.summary || {
    totalLogs: 0,
    severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
    riskScore: 0,
  };
  const execReport = report.executiveReport || {
    executiveSummary: 'No executive summary available.',
    technicalDetails: 'No technical details available.',
    recommendations: [],
    riskScore: summary.riskScore || 0,
  };
  const incidents = report.incidents || [];
  const mitreTechniques = report.mitreTechniques || [];
  const cves = report.cves || [];

  const dateStr = new Date(report.createdAt || Date.now()).toUTCString();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SOC Platform Security Report - ${report.filename || report.uploadId}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background-color: #ffffff;
      line-height: 1.5;
      font-size: 12px;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #27272a;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #09090b;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #52525b;
      font-size: 11px;
      margin-top: 4px;
    }
    .risk-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      background-color: #09090b;
      color: #fafafa;
      font-weight: 700;
      font-size: 13px;
      text-align: right;
    }
    .section {
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #27272a;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }
    .content-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      color: #334155;
      font-size: 11.5px;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #1e293b;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-critical { background-color: #fee2e2; color: #991b1b; }
    .badge-high { background-color: #ffedd5; color: #9a3412; }
    .badge-medium { background-color: #fef3c7; color: #92400e; }
    .badge-low { background-color: #f1f5f9; color: #475569; }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 8px;
    }
    .stat-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background-color: #ffffff;
      text-align: center;
    }
    .stat-val {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    .stat-lbl {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
    }
    ul {
      margin-left: 18px;
      margin-top: 6px;
    }
    li {
      margin-bottom: 6px;
      color: #334155;
      font-size: 11.5px;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e4e4e7;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      color: #71717a;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>SOC Platform — Security Analysis Report</h1>
      <p>Target: <strong>${report.filename || 'Log Dataset'}</strong> (Upload ID: ${report.uploadId})</p>
      <p>Generated: ${dateStr}</p>
    </div>
    <div class="risk-badge">
      Overall Risk Score: ${execReport.riskScore || summary.riskScore || 0}/10
    </div>
  </div>

  <!-- SUMMARY STATS -->
  <div class="section">
    <div class="section-title">Telemetry Summary & Severity Breakdown</div>
    <div class="grid">
      <div class="stat-card">
        <div class="stat-val">${summary.totalLogs || 0}</div>
        <div class="stat-lbl">Total Logs Analyzed</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #dc2626;">${summary.severityCounts?.critical || 0}</div>
        <div class="stat-lbl">Critical Threats</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #ea580c;">${summary.severityCounts?.high || 0}</div>
        <div class="stat-lbl">High Priority</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #64748b;">${(summary.severityCounts?.medium || 0) + (summary.severityCounts?.low || 0)}</div>
        <div class="stat-lbl">Medium / Low / Benign</div>
      </div>
    </div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="content-box">
      ${execReport.executiveSummary}
    </div>
  </div>

  <!-- RECOMMENDATIONS -->
  <div class="section">
    <div class="section-title">Actionable Recommendations</div>
    <div class="content-box">
      <ul>
        ${(execReport.recommendations || []).map((rec: string) => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
  </div>

  <!-- TECHNICAL SYNTHESIS -->
  <div class="section">
    <div class="section-title">Technical Details & Threat Correlation</div>
    <div class="content-box">
      ${execReport.technicalDetails}
    </div>
  </div>

  <!-- MITRE ATT&CK AND CVE -->
  ${mitreTechniques.length > 0 || cves.length > 0 ? `
  <div class="section">
    <div class="section-title">Correlated MITRE ATT&CK Techniques & CVEs</div>
    <table>
      <thead>
        <tr>
          <th>ID / Reference</th>
          <th>Name / Type</th>
          <th>Tactic / Severity</th>
          <th>Description / Detail</th>
        </tr>
      </thead>
      <tbody>
        ${mitreTechniques.map((t: any) => `
          <tr>
            <td><strong>${t.techniqueId}</strong></td>
            <td>${t.name}</td>
            <td><span class="badge badge-medium">${t.tactic}</span></td>
            <td>MITRE ATT&CK Technique</td>
          </tr>
        `).join('')}
        ${cves.map((c: any) => `
          <tr>
            <td><strong>${c.cveId}</strong></td>
            <td>${c.affectedProduct || 'Vulnerability'}</td>
            <td><span class="badge badge-critical">CVSS ${c.cvssScore}</span></td>
            <td>${c.description}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- INCIDENTS LIST -->
  ${incidents.length > 0 ? `
  <div class="section">
    <div class="section-title">Triage Log Breakdown (${incidents.length} Events)</div>
    <table>
      <thead>
        <tr>
          <th>Log ID</th>
          <th>Event Type</th>
          <th>Severity</th>
          <th>Source IP</th>
          <th>SOC Finding / Category</th>
          <th>Risk</th>
        </tr>
      </thead>
      <tbody>
        ${incidents.slice(0, 30).map((inc: any) => {
          const sev = inc.socAnalysis?.severity || inc.log?.severity || 'low';
          return `
          <tr>
            <td><strong>${inc.logId}</strong></td>
            <td>${inc.log?.eventType || 'event'}</td>
            <td><span class="badge badge-${sev}">${sev.toUpperCase()}</span></td>
            <td>${inc.log?.sourceIp || '-'}</td>
            <td>${inc.socAnalysis?.reasoning ? inc.socAnalysis.reasoning.substring(0, 80) + '...' : (inc.socAnalysis?.suggestedEventCategory || '-')}</td>
            <td><strong>${inc.report?.riskScore || 0}/10</strong></td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    ${incidents.length > 30 ? `<p style="font-size: 10px; color: #64748b; margin-top: 6px;">* Showing first 30 of ${incidents.length} analyzed events.</p>` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <span>SOC Platform — Multi-Agent AI Security Analysis</span>
    <span>Confidential — For Internal Security Operations Use Only</span>
  </div>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm',
      },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
