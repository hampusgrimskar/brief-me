"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface DiffHighlighterProps {
  code: string;
  language?: string;
}

export function DiffHighlighter({ code, language }: DiffHighlighterProps) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    // Detect language from the diff content (strip +/- prefixes to detect)
    const lang = language || detectLanguageFromDiff(code);

    codeToHtml(code, {
      lang: "diff",
      theme: "github-light",
    })
      .then(setHtml)
      .catch(() => setHtml(""));
  }, [code, language]);

  if (!html) {
    // Fallback: manual coloring without syntax highlighting
    const lines = code.split("\n");
    return (
      <div className="rounded-lg border overflow-x-auto font-mono text-sm">
        {lines.map((line, i) => {
          let bgClass = "";
          let textClass = "text-foreground";

          if (line.startsWith("+") && !line.startsWith("+++")) {
            bgClass = "bg-green-100 dark:bg-green-950/40";
            textClass = "text-green-900 dark:text-green-200";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            bgClass = "bg-red-100 dark:bg-red-950/40";
            textClass = "text-red-900 dark:text-red-200";
          } else if (line.startsWith("@@")) {
            bgClass = "bg-blue-50 dark:bg-blue-950/30";
            textClass = "text-blue-700 dark:text-blue-300";
          } else if (line.startsWith("---") || line.startsWith("+++")) {
            bgClass = "bg-muted";
            textClass = "text-muted-foreground font-bold";
          }

          return (
            <div key={i} className={`px-4 py-0.5 ${bgClass} ${textClass} whitespace-pre`}>
              {line}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-x-auto text-sm [&_pre]:p-4 [&_pre]:bg-muted [&_pre]:rounded-lg [&_.line.diff.add]:bg-green-100 [&_.line.diff.remove]:bg-red-100"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function detectLanguageFromDiff(code: string): string {
  // Look at the filename in --- a/... line
  const fileMatch = code.match(/---\s+a\/(.+)/);
  if (fileMatch) {
    const ext = fileMatch[1].split(".").pop();
    const extMap: Record<string, string> = {
      ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
      py: "python", rs: "rust", go: "go", java: "java",
      rb: "ruby", php: "php", css: "css", html: "html",
      yaml: "yaml", yml: "yaml", json: "json", sql: "sql",
      sh: "bash", bash: "bash", md: "markdown",
    };
    if (ext && extMap[ext]) return extMap[ext];
  }
  return "diff";
}
