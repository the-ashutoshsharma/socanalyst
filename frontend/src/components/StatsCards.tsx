import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Incident } from '@/types';

interface StatsCardsProps {
  incidents: Incident[];
  isLoading?: boolean;
}

export function StatsCards({ incidents }: StatsCardsProps) {
  const total = incidents.length;

  const critical = incidents.filter(
    (i) =>
      i.socAnalysis?.severity === 'critical' ||
      i.log?.severity === 'critical'
  ).length;

  const high = incidents.filter(
    (i) =>
      i.socAnalysis?.severity === 'high' ||
      i.log?.severity === 'high'
  ).length;

  const mediumOrLow = incidents.filter(
    (i) =>
      ['medium', 'low'].includes(i.socAnalysis?.severity || '') ||
      ['medium', 'low'].includes(i.log?.severity || '')
  ).length;

  const stats = [
    {
      title: 'Total Incidents',
      count: total,
      subtitle: 'Triaged security logs',
      accent: 'before:bg-slate-400',
    },
    {
      title: 'Critical',
      count: critical,
      subtitle: 'Immediate action required',
      accent: 'before:bg-red-500',
    },
    {
      title: 'High',
      count: high,
      subtitle: 'High priority threats',
      accent: 'before:bg-orange-400',
    },
    {
      title: 'Medium / Low',
      count: mediumOrLow,
      subtitle: 'Standard & benign events',
      accent: 'before:bg-yellow-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className={`relative overflow-hidden border-border bg-card/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600/70 hover:shadow-lg hover:shadow-black/20 before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${stat.accent}`}
        >
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-xs uppercase font-semibold tracking-[0.12em] text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="pb-6">
            <div className="text-4xl font-bold tracking-tight text-foreground">
              {stat.count}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {stat.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}