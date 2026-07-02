#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import http from "http";

const BASE_URL = process.env.BRIEFME_URL || "http://localhost:3000";

// Helper to make HTTP requests
function httpRequest(method: string, path: string, body?: unknown): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 500, data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Wait for a report response — calls the blocking GET endpoint
function waitForResponse(reportId: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const url = new URL(`/api/reports/${reportId}/response`, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

// Create MCP server
const server = new McpServer({
  name: "briefme",
  version: "0.2.0",
});

// Tool: publish_report — publishes and waits for user response
server.tool(
  "publish_report",
  "Publish an interactive report to the BriefMe dashboard and wait for the user's response. Use this instead of writing long text responses. The tool blocks until the user makes their decisions and clicks Respond.",
  {
    title: z.string().describe("Report title"),
    summary: z.string().optional().describe("One-line summary for the dashboard list"),
    agent: z.string().optional().describe("Your agent name"),
    sections: z.array(z.object({
      type: z.enum(["table", "card", "info", "code", "diff", "markdown", "jsx", "decision", "tabs", "accordion", "progress"]).describe("Section type"),
      title: z.string().optional().describe("Section title (for table, card, info, code, diff)"),
      subtitle: z.string().optional().describe("Subtitle (for card)"),
      content: z.string().optional().describe("Content (for markdown, jsx, card, info, code, diff)"),
      headers: z.array(z.string()).optional().describe("Table headers"),
      rows: z.array(z.array(z.string())).optional().describe("Table rows"),
      language: z.string().optional().describe("Code language"),
      tabs: z.array(z.object({ label: z.string(), content: z.string() })).optional().describe("Tab items (for tabs type)"),
      items: z.array(z.object({ title: z.string(), content: z.string() })).optional().describe("Accordion items (for accordion type)"),
      value: z.number().optional().describe("Progress value 0-100 (for progress type)"),
      label: z.string().optional().describe("Progress label (for progress type)"),
      decision: z.object({
        id: z.string().describe("Unique decision ID"),
        type: z.enum(["single-select", "multi-select", "confirm", "text"]).describe("Decision type"),
        label: z.string().describe("Question label"),
        description: z.string().optional().describe("Additional context"),
        options: z.array(z.string()).optional().describe("Options for select types"),
      }).optional().describe("Decision config (for decision type)"),
    })).describe("Report sections"),
  },
  async (params) => {
    // Publish the report
    const { status, data } = await httpRequest("POST", "/api/reports", {
      title: params.title,
      summary: params.summary,
      agent: params.agent || "AI Agent",
      sections: params.sections,
    });

    if (status !== 201) {
      return {
        content: [{ type: "text", text: `Failed to publish report: ${JSON.stringify(data)}` }],
        isError: true,
      };
    }

    const { id } = data as { id: string };

    // Wait for user response (blocks until they click Respond)
    const response = await waitForResponse(id);

    return {
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
    };
  }
);

// Tool: update_report — updates an existing report and waits for new response
server.tool(
  "update_report",
  "Update an existing report with revised content and wait for the user's new response. Use this after receiving feedback/comments to publish a revised version of the same report. The report resets to pending and blocks until the user responds again.",
  {
    reportId: z.string().describe("The ID of the report to update (from previous publish_report result)"),
    title: z.string().optional().describe("Updated title (optional)"),
    summary: z.string().optional().describe("Updated summary (optional)"),
    sections: z.array(z.object({
      type: z.enum(["table", "card", "info", "code", "diff", "markdown", "jsx", "decision", "tabs", "accordion", "progress"]).describe("Section type"),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      content: z.string().optional(),
      headers: z.array(z.string()).optional(),
      rows: z.array(z.array(z.string())).optional(),
      language: z.string().optional(),
      tabs: z.array(z.object({ label: z.string(), content: z.string() })).optional(),
      items: z.array(z.object({ title: z.string(), content: z.string() })).optional(),
      value: z.number().optional(),
      label: z.string().optional(),
      decision: z.object({
        id: z.string(),
        type: z.enum(["single-select", "multi-select", "confirm", "text"]),
        label: z.string(),
        description: z.string().optional(),
        options: z.array(z.string()).optional(),
      }).optional(),
    })).describe("Updated report sections"),
  },
  async (params) => {
    const body: Record<string, unknown> = { sections: params.sections };
    if (params.title) body.title = params.title;
    if (params.summary) body.summary = params.summary;

    const { status, data } = await httpRequest("PUT", `/api/reports/${params.reportId}`, body);

    if (status !== 200) {
      return {
        content: [{ type: "text", text: `Failed to update report: ${JSON.stringify(data)}` }],
        isError: true,
      };
    }

    // Wait for user response on the updated report
    const response = await waitForResponse(params.reportId);

    return {
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
