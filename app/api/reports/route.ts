import { NextResponse } from "next/server";
import { reportStore } from "@/lib/store";
import { Report, ReportSection } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const reports = reportStore.getAllReports();
  return NextResponse.json(reports);
}

export async function POST(request: Request) {
  const body = await request.json();

  // Validate required fields
  if (!body.title || !body.sections || !Array.isArray(body.sections)) {
    return NextResponse.json(
      { error: "Missing required fields: title, sections" },
      { status: 400 }
    );
  }

  // Normalize sections - handle common agent mistakes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections = body.sections.map((section: any) => {
    // Agents sometimes use "jsx" key instead of "content" for jsx type
    if (section.type === "jsx" && !section.content && section.jsx) {
      return { ...section, content: section.jsx, jsx: undefined };
    }
    // Agents sometimes use "text" key instead of "content"
    if (!section.content && section.text) {
      return { ...section, content: section.text, text: undefined };
    }
    return section;
  }) as ReportSection[];

  const report: Report = {
    id: crypto.randomUUID(),
    title: body.title,
    summary: body.summary || undefined,
    agent: body.agent || "Unknown Agent",
    sections,
    createdAt: new Date().toISOString(),
    status: "pending",
    callbackPipe: body.callbackPipe || undefined,
  };

  reportStore.addReport(report);

  return NextResponse.json(
    { id: report.id, status: "created" },
    { status: 201 }
  );
}
