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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);

      return date.toLocaleString([], {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-lg shadow-black/10">
      <CardHeader className="flex flex-row items-start justify-between border-b border-border pb-6">
        <div>
          <CardTitle className="text-xl font-semibold">
            Triage & Incident History
          </CardTitle>

          <CardDescription className="mt-2 text-sm">
            Review completed security analyses and investigate recorded
            incidents.
          </CardDescription>
        </div>

        <div className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono text-muted-foreground">
          {incidents.length} records
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Loading incident records...
            </p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background font-mono text-sm text-muted-foreground">
              0
            </div>

            <h3 className="mt-5 text-lg font-semibold text-foreground">
              No incidents recorded
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Completed security analyses will appear here once the backend
              service is available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Log ID</TableHead>
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
                    incident.socAnalysis?.severity ||
                    incident.log?.severity ||
                    'low';

                  const eventType =
                    incident.log?.eventType || 'unknown';

                  const riskScore =
                    incident.report?.riskScore ?? 'N/A';

                  return (
                    <TableRow
                      key={incident._id || incident.logId}
                      className="hover:bg-muted/30"
                    >
                      <TableCell className="font-mono text-xs font-semibold">
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

                      <TableCell className="text-sm font-medium">
                        {riskScore}/10
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {incident.log?.sourceIp || '-'}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(
                          incident.createdAt || incident.timestamp
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewIncident(incident)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}