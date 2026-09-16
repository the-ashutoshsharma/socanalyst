import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { uploadLogFile, analyzeUpload, getReportDownloadUrl } from '@/lib/api';
import { UploadResponse, ConsolidatedUploadReport, Incident } from '@/types';

interface UploadAnalyzerProps {
  onViewIncident: (incident: Incident) => void;
}

export function UploadAnalyzer({ onViewIncident }: UploadAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [consolidatedReport, setConsolidatedReport] = useState<ConsolidatedUploadReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (selectedFile: File) => {
    const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf') || selectedFile.type === 'application/pdf';
    const isTxt = selectedFile.name.toLowerCase().endsWith('.txt') || selectedFile.name.toLowerCase().endsWith('.log') || selectedFile.type.includes('text');

    if (!isPdf && !isTxt) {
      setErrorMsg('Invalid file format. Please upload a .pdf or .txt/.log file.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('File exceeds 5MB maximum limit.');
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setConsolidatedReport(null);
    setIsUploading(true);

    try {
      const response = await uploadLogFile(selectedFile);
      setUploadResult(response);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Failed to upload and parse log file.');
      setUploadResult(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRunBatchAnalysis = async () => {
    if (!uploadResult?.uploadId) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisStep('Dispatching multi-agent orchestrator across parsed telemetry...');

    try {
      const report = await analyzeUpload(uploadResult.uploadId);
      setConsolidatedReport(report);
      setAnalysisStep('Analysis complete! Executive report generated.');
    } catch (err: any) {
      console.error('Batch analysis failed:', err);
      setErrorMsg(err.message || 'Batch analysis failed to execute. Check backend connectivity.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!consolidatedReport?.uploadId) return;
    const downloadUrl = getReportDownloadUrl(consolidatedReport.uploadId);
    window.open(downloadUrl, '_blank');
  };

  const getSeverityVariant = (sev?: string) => {
    switch (sev?.toLowerCase()) {
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
    <div className="space-y-6">
      {/* Upload Zone Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Upload & Analyze Log Files</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Upload raw security logs (.pdf or .txt format). The pipeline cleans, parses, executes the 5-agent AI analysis, and produces a downloadable PDF report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="p-3 border border-destructive/50 bg-destructive/10 text-destructive-foreground rounded-lg text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="underline ml-2">
                Dismiss
              </button>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-accent/20'
                : 'border-border bg-background/50 hover:bg-muted/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.log"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">
                {isUploading ? (
                  <span className="animate-pulse">Parsing and normalizing log contents...</span>
                ) : file ? (
                  <span>Selected: <strong className="font-mono">{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</span>
                ) : (
                  <span>Drag and drop a <strong>.pdf</strong> or <strong>.txt</strong> file here, or click to browse</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Max file size: 5MB. Supports syslog, ISO 8601, web access logs, and auth telemetry.
              </p>
            </div>
          </div>

          {/* Upload & Parsing Summary Banner */}
          {uploadResult && (
            <div className="p-4 border border-border rounded-xl bg-card/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground font-mono">
                      {uploadResult.filename}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {uploadResult.fileType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>{uploadResult.summary.totalLines}</strong> lines scanned &bull;{' '}
                    <strong className="text-foreground">{uploadResult.summary.parsedCount}</strong> logs parsed &bull;{' '}
                    <span className="text-muted-foreground">{uploadResult.summary.skippedCount} non-log lines filtered</span>
                  </p>
                </div>

                <Button
                  onClick={handleRunBatchAnalysis}
                  disabled={isAnalyzing}
                  className="font-medium shrink-0"
                >
                  {isAnalyzing ? 'Analyzing Batch...' : 'Run Full Batch Analysis'}
                </Button>
              </div>

              {/* Parsed Logs Preview */}
              {!consolidatedReport && (
                <div className="pt-2">
                  <span className="text-xs font-medium text-muted-foreground block mb-2">
                    Parsed Telemetry Preview (First 5 of {uploadResult.logs.length} logs):
                  </span>
                  <div className="space-y-1.5 font-mono text-xs max-h-40 overflow-y-auto border border-border rounded-lg p-2 bg-background">
                    {uploadResult.logs.slice(0, 5).map((l) => (
                      <div key={l.id} className="text-muted-foreground truncate border-b border-border/40 pb-1 last:border-0">
                        <span className="text-foreground font-semibold">[{l.id}]</span>{' '}
                        <span className="text-xs uppercase px-1 bg-muted rounded">{l.eventType}</span>{' '}
                        <span>{l.rawLog}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Batch Analysis Progress Skeleton */}
          {isAnalyzing && (
            <div className="p-6 border border-border rounded-xl bg-background/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground animate-pulse">
                  {analysisStep}
                </span>
                <span className="text-xs text-muted-foreground">Multi-Agent Pipeline Active</span>
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consolidated Report Presentation */}
      {consolidatedReport && (
        <div className="space-y-6">
          {/* Executive Overview Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-bold">Consolidated Executive Report</CardTitle>
                    <Badge variant="destructive" className="text-xs font-bold">
                      Risk Score: {consolidatedReport.summary.riskScore}/10
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Dataset: {consolidatedReport.filename} &bull; Analyzed {consolidatedReport.summary.totalLogs} events
                  </CardDescription>
                </div>

                <Button
                  onClick={handleDownloadPdf}
                  className="bg-primary text-primary-foreground font-medium shrink-0 shadow-sm"
                >
                  Download Report (PDF)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Severity Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 border border-border rounded-lg bg-background text-center">
                  <span className="text-xs text-muted-foreground uppercase block">Total Analyzed</span>
                  <span className="text-2xl font-bold text-foreground font-mono">
                    {consolidatedReport.summary.totalLogs}
                  </span>
                </div>
                <div className="p-3 border border-border rounded-lg bg-background text-center">
                  <span className="text-xs text-muted-foreground uppercase block">Critical</span>
                  <span className="text-2xl font-bold text-destructive font-mono">
                    {consolidatedReport.summary.severityCounts.critical}
                  </span>
                </div>
                <div className="p-3 border border-border rounded-lg bg-background text-center">
                  <span className="text-xs text-muted-foreground uppercase block">High Priority</span>
                  <span className="text-2xl font-bold text-foreground font-mono">
                    {consolidatedReport.summary.severityCounts.high}
                  </span>
                </div>
                <div className="p-3 border border-border rounded-lg bg-background text-center">
                  <span className="text-xs text-muted-foreground uppercase block">Medium / Low</span>
                  <span className="text-2xl font-bold text-muted-foreground font-mono">
                    {consolidatedReport.summary.severityCounts.medium + consolidatedReport.summary.severityCounts.low}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Executive Summary */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-semibold text-foreground tracking-wider">
                  Executive Summary
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed bg-background p-4 rounded-lg border border-border">
                  {consolidatedReport.executiveReport.executiveSummary}
                </p>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-semibold text-foreground tracking-wider">
                  Actionable Strategic & Tactical Recommendations
                </span>
                <div className="bg-background p-4 rounded-lg border border-border">
                  <ul className="space-y-2">
                    {consolidatedReport.executiveReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-foreground font-mono font-bold">{index + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technical Synthesis */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-semibold text-foreground tracking-wider">
                  Technical Threat Synthesis
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed bg-background p-4 rounded-lg border border-border">
                  {consolidatedReport.executiveReport.technicalDetails}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mapped MITRE & CVEs */}
          {(consolidatedReport.mitreTechniques.length > 0 || consolidatedReport.cves.length > 0) && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Correlated MITRE ATT&CK Matrix & CVE Exposures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {consolidatedReport.mitreTechniques.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-2 font-medium">
                      MITRE ATT&CK Techniques ({consolidatedReport.mitreTechniques.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {consolidatedReport.mitreTechniques.map((tech) => (
                        <div key={tech.techniqueId} className="p-3 border border-border rounded-lg bg-background space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-foreground">{tech.techniqueId}</span>
                            <Badge variant="secondary" className="text-[10px]">{tech.tactic}</Badge>
                          </div>
                          <p className="text-xs font-medium text-foreground">{tech.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {consolidatedReport.cves.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-2 font-medium">
                      Related CVE Exposures ({consolidatedReport.cves.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {consolidatedReport.cves.map((cve) => (
                        <div key={cve.cveId} className="p-3 border border-border rounded-lg bg-background space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-foreground">{cve.cveId}</span>
                            <Badge variant="destructive" className="text-[10px]">CVSS {cve.cvssScore}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{cve.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Incidents Table */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Analyzed Events & Triage Breakdown ({consolidatedReport.incidents.length} events)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Log ID</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Source IP</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidatedReport.incidents.map((incident) => {
                    const severity =
                      incident.socAnalysis?.severity || incident.log?.severity || 'low';
                    const eventType = incident.log?.eventType || 'unknown';
                    const riskScore = incident.report?.riskScore ?? 'N/A';

                    return (
                      <TableRow key={incident.logId}>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {incident.logId}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {eventType}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityVariant(severity)}>
                            {severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {riskScore}/10
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {incident.log?.sourceIp || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onViewIncident(incident)}
                            className="text-xs h-7 px-3"
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
