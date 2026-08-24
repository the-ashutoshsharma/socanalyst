import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Incident } from '@/types';

interface IncidentDetailDialogProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentDetailDialog({
  incident,
  isOpen,
  onClose,
}: IncidentDetailDialogProps) {
  if (!incident) return null;

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

  const getReputationVariant = (rep?: string) => {
    switch (rep?.toLowerCase()) {
      case 'malicious':
      case 'suspicious':
        return 'destructive';
      case 'clean':
      default:
        return 'secondary';
    }
  };

  const severity =
    incident.socAnalysis?.severity || incident.log?.severity || 'low';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="space-y-2 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold font-mono">
                {incident.logId}
              </DialogTitle>
              <Badge variant={getSeverityVariant(severity)}>
                {severity.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {incident.log?.eventType}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Risk Score:</span>
              <span className="text-sm font-bold text-foreground font-mono">
                {incident.report?.riskScore || 0}/10
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Host: {incident.log?.hostname} | {incident.log?.sourceIp} &rarr; {incident.log?.destIp} | {incident.timestamp}
          </p>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto pt-2 pr-1 space-y-4">
          <Tabs defaultValue="report" className="w-full">
            <TabsList className="grid grid-cols-5 w-full bg-muted">
              <TabsTrigger value="report">Final Report</TabsTrigger>
              <TabsTrigger value="soc">SOC Triage</TabsTrigger>
              <TabsTrigger value="malware">Malware</TabsTrigger>
              <TabsTrigger value="threat">Threat Intel</TabsTrigger>
              <TabsTrigger value="vuln">MITRE & CVE</TabsTrigger>
            </TabsList>

            {/* TAB 1: FINAL INCIDENT REPORT */}
            <TabsContent value="report" className="space-y-4 mt-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {incident.report?.executiveSummary || 'No executive summary available.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Actionable Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  {incident.report?.recommendations && incident.report.recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {incident.report.recommendations.map((rec, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-foreground font-mono font-semibold">{index + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No specific recommendations provided.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Technical Synthesis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {incident.report?.technicalDetails}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: SOC TRIAGE */}
            <TabsContent value="soc" className="space-y-4 mt-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">SOC Analyst Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground block">Verdict:</span>
                      <span className="text-sm font-semibold text-foreground">
                        {incident.socAnalysis?.isSuspicious ? 'Suspicious / Threat' : 'Benign Activity'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Assessed Severity:</span>
                      <Badge variant={getSeverityVariant(incident.socAnalysis?.severity)}>
                        {(incident.socAnalysis?.severity || 'LOW').toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Suggested Category:</span>
                      <span className="text-xs font-mono text-foreground">
                        {incident.socAnalysis?.suggestedEventCategory || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-xs font-medium text-muted-foreground block mb-1">Reasoning:</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {incident.socAnalysis?.reasoning}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Raw Telemetry</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-3 bg-background border border-border rounded-lg text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                    {incident.log?.rawLog}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: MALWARE ANALYSIS */}
            <TabsContent value="malware" className="space-y-4 mt-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Malware Indicators & Behavior</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground block">Malware Flag:</span>
                      <span className="text-sm font-semibold text-foreground">
                        {incident.malwareAnalysis?.isLikelyMalware ? 'Likely Malicious' : 'No Malware Detected'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Malware Family:</span>
                      <span className="text-xs font-mono text-foreground">
                        {incident.malwareAnalysis?.malwareFamily || 'None Identified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Confidence:</span>
                      <span className="text-xs font-mono text-foreground">
                        {incident.malwareAnalysis?.confidence
                          ? `${Math.round(incident.malwareAnalysis.confidence * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-xs font-medium text-muted-foreground block mb-1">Behavior Summary:</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {incident.malwareAnalysis?.behaviorSummary || 'No behavioral indicators recorded.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: THREAT INTEL */}
            <TabsContent value="threat" className="space-y-4 mt-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">IP Reputation Assessment</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Simulated CTI
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground block">Queried IP:</span>
                      <span className="text-xs font-mono text-foreground">
                        {incident.log?.sourceIp}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Reputation:</span>
                      <Badge variant={getReputationVariant(incident.threatIntel?.ipReputation)}>
                        {(incident.threatIntel?.ipReputation || 'CLEAN').toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Associated Actor:</span>
                      <span className="text-xs font-mono text-foreground">
                        {incident.threatIntel?.knownThreatActor || 'None'}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-xs font-medium text-muted-foreground block mb-1">Threat Intelligence Notes:</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {incident.threatIntel?.notes || 'No notes available.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: MITRE & CVE */}
            <TabsContent value="vuln" className="space-y-4 mt-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">MITRE ATT&CK Techniques</CardTitle>
                </CardHeader>
                <CardContent>
                  {incident.vulnerabilityAnalysis?.mitreTechniques &&
                  incident.vulnerabilityAnalysis.mitreTechniques.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {incident.vulnerabilityAnalysis.mitreTechniques.map((tech) => (
                        <div
                          key={tech.techniqueId}
                          className="p-3 border border-border rounded-lg bg-background space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-foreground">
                              {tech.techniqueId}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {tech.tactic}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-foreground">{tech.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No specific MITRE techniques mapped.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Related Vulnerabilities & CVEs</CardTitle>
                </CardHeader>
                <CardContent>
                  {incident.vulnerabilityAnalysis?.relatedCves &&
                  incident.vulnerabilityAnalysis.relatedCves.length > 0 ? (
                    <div className="space-y-3">
                      {incident.vulnerabilityAnalysis.relatedCves.map((cve) => (
                        <div
                          key={cve.cveId}
                          className="p-3 border border-border rounded-lg bg-background space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-foreground">
                              {cve.cveId}
                            </span>
                            <Badge variant="destructive" className="text-[10px]">
                              CVSS {cve.cvssScore}
                            </Badge>
                          </div>
                          {cve.affectedProduct && (
                            <span className="text-xs text-muted-foreground block">
                              Product: {cve.affectedProduct}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">{cve.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No correlated CVEs identified.</p>
                  )}
                </CardContent>
              </Card>

              {incident.vulnerabilityAnalysis?.justification && (
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Mapping Justification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {incident.vulnerabilityAnalysis.justification}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
