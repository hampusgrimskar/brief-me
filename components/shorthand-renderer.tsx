"use client";

import { ReportSection } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { SyntaxHighlighter } from "@/components/syntax-highlighter";
import { DiffHighlighter } from "@/components/diff-highlighter";

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

  return null;
}
