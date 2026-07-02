"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Report, DecisionResponse, InlineComment } from "@/lib/types";
import { DecisionField } from "@/components/decision-field";
import { DynamicRenderer } from "@/components/dynamic-renderer";
import { ShorthandRenderer } from "@/components/shorthand-renderer";
import { InlineComments } from "@/components/inline-comments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [decisions, setDecisions] = useState<
    Record<string, string | string[] | boolean>
  >({});
  const [comment, setComment] = useState("");
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    const fetchReport = () => {
      fetch(`/api/reports/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.sections) {
            setReport(data);
            if (data.status === "pending" && submitted) {
              // Report was updated — reset for new response
              setSubmitted(false);
              setDecisions({});
              setInlineComments([]);
              setComment("");
            } else if (data.status === "responded") {
              setSubmitted(true);
            }
          }
        });
    };

    fetchReport();

    // Poll for updates every 3s
    const interval = setInterval(fetchReport, 3000);
    return () => clearInterval(interval);
  }, [params.id, submitted]);

  const handleSubmit = async () => {
    if (!report) return;

    setSubmitting(true);

    const decisionResponses: DecisionResponse[] = Object.entries(decisions).map(
      ([decisionId, value]) => ({
        decisionId,
        value,
      })
    );

    const res = await fetch(`/api/reports/${report.id}/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisions: decisionResponses,
        comments: inlineComments,
        comment: comment || undefined,
      }),
    });

    if (res.ok) {
      setSubmitted(true);
    }

    setSubmitting(false);
  };

  if (!report || !report.sections) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to dashboard
          </button>
          <Badge
            variant={report.status === "pending" ? "default" : "secondary"}
          >
            {report.status === "pending" ? "Awaiting Response" : "Responded"}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{report.title}</h1>
          <p className="text-sm text-muted-foreground">
            From {report.agent} &middot;{" "}
            {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="space-y-6">
          {report.sections.map((section, index) => {
            if (section.type === "markdown" && section.content) {
              return (
                <div key={index} data-section-index={index}>
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.content}
                    </ReactMarkdown>
                  </div>
                  <InlineComments
                    sectionIndex={index}
                    comments={inlineComments}
                    onAddComment={(c) => setInlineComments((prev) => [...prev, c])}
                    onRemoveComment={(i) => setInlineComments((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={submitted}
                  />
                </div>
              );
            }

            if (section.type === "jsx" && section.content) {
              return (
                <div key={index} data-section-index={index}>
                  <DynamicRenderer jsx={section.content} />
                  <InlineComments
                    sectionIndex={index}
                    comments={inlineComments}
                    onAddComment={(c) => setInlineComments((prev) => [...prev, c])}
                    onRemoveComment={(i) => setInlineComments((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={submitted}
                  />
                </div>
              );
            }

            if (section.type === "table" || section.type === "card" || section.type === "info" || section.type === "code" || section.type === "diff" || section.type === "tabs" || section.type === "accordion" || section.type === "progress") {
              return (
                <div key={index} data-section-index={index}>
                  <ShorthandRenderer section={section} />
                  <InlineComments
                    sectionIndex={index}
                    comments={inlineComments}
                    onAddComment={(c) => setInlineComments((prev) => [...prev, c])}
                    onRemoveComment={(i) => setInlineComments((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={submitted}
                  />
                </div>
              );
            }

            if (section.type === "decision" && section.decision) {
              return (
                <DecisionField
                  key={section.decision.id}
                  decision={section.decision}
                  value={decisions[section.decision.id]}
                  onChange={(value) =>
                    setDecisions((prev) => ({
                      ...prev,
                      [section.decision!.id]: value,
                    }))
                  }
                  disabled={submitted}
                />
              );
            }

            return null;
          })}
        </div>

        {!submitted && (
          <>
            <Separator className="my-8" />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Additional comments (optional)
                </label>
                <Textarea
                  placeholder="Any additional feedback or context..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="w-full"
              >
                {submitting ? "Sending..." : "Respond"}
              </Button>
            </div>
          </>
        )}

        {submitted && (
          <div className="mt-8 p-4 rounded-lg bg-muted text-center">
            <p className="text-sm font-medium">
              ✓ Response sent. The agent can now continue.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
