import { Report, ReportResponse } from "./types";

type ReportListener = (report: Report) => void;
type ResponseResolver = (response: ReportResponse) => void;

class ReportStore {
  private reports: Map<string, Report> = new Map();
  private reportListeners: Set<ReportListener> = new Set();
  // Pending resolvers — when user clicks Respond, we resolve the matching promise
  private pendingResolvers: Map<string, ResponseResolver> = new Map();

  addReport(report: Report): void {
    this.reports.set(report.id, report);
    this.notifyReportListeners(report);
  }

  getReport(id: string): Report | undefined {
    return this.reports.get(id);
  }

  getAllReports(): Report[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Called by the tool — returns a promise that resolves when user responds
  waitForResponse(reportId: string): Promise<ReportResponse> {
    return new Promise((resolve) => {
      this.pendingResolvers.set(reportId, resolve);
    });
  }

  // Called when user clicks Respond — resolves the waiting tool
  submitResponse(reportId: string, response: ReportResponse): void {
    const report = this.reports.get(reportId);
    if (report) {
      report.status = "responded";
    }

    const resolver = this.pendingResolvers.get(reportId);
    if (resolver) {
      resolver(response);
      this.pendingResolvers.delete(reportId);
    }
  }

  hasPendingResolver(reportId: string): boolean {
    return this.pendingResolvers.has(reportId);
  }

  // Subscribe to new reports (for SSE/dashboard)
  subscribe(listener: ReportListener): () => void {
    this.reportListeners.add(listener);
    return () => this.reportListeners.delete(listener);
  }

  private notifyReportListeners(report: Report): void {
    for (const listener of this.reportListeners) {
      listener(report);
    }
  }
}

// Singleton - survives hot reloads in development
const globalForStore = globalThis as unknown as { reportStore: ReportStore };
export const reportStore = globalForStore.reportStore ?? new ReportStore();
globalForStore.reportStore = reportStore;
