import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { LogAnalyzer } from './components/LogAnalyzer';
import { IncidentsTable } from './components/IncidentsTable';
import { IncidentDetailDialog } from './components/IncidentDetailDialog';
import { getIncidents, getLogs, analyzeLog } from './lib/api';
import { Incident, LogEntry } from './types';

function App() {
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
          <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive-foreground rounded-xl text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Summary Metrics */}
        <StatsCards incidents={incidents} isLoading={isLoadingIncidents} />

        {/* Live Analysis Execution Section */}
        <LogAnalyzer
          logs={logs}
          isLoadingLogs={isLoadingLogs}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          latestIncident={latestIncident}
          onViewDetails={handleViewIncident}
        />

        {/* Historical Incidents Table */}
        <IncidentsTable
          incidents={incidents}
          isLoading={isLoadingIncidents}
          onViewIncident={handleViewIncident}
        />
      </main>

      {/* Incident Detail Modal / Tabs Breakdown */}
      <IncidentDetailDialog
        incident={selectedIncident}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}

export default App;
