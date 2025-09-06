"use client";

export function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground text-lg">Loading Dashboard...</p>
        <p className="text-sm text-muted-foreground mt-2">Preparing your AI agent workspace</p>
      </div>
    </div>
  );
}
