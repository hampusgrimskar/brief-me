"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReportSection } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { SyntaxHighlighter } from "@/components/syntax-highlighter";
import { DiffHighlighter } from "@/components/diff-highlighter";
import { MermaidRenderer } from "@/components/mermaid-renderer";

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
    const variantStyles: Record<string, string> = {
      default: "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20",
      info: "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20",
      success: "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20",
      warning: "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20",
      error: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
      critical: "border-orange-300 bg-orange-50/60 dark:border-orange-700 dark:bg-orange-950/30",
    };
    const style = variantStyles[section.variant || "default"] || variantStyles.default;

    return (
      <Card className={style}>
        <CardHeader>
          {section.title && <CardTitle>{section.title}</CardTitle>}
          {section.subtitle && <CardDescription>{section.subtitle}</CardDescription>}
        </CardHeader>
        {section.content && (
          <CardContent>
            <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  if (section.type === "info") {
    const variantStyles: Record<string, string> = {
      default: "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20",
      info: "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20",
      success: "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20",
      warning: "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20",
      error: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
      critical: "border-orange-300 bg-orange-50/60 dark:border-orange-700 dark:bg-orange-950/30",
    };
    const style = variantStyles[section.variant || "default"] || variantStyles.default;

    return (
      <div className={`rounded-lg border p-4 ${style}`}>
        {section.title && <p className="font-semibold mb-1">{section.title}</p>}
        {section.content && (
          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
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
          <SyntaxHighlighter code={section.content || ""} language={section.language} />
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
                <div key={i} className={`px-4 py-0.5 ${bgClass} ${textClass} whitespace-pre border-b border-border/30 last:border-b-0`}>
                  {line}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (section.type === "tabs" && section.tabs) {
    return (
      <Card>
        {section.title && (
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Tabs defaultValue={section.tabs[0]?.label}>
            <TabsList>
              {section.tabs.map((tab) => (
                <TabsTrigger key={tab.label} value={tab.label}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {section.tabs.map((tab) => (
              <TabsContent key={tab.label} value={tab.label}>
                <div className="whitespace-pre-wrap pt-2">{tab.content}</div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  if (section.type === "accordion" && section.items) {
    return (
      <Card>
        {section.title && (
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Accordion className="w-full">
            {section.items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{item.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="whitespace-pre-wrap">{item.content}</div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    );
  }

  if (section.type === "progress") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            {section.title && <span className="text-sm font-medium">{section.title}</span>}
            {section.label && <span className="text-sm text-muted-foreground">{section.label}</span>}
          </div>
          <Progress value={section.value || 0} />
        </CardContent>
      </Card>
    );
  }

  if (section.type === "mermaid" && section.content) {
    return (
      <Card>
        {section.title && (
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <MermaidRenderer chart={section.content} />
        </CardContent>
      </Card>
    );
  }

  if (section.type === "steps" && section.steps) {
    return (
      <Card>
        {section.title && (
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="relative">
            {section.steps.map((step, i) => (
              <div key={i} className="flex gap-4 pb-6 last:pb-0">
                {/* Vertical line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {i + 1}
                  </div>
                  {i < section.steps!.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-2" />
                  )}
                </div>
                {/* Content */}
                <div className="pt-1">
                  <p className="font-medium">{step.title}</p>
                  {step.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
