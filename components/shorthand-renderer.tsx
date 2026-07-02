"use client";

import { ReportSection } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ShorthandRendererProps {
  section: ReportSection;
}

export function ShorthandRenderer({ section }: ShorthandRendererProps) {
  if (section.type === "table") {
    return (
      <Card>
        {section.title && (
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Table>
            {section.headers && (
              <TableHeader>
                <TableRow>
                  {section.headers.map((header, i) => (
                    <TableHead key={i}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            )}
            {section.rows && (
              <TableBody>
                {section.rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (section.type === "card") {
    return (
      <Card>
        <CardHeader>
          {section.title && <CardTitle>{section.title}</CardTitle>}
          {section.subtitle && <CardDescription>{section.subtitle}</CardDescription>}
        </CardHeader>
        {section.content && (
          <CardContent>
            <div className="whitespace-pre-wrap">{section.content}</div>
          </CardContent>
        )}
      </Card>
    );
  }

  if (section.type === "info") {
    return (
      <Alert>
        {section.title && <AlertTitle>{section.title}</AlertTitle>}
        {section.content && <AlertDescription>{section.content}</AlertDescription>}
      </Alert>
    );
  }

  if (section.type === "code") {
    return (
      <Card>
        {section.title && (
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
            <code className="text-sm">{section.content}</code>
          </pre>
        </CardContent>
      </Card>
    );
  }

  if (section.type === "diff") {
    const lines = (section.content || "").split("\n");
    return (
      <Card>
        {section.title && (
          <CardHeader>
            <CardTitle className="text-base font-mono">{section.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto font-mono text-sm">
            {lines.map((line, i) => {
              let bgClass = "";
              let textClass = "text-foreground";
              let prefix = " ";

              if (line.startsWith("+") && !line.startsWith("+++")) {
                bgClass = "bg-green-100 dark:bg-green-950/40";
                textClass = "text-green-900 dark:text-green-200";
                prefix = "+";
              } else if (line.startsWith("-") && !line.startsWith("---")) {
                bgClass = "bg-red-100 dark:bg-red-950/40";
                textClass = "text-red-900 dark:text-red-200";
                prefix = "-";
              } else if (line.startsWith("@@")) {
                bgClass = "bg-blue-50 dark:bg-blue-950/30";
                textClass = "text-blue-700 dark:text-blue-300";
                prefix = "";
              } else if (line.startsWith("---") || line.startsWith("+++")) {
                bgClass = "bg-muted";
                textClass = "text-muted-foreground font-bold";
                prefix = "";
              }

              return (
                <div key={i} className={`px-4 py-0.5 ${bgClass} ${textClass} whitespace-pre border-b border-border/30 last:border-b-0`}>
                  {prefix && line.startsWith(prefix) ? line : (prefix === " " ? " " + line : line)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
