#!/usr/bin/env node

const path = require("path");
const { spawn } = require("child_process");

const tsxPath = path.resolve(__dirname, "..", "node_modules", ".bin", "tsx");
const serverPath = path.resolve(__dirname, "..", "mcp-server.ts");

// Spawn tsx with stdin/stdout connected to parent (MCP protocol uses these)
const child = spawn(tsxPath, [serverPath], {
  stdio: ["pipe", "pipe", "inherit"],
  env: process.env,
});

// Pipe parent stdin to child stdin (MCP requests from agent)
process.stdin.pipe(child.stdin);

// Pipe child stdout to parent stdout (MCP responses to agent)
child.stdout.pipe(process.stdout);

child.on("close", (code) => process.exit(code || 0));
child.on("error", (err) => {
  process.stderr.write(`Failed to start BriefMe MCP server: ${err.message}\n`);
  process.exit(1);
});
