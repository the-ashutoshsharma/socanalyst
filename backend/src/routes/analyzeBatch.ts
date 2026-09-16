import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { UploadedLogs } from '../models/UploadedLogs';
import { UploadReport } from '../models/UploadReport';
import { runFullAnalysis } from '../orchestrator';
import { generateConsolidatedReport } from '../agents/reportGenerator';
import { generateReportPdf } from '../services/pdfReportGenerator';
import { memoryStore } from '../services/memoryStore';
import { FullIncidentAnalysis, MitreTechniqueMatch, CveMatch } from '../types';

const router = Router();

// POST /api/analyze-upload/:uploadId - Runs all logs in an upload through multi-agent pipeline and synthesizes a consolidated report
router.post('/analyze-upload/:uploadId', async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadId = req.params.uploadId as string;

    // Check memory store first
    let uploadedRecord: any = memoryStore.getUploadedLogs(uploadId);

    // Fall back to MongoDB if connected
    if (!uploadedRecord && mongoose.connection.readyState === 1) {
      try {
        uploadedRecord = await UploadedLogs.findOne({ uploadId });
      } catch (dbError) {
        console.warn(`[MongoDB] Warning: Failed to query MongoDB for upload ${uploadId}`);
      }
    }

    if (!uploadedRecord || !uploadedRecord.logs || uploadedRecord.logs.length === 0) {
      res.status(404).json({ success: false, error: 'Uploaded logs not found for this ID.' });
      return;
    }

    console.log(`\n[BATCH ORCHESTRATION] Starting batch analysis for upload: ${uploadId} (${uploadedRecord.logs.length} logs)`);

    const incidents: FullIncidentAnalysis[] = [];
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    const mitreMap = new Map<string, MitreTechniqueMatch>();
    const cveMap = new Map<string, CveMatch>();

    // Process logs sequentially to respect Groq rate limits
    for (let i = 0; i < uploadedRecord.logs.length; i++) {
      const log = uploadedRecord.logs[i];
      console.log(`[Batch ${i + 1}/${uploadedRecord.logs.length}] Analyzing log ${log.id}...`);

      try {
        const incident = await runFullAnalysis(log);
        incidents.push(incident);

        // Count severity
        const sev = (incident.socAnalysis?.severity || log.severity || 'low').toLowerCase() as keyof typeof severityCounts;
        if (severityCounts[sev] !== undefined) {
          severityCounts[sev]++;
        } else {
          severityCounts.low++;
        }

        // Aggregate MITRE techniques
        if (incident.vulnerabilityAnalysis?.mitreTechniques) {
          incident.vulnerabilityAnalysis.mitreTechniques.forEach((t) => {
            if (!mitreMap.has(t.techniqueId)) {
              mitreMap.set(t.techniqueId, t);
            }
          });
        }

        // Aggregate CVEs
        if (incident.vulnerabilityAnalysis?.relatedCves) {
          incident.vulnerabilityAnalysis.relatedCves.forEach((c) => {
            if (!cveMap.has(c.cveId)) {
              cveMap.set(c.cveId, c);
            }
          });
        }
      } catch (logErr) {
        console.error(`Error analyzing log ${log.id}:`, logErr);
      }
    }

    const uniqueMitreTechniques = Array.from(mitreMap.values());
    const uniqueCves = Array.from(cveMap.values());

    // Calculate baseline risk score
    let baseRiskScore = 3;
    if (severityCounts.critical > 0) baseRiskScore = 9;
    else if (severityCounts.high > 0) baseRiskScore = 7;
    else if (severityCounts.medium > 0) baseRiskScore = 5;

    const consolidatedData = {
      uploadId,
      filename: uploadedRecord.filename,
      totalLogs: incidents.length,
      severityCounts,
      mitreTechniques: uniqueMitreTechniques,
      cves: uniqueCves,
      incidentsSummary: incidents.map((inc) => ({
        logId: inc.logId,
        eventType: inc.log.eventType,
        severity: inc.socAnalysis?.severity || inc.log.severity,
        reasoning: inc.socAnalysis?.reasoning,
        riskScore: inc.report?.riskScore,
      })),
    };

    console.log(`[BATCH SYNTHESIS] Generating consolidated executive report...`);
    const executiveReport = await generateConsolidatedReport(consolidatedData);

    const reportData = {
      uploadId,
      filename: uploadedRecord.filename,
      summary: {
        totalLogs: incidents.length,
        severityCounts,
        riskScore: executiveReport.riskScore || baseRiskScore,
      },
      mitreTechniques: uniqueMitreTechniques,
      cves: uniqueCves,
      executiveReport,
      incidents,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save in memory store
    memoryStore.setUploadReport(reportData);

    // Persist to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const consolidatedReportDoc = new UploadReport(reportData);
        await consolidatedReportDoc.save();
        console.log(`[MongoDB] Upload report saved to MongoDB: ${uploadId}`);
      } catch (dbError: any) {
        console.warn(`[MongoDB] Warning: Failed to persist report ${uploadId} to MongoDB:`, dbError.message);
      }
    }

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error: any) {
    console.error('Batch analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Batch analysis failed due to server error.',
    });
  }
});

// GET /api/reports/:uploadId - Returns the saved consolidated report as JSON
router.get('/reports/:uploadId', async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadId = req.params.uploadId as string;

    let report: any = memoryStore.getUploadReport(uploadId);

    if (!report && mongoose.connection.readyState === 1) {
      try {
        report = await UploadReport.findOne({ uploadId });
      } catch (dbError) {
        console.warn(`[MongoDB] Warning: Failed to query MongoDB for report ${uploadId}`);
      }
    }

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found.' });
      return;
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report.',
    });
  }
});

// GET /api/reports/:uploadId/download - Generates and sends downloadable PDF report
router.get('/reports/:uploadId/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadId = req.params.uploadId as string;

    let report: any = memoryStore.getUploadReport(uploadId);

    if (!report && mongoose.connection.readyState === 1) {
      try {
        report = await UploadReport.findOne({ uploadId });
      } catch (dbError) {
        console.warn(`[MongoDB] Warning: Failed to query MongoDB for report ${uploadId}`);
      }
    }

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found for download.' });
      return;
    }

    console.log(`[PDF GENERATION] Generating PDF report for upload: ${uploadId}...`);
    const pdfBuffer = await generateReportPdf(report);

    const safeFilename = `SOC_Report_${report.filename ? report.filename.replace(/[^a-zA-Z0-9_-]/g, '_') : uploadId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF generation / download failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate PDF report.',
    });
  }
});

export default router;
