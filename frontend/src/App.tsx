import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { LogAnalyzer } from './components/LogAnalyzer';
import { IncidentsTable } from './components/IncidentsTable';
import { IncidentDetailDialog } from './components/IncidentDetailDialog';
import { UploadAnalyzer } from './components/UploadAnalyzer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { getIncidents, getLogs, analyzeLog } from './lib/api';
import { Incident, LogEntry } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'upload'>('live');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState<boolean>(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (err: any) {
      console.error('Error loading incidents:', err);
      setErrorMsg('Failed to fetch historical incidents from backend.');
    } finally {
      setIsLoadingIncidents(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (err: any) {
      console.error('Error loading logs:', err);
      setErrorMsg('Failed to fetch real log dataset from backend.');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchLogs();
  }, []);

  const handleAnalyze = async (logId: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const newIncident = await analyzeLog(logId);
      setLatestIncident(newIncident);
      setIncidents((prev) => [newIncident, ...prev]);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMsg(err.message || 'Analysis failed to complete. Check backend service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {errorMsg && (
          <div className="p-4 border border-destructive/40 bg-destructive/10 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Notification</p>
              <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mode Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'live' | 'upload')} className="w-full">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="live" className="text-xs font-medium">
                Live Log Telemetry
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs font-medium">
                Upload & Analyze (PDF / TXT)
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: LIVE LOG TELEMETRY */}
          <TabsContent value="live" className="space-y-6 mt-6">
            <StatsCards incidents={incidents} isLoading={isLoadingIncidents} />

            <LogAnalyzer
              logs={logs}
              isLoadingLogs={isLoadingLogs}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              latestIncident={latestIncident}
              onViewDetails={handleViewIncident}
            />

            <IncidentsTable
              incidents={incidents}
              isLoading={isLoadingIncidents}
              onViewIncident={handleViewIncident}
            />
          </TabsContent>

          {/* TAB 2: UPLOAD & ANALYZE */}
          <TabsContent value="upload" className="space-y-6 mt-6">
            <UploadAnalyzer onViewIncident={handleViewIncident} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Incident Detail Dialog */}
      <IncidentDetailDialog
        incident={selectedIncident}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}

export default App;