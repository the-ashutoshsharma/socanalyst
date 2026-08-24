import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LogEntry, Incident } from '@/types';
import sampleLogsData from '@/data/sample-logs.json';

interface LogAnalyzerProps {
  onAnalyze: (logId: string) => Promise<void>;
  isAnalyzing: boolean;
  latestIncident: Incident | null;
  onViewDetails: (incident: Incident) => void;
}

export function LogAnalyzer({
  onAnalyze,
  isAnalyzing,
  latestIncident,
  onViewDetails,
}: LogAnalyzerProps) {
  const sampleLogs = sampleLogsData as LogEntry[];
  const [selectedLogId, setSelectedLogId] = useState<string>(sampleLogs[1]?.id || sampleLogs[0].id);

  const selectedLog = sampleLogs.find((l) => l.id === selectedLogId) || sampleLogs[0];

  const handleRun = async () => {
    if (!selectedLogId || isAnalyzing) return;
    await onAnalyze(selectedLogId);
  };

  const getSeverityVariant = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-semibold">Run Security Analysis</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Select a security log to execute the 5-agent AI triage & threat correlation pipeline.
            </CardDescription>
          </div>
          <Button
            onClick={handleRun}
            disabled={isAnalyzing}
            className="w-full sm:w-auto font-medium"
          >
            {isAnalyzing ? 'Executing AI Pipeline...' : 'Run Analysis'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Select Sample Log</label>
            <select
              value={selectedLogId}
              onChange={(e) => setSelectedLogId(e.target.value)}
              disabled={isAnalyzing}
              aria-label="Select Sample Log"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {sampleLogs.map((log) => (
                <option key={log.id} value={log.id}>
                  [{log.id}] {log.eventType} ({log.severity.toUpperCase()}) - {log.hostname}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-6 md:pt-6">
            <span className="text-xs text-muted-foreground">Event Type:</span>
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {selectedLog.eventType}
            </span>

            <span className="text-xs text-muted-foreground ml-2">Initial Severity:</span>
            <Badge variant={getSeverityVariant(selectedLog.severity)}>
              {selectedLog.severity.toUpperCase()}
            </Badge>

            <span className="text-xs text-muted-foreground ml-2">Host:</span>
            <span className="text-xs font-mono text-foreground">{selectedLog.hostname}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Raw Telemetry</span>
            <span className="text-xs font-mono text-muted-foreground">
              {selectedLog.sourceIp} &rarr; {selectedLog.destIp}
            </span>
          </div>
          <div className="bg-background border border-border p-3 rounded-lg font-mono text-xs text-muted-foreground overflow-x-auto">
            <code>{selectedLog.rawLog}</code>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {isAnalyzing && (
          <div className="p-4 border border-border rounded-lg bg-background/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground animate-pulse">
                Orchestrator: Dispatching agents (SOC Analyst, Threat Intel, Malware Analyst, Vulnerability Mapping, Report Generator)...
              </span>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        )}

        {/* Completed Flash Result */}
        {!isAnalyzing && latestIncident && (
          <div className="p-4 border border-border rounded-lg bg-card/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Latest Analysis: Log {latestIncident.logId}
                </span>
                <Badge variant={getSeverityVariant(latestIncident.socAnalysis?.severity || 'low')}>
                  {(latestIncident.socAnalysis?.severity || 'LOW').toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Risk Score: {latestIncident.report?.riskScore || 0}/10
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {latestIncident.report?.executiveSummary}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(latestIncident)}
              className="shrink-0 text-xs"
            >
              View Full Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
