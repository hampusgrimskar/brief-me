import { NextResponse } from "next/server";
import { reportStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = reportStore.getReport(id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = reportStore.getReport(id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const body = await request.json();

  // Normalize sections
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeSection = (section: any) => {
    if (section.type === "jsx" && !section.content && section.jsx) {
      return { ...section, content: section.jsx, jsx: undefined };
    }
    if (!section.content && section.text) {
      return { ...section, content: section.text, text: undefined };
    }
    return section;
  };

  // Update fields
  if (body.title) report.title = body.title;
  if (body.summary !== undefined) report.summary = body.summary;
  if (body.sections) report.sections = body.sections.map(normalizeSection);

  // Reset status so user can respond again
  report.status = "pending";

  return NextResponse.json({ id: report.id, status: "updated" });
}
