import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { LogEntry, Incident } from '@/types';

interface LogAnalyzerProps {
  logs: LogEntry[];
  isLoadingLogs: boolean;
  onAnalyze: (logId: string) => Promise<void>;
  isAnalyzing: boolean;
  latestIncident: Incident | null;
  onViewDetails: (incident: Incident) => void;
}

export function LogAnalyzer({
  logs,
  isLoadingLogs,
  onAnalyze,
  isAnalyzing,
  latestIncident,
  onViewDetails,
}: LogAnalyzerProps) {
  const [selectedLogId, setSelectedLogId] = useState<string>('');

  useEffect(() => {
    if (
      logs.length > 0 &&
      (!selectedLogId || !logs.some((log) => log.id === selectedLogId))
    ) {
      setSelectedLogId(logs[0].id);
    }
  }, [logs, selectedLogId]);

  const selectedLog = logs.find((log) => log.id === selectedLogId) || logs[0];

  const handleRun = async () => {
    if (!selectedLogId || isAnalyzing) return;
    await onAnalyze(selectedLogId);
  };

  const getSeverityVariant = (severity?: string) => {
    switch (severity?.toLowerCase()) {
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
    <Card className="overflow-hidden border-border bg-card shadow-xl shadow-black/10">
      <CardHeader className="border-b border-border pb-6 pt-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
              <CardTitle className="text-lg font-semibold">
                Run Security Analysis
              </CardTitle>
            </div>
            <CardDescription className="mt-3 text-sm text-muted-foreground">
              Select a genuine system log and execute the multi-agent triage and
              threat correlation pipeline.
            </CardDescription>
          </div>

          <Button
            onClick={handleRun}
            disabled={isAnalyzing || isLoadingLogs || !selectedLog}
            className="h-11 min-w-[130px] bg-slate-100 px-6 font-semibold text-slate-900 transition-all hover:bg-white"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-7 pt-7">
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Analysis Input
          </label>

          {isLoadingLogs ? (
            <Skeleton className="h-14 w-full rounded-xl" />
          ) : (
            <select
              value={selectedLogId}
              onChange={(event) => setSelectedLogId(event.target.value)}
              disabled={isAnalyzing || logs.length === 0}
              aria-label="Select System Log"
              className="h-14 w-full rounded-xl border border-sky-400/70 bg-background px-4 text-sm text-foreground outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/10"
            >
              {logs.length === 0 ? (
                <option value="">No logs available</option>
              ) : (
                logs.map((log) => (
                  <option key={log.id} value={log.id}>
                    [{log.id}] {log.eventType} ({log.severity.toUpperCase()}) -{' '}
                    {log.hostname}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {selectedLog && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Event Type
                </p>
                <p className="mt-3 font-mono text-sm font-semibold text-foreground">
                  {selectedLog.eventType}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Initial Severity
                </p>
                <div className="mt-3">
                  <Badge
                    variant={getSeverityVariant(selectedLog.severity)}
                    className="px-3 py-1"
                  >
                    {selectedLog.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Target Host
                </p>
                <p className="mt-3 font-mono text-sm font-semibold text-foreground">
                  {selectedLog.hostname}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Network Path
                </p>
                <p className="mt-3 font-mono text-sm font-semibold text-foreground">
                  {selectedLog.sourceIp} -&gt; {selectedLog.destIp}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Raw Telemetry
                </span>
                <span className="text-xs text-muted-foreground">
                  Source security event
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-[#0b0e14]">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <div className="flex gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Security Log
                  </span>
                </div>
                <div className="overflow-x-auto p-5">
                  <code className="whitespace-pre-wrap break-words font-mono text-xs leading-7 text-slate-300">
                    {selectedLog.rawLog}
                  </code>
                </div>
              </div>
            </div>
          </>
        )}

        {isAnalyzing && (
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5">
            <p className="mb-4 text-sm font-medium text-sky-200 animate-pulse">
              Multi-agent orchestration in progress...
            </p>
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        )}

        {!isAnalyzing && latestIncident && (
          <div className="flex flex-col items-start justify-between gap-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  Analysis completed for {latestIncident.logId}
                </span>
                <Badge
                  variant={getSeverityVariant(
                    latestIncident.socAnalysis?.severity || 'low'
                  )}
                >
                  {(latestIncident.socAnalysis?.severity || 'LOW').toUpperCase()}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Risk Score: {latestIncident.report?.riskScore || 0}/10
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => onViewDetails(latestIncident)}
            >
              View Full Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
