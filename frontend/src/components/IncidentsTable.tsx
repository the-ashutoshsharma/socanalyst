import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Incident } from '@/types';

interface IncidentsTableProps {
  incidents: Incident[];
  isLoading: boolean;
  onViewIncident: (incident: Incident) => void;
}

export function IncidentsTable({
  incidents,
  isLoading,
  onViewIncident,
}: IncidentsTableProps) {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Triage & Incident History</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Historical log analysis records stored in MongoDB (soc_platform database).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Loading incidents...
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No incidents recorded yet. Select a log and run an analysis above.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Log ID</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Source IP</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => {
                const severity =
                  incident.socAnalysis?.severity || incident.log?.severity || 'low';
                const eventType = incident.log?.eventType || 'unknown';
                const riskScore = incident.report?.riskScore ?? 'N/A';

                return (
                  <TableRow key={incident._id || incident.logId}>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(incident.createdAt || incident.timestamp)}
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
        )}
      </CardContent>
    </Card>
  );
}
