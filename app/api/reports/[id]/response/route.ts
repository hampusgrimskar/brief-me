import { NextResponse } from "next/server";
import { reportStore } from "@/lib/store";
import { ReportResponse } from "@/lib/types";
import { writeFile } from "fs/promises";

export const dynamic = "force-dynamic";

// MCP server or agent calls this — blocks until user responds
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = reportStore.getReport(id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.status === "responded") {
    return NextResponse.json({ status: "already_responded" });
  }

  // Block until user responds (resolves the promise)
  const response = await reportStore.waitForResponse(id);
  return NextResponse.json(response);
}

// User submits their decisions — resolves the waiting tool call
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = reportStore.getReport(id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.status === "responded") {
    return NextResponse.json(
      { error: "Already responded to this report" },
      { status: 409 }
    );
  }

  const body = await request.json();

  const response: ReportResponse = {
    reportId: id,
    decisions: body.decisions || [],
    comments: body.comments || [],
    comment: body.comment || undefined,
    respondedAt: new Date().toISOString(),
  };

  // This resolves the waiting MCP tool call
  reportStore.submitResponse(id, response);

  // Also write to callback pipe if shell fallback was used
  if (report.callbackPipe) {
    try {
      await writeFile(report.callbackPipe, JSON.stringify(response) + "\n");
    } catch (err) {
      console.error("Failed to write to callback pipe:", err);
    }
  }

  return NextResponse.json({ status: "responded", response });
}
