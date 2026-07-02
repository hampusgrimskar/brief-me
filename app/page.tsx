"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Report } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Fetch initial reports
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => setReports(data));

    // Connect to SSE for live updates
    const eventSource = new EventSource("/api/events");

    eventSource.addEventListener("connected", () => {
      setConnected(true);
    });

    eventSource.addEventListener("new-report", (event) => {
      const report: Report = JSON.parse(event.data);
      setReports((prev) => [report, ...prev]);

      // Browser notification
      if (Notification.permission === "granted") {
        new Notification(`New briefing from ${report.agent}`, {
          body: report.title,
        });
      }
    });

    eventSource.onerror = () => {
      setConnected(false);
    };

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => eventSource.close();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">BriefMe</h1>
            <span className="text-sm text-muted-foreground">
              Agent Briefings Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {connected ? "Live" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {reports.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-medium text-muted-foreground mb-2">
              No briefings yet
            </h2>
            <p className="text-sm text-muted-foreground">
              When an AI agent publishes a report, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-3xl mx-auto">
            {reports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <Badge
                        variant={
                          report.status === "pending" ? "default" : "secondary"
                        }
                      >
                        {report.status === "pending"
                          ? "Awaiting Response"
                          : "Responded"}
                      </Badge>
                    </div>
                    <CardDescription>
                      From {report.agent} &middot;{" "}
                      {new Date(report.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  {report.summary && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {report.summary}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
