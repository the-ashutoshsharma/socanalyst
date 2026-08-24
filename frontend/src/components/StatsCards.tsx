import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Incident } from '@/types';

interface StatsCardsProps {
  incidents: Incident[];
  isLoading?: boolean;
}

export function StatsCards({ incidents }: StatsCardsProps) {
  const total = incidents.length;
  const critical = incidents.filter(
    (i) => i.socAnalysis?.severity === 'critical' || i.log?.severity === 'critical'
  ).length;
  const high = incidents.filter(
    (i) => i.socAnalysis?.severity === 'high' || i.log?.severity === 'high'
  ).length;
  const mediumOrLow = incidents.filter(
    (i) =>
      ['medium', 'low'].includes(i.socAnalysis?.severity || '') ||
      ['medium', 'low'].includes(i.log?.severity || '')
  ).length;

  const stats = [
    { title: 'Total Incidents', count: total, subtitle: 'Triaged security logs' },
    { title: 'Critical', count: critical, subtitle: 'Immediate action required' },
    { title: 'High', count: high, subtitle: 'High priority threats' },
    { title: 'Medium / Low', count: mediumOrLow, subtitle: 'Standard & benign events' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stat.count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
