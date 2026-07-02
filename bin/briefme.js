#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const readline = require("readline");
const http = require("http");

const PROJECT_DIR = path.resolve(__dirname, "..");
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

let reports = [];
let selectedIndex = 0;
let serverReady = false;

// ANSI helpers
const ESC = "\x1b";
const CLEAR = `${ESC}[2J${ESC}[H`;
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;
const RESET = `${ESC}[0m`;
const GREEN = `${ESC}[32m`;
const YELLOW = `${ESC}[33m`;
const CYAN = `${ESC}[36m`;
const INVERSE = `${ESC}[7m`;
const HIDE_CURSOR = `${ESC}[?25l`;
const SHOW_CURSOR = `${ESC}[?25h`;

function render() {
  let output = CLEAR;
  output += `${BOLD}${CYAN}📋 BriefMe${RESET}  ${serverReady ? `${GREEN}● Live${RESET}` : `${YELLOW}● Starting...${RESET}`}\n`;
  output += `${DIM}${"─".repeat(50)}${RESET}\n\n`;

  if (!serverReady) {
    output += `  Starting server...\n`;
  } else if (reports.length === 0) {
    output += `  ${DIM}No briefings yet. Waiting for agents...${RESET}\n`;
  } else {
    reports.forEach((report, i) => {
      const prefix = i === selectedIndex ? `${INVERSE}` : "  ";
      const suffix = i === selectedIndex ? `${RESET}` : "";
      const status = report.status === "pending" ? `${YELLOW}● pending${RESET}` : `${GREEN}✓ responded${RESET}`;
      const time = new Date(report.createdAt).toLocaleTimeString();

      output += `${prefix} ${report.title} ${suffix}\n`;
      output += `  ${DIM}${report.agent} · ${time}${RESET}  ${status}\n\n`;
    });
  }

  output += `\n${DIM}${"─".repeat(50)}${RESET}\n`;
  output += `${DIM}↑/↓ navigate · Enter open in browser · q quit${RESET}\n`;

  process.stdout.write(output);
}

function openInBrowser(reportId) {
  const url = `${BASE_URL}/reports/${reportId}`;
  const openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(openCmd, [url], { detached: true, stdio: "ignore" }).unref();
}

function fetchReports() {
  http.get(`${BASE_URL}/api/reports`, (res) => {
    let data = "";
    res.on("data", (chunk) => data += chunk);
    res.on("end", () => {
      try {
        reports = JSON.parse(data);
        render();
      } catch {}
    });
  }).on("error", () => {});
}

function connectSSE() {
  http.get(`${BASE_URL}/api/events`, (res) => {
    res.on("data", (chunk) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.startsWith("event: connected")) {
          serverReady = true;
          fetchReports();
        }
        if (line.startsWith("data: ") && lines.some(l => l.includes("new-report"))) {
          try {
            const report = JSON.parse(line.slice(6));
            if (report.id) {
              reports.unshift(report);
              render();
              // Bell notification
              process.stdout.write("\x07");
            }
          } catch {}
        }
      }
    });
    res.on("end", () => {
      // Reconnect after 1s
      setTimeout(connectSSE, 1000);
    });
  }).on("error", () => {
    setTimeout(connectSSE, 2000);
  });
}

function startServer() {
  const server = spawn("npm", ["run", "dev"], {
    cwd: PROJECT_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(PORT) },
  });

  server.stdout.on("data", (data) => {
    const str = data.toString();
    if (str.includes("Ready")) {
      serverReady = true;
      render();
      // Connect to SSE for live updates
      setTimeout(connectSSE, 500);
      // Initial fetch
      setTimeout(fetchReports, 500);
      // Refetch every 3s to pick up status changes
      setInterval(fetchReports, 3000);
    }
  });

  server.stderr.on("data", () => {});

  server.on("close", () => {
    process.stdout.write(SHOW_CURSOR);
    process.exit(0);
  });

  return server;
}

// Main
process.stdout.write(HIDE_CURSOR);
render();

const server = startServer();

// Handle keyboard input
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

process.stdin.on("keypress", (str, key) => {
  if (key.name === "q" || (key.ctrl && key.name === "c")) {
    process.stdout.write(SHOW_CURSOR + CLEAR);
    server.kill();
    process.exit(0);
  }

  if (key.name === "up" && selectedIndex > 0) {
    selectedIndex--;
    render();
  }

  if (key.name === "down" && selectedIndex < reports.length - 1) {
    selectedIndex++;
    render();
  }

  if (key.name === "return" && reports.length > 0) {
    openInBrowser(reports[selectedIndex].id);
  }
});

// Cleanup on exit
process.on("SIGINT", () => {
  process.stdout.write(SHOW_CURSOR + CLEAR);
  server.kill();
  process.exit(0);
});
