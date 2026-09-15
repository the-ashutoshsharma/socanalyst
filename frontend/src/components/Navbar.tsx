export function Navbar() {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center">
              <span className="text-sm font-bold text-foreground">S</span>
            </div>

            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                SOC Platform
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Security Operations Center
              </p>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-px bg-border" />

          <span className="hidden sm:inline-flex text-xs text-muted-foreground border border-border bg-background px-2.5 py-1 rounded-md">
            AI Multi-Agent Security Analysis
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="hidden sm:inline">Workspace active</span>
        </div>
      </div>
    </header>
  );
}