import { Router, Request, Response } from 'express';
import { runFullAnalysis } from '../orchestrator';
import { Incident } from '../models/Incident';
import { LogEntry } from '../types';
import realLogs from '../data/real-logs.json';

const router = Router();

// GET /api/logs - Returns the real log dataset for selection and analysis
router.get('/logs', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    count: (realLogs as LogEntry[]).length,
    data: realLogs,
  });
});

// POST /api/analyze - Analyzes a log entry (provided in body or selected by logId) and saves incident
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    let log: LogEntry | undefined;

    if (req.body.log) {
      log = req.body.log;
    } else if (req.body.logId) {
      log = (realLogs as LogEntry[]).find((l) => l.id === req.body.logId);
      if (!log) {
        res.status(404).json({ error: `Log with id '${req.body.logId}' not found in dataset.` });
        return;
      }
    } else if (req.body.id && req.body.rawLog) {
      log = req.body as LogEntry;
    } else {
      // Default to first real log if nothing provided
      log = realLogs[0] as LogEntry;
    }

    if (!log) {
      res.status(400).json({ error: 'No valid log entry provided for analysis.' });
      return;
    }

    // Run AI multi-agent orchestration
    const analysisResult = await runFullAnalysis(log);

    // Save result to MongoDB
    let savedIncident = null;
    try {
      const incidentDoc = new Incident(analysisResult);
      savedIncident = await incidentDoc.save();
    } catch (dbError) {
      console.error('Failed to persist incident to MongoDB:', dbError);
    }

    res.json({
      success: true,
      data: savedIncident || analysisResult,
    });
  } catch (error: any) {
    console.error('Error during log analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during analysis',
    });
  }
});

// GET /api/incidents - Returns all saved incidents from MongoDB
router.get('/incidents', async (_req: Request, res: Response): Promise<void> => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch incidents',
    });
  }
});

// GET /api/incidents/:id - Returns one incident by ID
router.get('/incidents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    let incident = null;

    // Check if ID is a valid MongoDB ObjectId or matches logId
    if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
      incident = await Incident.findById(id);
    }

    if (!incident && typeof id === 'string') {
      incident = await Incident.findOne({ logId: id });
    }

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    res.json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    console.error('Error fetching incident:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch incident',
    });
  }
});

export default router;
