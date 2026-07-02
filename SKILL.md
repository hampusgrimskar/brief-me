---
name: briefme
description: Publish rich, interactive reports to a local web dashboard for the user to review and respond to. Use when you need to present findings, comparisons, or decisions that benefit from rich formatting rather than plain terminal text. The user sees reports with styled tables, cards, and clickable decision buttons, then responds with structured choices you can poll for.
compatibility: Requires BriefMe server running at http://localhost:3000. Start with `briefme` CLI command. MCP server available via `briefme-mcp`.
metadata:
  author: Hampus Grimskar
  version: "0.3.0"
---

# BriefMe

Publish interactive reports to the user's local dashboard instead of dumping long text in the terminal.

## CRITICAL RULES

1. **NEVER write walls of text**. Break content into multiple short sections using the component types below. Each section should be scannable at a glance.
2. **Use the right component for the content**:
   - Comparisons / data → `table`
   - Key findings / summaries / explanations → `card` (keep content to 2-4 lines)
   - Warnings / recommendations / conclusions → `info`
   - Source code / file contents → `code`
   - Code changes → `diff`
   - Flow charts / architecture / sequences → `mermaid`
   - Sequential processes / pipelines → `steps`
   - Related alternatives / variations → `tabs`
   - Detailed breakdowns / optional depth → `accordion`
   - Status / progress / metrics → `progress`
   - User choices → `decision`
   - Short connective text (1-2 sentences max) → `markdown`
   - Use `variant` on cards/info for color: `info` (blue), `success` (green), `warning` (yellow), `error` (red)
3. **Structure for scannability**: Aim for 3-8 sections per report. Each section conveys ONE idea. If a section exceeds 5 lines, split it.
4. **Never use `markdown` for code, tables, or structured data**. Use the dedicated types instead. `markdown` is only for brief connective prose between components.
5. **Never dump text in chat**: Use `publish_report` for all information. Only reply in chat with short confirmations (1-2 sentences).
6. **After receiving a response**: Use `publish_report` or `update_report`. Do NOT write text in chat.

### ❌ BAD — wall of text in one section:
```json
[
  {"type": "markdown", "content": "## Analysis\n\nThe entry point is X which checks condition Y. Here's the code:\n```java\nswitch(x) { case A: ... }\n```\nThis means that Z happens because... [long explanation continues]"}
]
```

### ✅ GOOD — structured, scannable, interactive:
```json
[
  {"type": "card", "title": "Entry Point", "content": "ConvergedChargingService routes NON_PROVISIONED to AbandonSessionBridgeFlowAction"},
  {"type": "code", "title": "determineChargingScenario()", "content": "switch (request.getChargingScenario()) {\n  case EXTERNAL: return EXTERNAL_KEY;\n  case INTERNAL: return INTERNAL_KEY;\n  default: throw new IllegalArgumentException(...);\n}"},
  {"type": "info", "title": "Bug Found", "content": "NON_PROVISIONED hits the default case → throws IllegalArgumentException"},
  {"type": "decision", "decision": {"id": "next", "type": "single-select", "label": "What to explore next?", "options": ["EXTERNAL path details", "Verify if this can trigger in production", "Done — this is sufficient"]}}
]
```

## MCP Tools

### `publish_report` (blocks until user responds)

Publishes a report and waits. Returns the user's decisions when they click Respond.

### `update_report` (revise and wait again)

Updates an existing report with revised content. The report resets to pending and blocks until the user responds to the new version. Use after receiving inline comments.

Requires: `reportId` (from the previous `publish_report` result) and new `sections`.

## Understanding the Response

```json
{
  "reportId": "uuid",
  "decisions": [{"decisionId": "x", "value": "chosen option"}],
  "comments": [
    {"selectedText": "text user highlighted", "comment": "their feedback", "sectionIndex": 2}
  ],
  "comment": "optional general comment",
  "respondedAt": "..."
}
```

**Inline comments**: Users select text and press `c` to comment. When you receive comments, use `update_report` to revise and address their feedback.

## Section Types

### `table`
```json
{"type": "table", "title": "Options", "headers": ["Name", "Speed"], "rows": [["Express", "Good"], ["Hono", "Excellent"]]}
```

### `card`
```json
{"type": "card", "title": "Summary", "subtitle": "Optional subtitle", "content": "Short explanation (2-4 lines max)"}
```

### `info`
```json
{"type": "info", "title": "Recommendation", "content": "Use Hono for performance."}
```

### `code`
```json
{"type": "code", "title": "src/index.ts", "content": "const app = new Hono();\napp.get('/', (c) => c.text('Hello'));"}
```

### `diff`
```json
{"type": "diff", "title": "src/users.ts", "content": "--- a/src/users.ts\n+++ b/src/users.ts\n@@ -1,3 +1,3 @@\n-function old() {\n+async function new() {\n   return data;\n }"}
```

### `decision`
```json
{"type": "decision", "decision": {"id": "x", "type": "single-select", "label": "Question?", "options": ["A", "B"]}}
```
Types: `single-select`, `multi-select`, `confirm`, `text`

### `tabs` (use for related content the user can switch between)
```json
{"type": "tabs", "title": "Implementation Options", "tabs": [
  {"label": "Option A", "content": "Use a microservices architecture with event-driven communication."},
  {"label": "Option B", "content": "Use a monolith with modular boundaries and shared database."},
  {"label": "Option C", "content": "Use serverless functions with API Gateway."}
]}
```

### `accordion` (use for expandable details — keeps report compact)
```json
{"type": "accordion", "title": "Detailed Findings", "items": [
  {"title": "Authentication Flow", "content": "The auth flow uses OAuth2 with PKCE..."},
  {"title": "Database Schema", "content": "Three tables: users, sessions, tokens..."},
  {"title": "API Endpoints", "content": "POST /login, POST /refresh, DELETE /logout"}
]}
```

### `progress` (use for status/completion indicators)
```json
{"type": "progress", "title": "Migration Progress", "label": "3/5 complete", "value": 60}
```

### `mermaid` (use for flowcharts, sequence diagrams, architecture)
```json
{"type": "mermaid", "title": "Request Flow", "content": "graph LR\n  A[Client] --> B[API Gateway]\n  B --> C[Auth Service]\n  B --> D[Core Service]\n  D --> E[(Database)]"}
```

Supports all mermaid syntax: `graph`, `sequenceDiagram`, `classDiagram`, `stateDiagram`, `erDiagram`, `gantt`, `pie`, etc.

### `steps` (use for sequential processes / pipelines)
```json
{"type": "steps", "title": "Request Pipeline", "steps": [
  {"title": "validateRequestType", "description": "Checks incoming DIAMETER message type"},
  {"title": "populateConsumptionHeader", "description": "Extracts subscriber and service data"},
  {"title": "populateSessionRecords", "description": "Loads session state from cache"},
  {"title": "routeToBackend", "description": "Sends to Core via AkkaBackend"}
]}
```

### Color variants (for `card` and `info` types)

Add `"variant"` to make sections visually distinct:
```json
{"type": "card", "variant": "success", "title": "Tests Passing", "content": "All 47 tests pass."}
{"type": "card", "variant": "warning", "title": "Performance", "content": "Response time increased 20%."}
{"type": "card", "variant": "error", "title": "Bug Found", "content": "NPE in production."}
{"type": "card", "variant": "info", "title": "Note", "content": "This is FYI only."}
```

Variants: `default`, `info` (blue), `success` (green), `warning` (yellow), `error` (red)

### `markdown` (ONLY for 1-2 sentence connective text)
```json
{"type": "markdown", "content": "Based on the above, here are two options:"}
```

### `jsx` (use sparingly — high token cost)

Raw JSX with shadcn components. Only when shorthand types can't express what you need.

Components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Separator`, `ScrollArea`, `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Badge`, `Alert`, `AlertTitle`, `AlertDescription`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`, `Progress`, `Button`, `Label`, `Checkbox`, `RadioGroup`, `RadioGroupItem`, `Switch`, `Toggle`, `Textarea`, `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Popover`, `PopoverTrigger`, `PopoverContent`, `Avatar`, `AvatarImage`, `AvatarFallback`, `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`, `HoverCard`, `HoverCardTrigger`, `HoverCardContent`, `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`, `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator`, `BreadcrumbPage`, `Skeleton`

## MCP Server Setup

```json
{"mcpServers": {"briefme": {"command": "briefme-mcp"}}}
```

## Shell Fallback (if MCP not available)

```bash
PIPE="/tmp/briefme-$$" && mkfifo "$PIPE" && \
curl -s -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"title": "...", "callbackPipe": "'"$PIPE"'", "sections": [...]}' && \
cat "$PIPE" && rm "$PIPE"
```
