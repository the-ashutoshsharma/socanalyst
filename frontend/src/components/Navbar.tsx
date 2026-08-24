export function Navbar() {
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold tracking-tight text-foreground">
            SOC Platform
          </span>
          <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded">
            AI Multi-Agent Security Analysis
          </span>
        </div>
      </div>
    </header>
  );
}
