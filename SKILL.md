---
name: briefme
description: Publish rich, interactive reports to a local web dashboard for the user to review and respond to. Use when you need to present findings, comparisons, or decisions that benefit from rich formatting rather than plain terminal text. The user sees reports with styled tables, cards, and clickable decision buttons, then responds with structured choices you can poll for.
compatibility: Requires BriefMe server running at http://localhost:3000. Start with `briefme` CLI command. MCP server available via `briefme-mcp`.
metadata:
  author: Hampus Grimskar
  version: "0.2.0"
---

# BriefMe

Publish interactive reports to the user's local dashboard instead of dumping long text in the terminal.

## CRITICAL RULES

1. **Use the `publish_report` tool** to present information and collect decisions. It blocks until the user responds.
2. **Never dump text in chat**: If you have structured information, comparisons, options, or follow-ups, use `publish_report`. Only use plain chat for short confirmations (1-2 sentences max).
3. **After receiving a response**: If you have follow-up information or more decisions, call `publish_report` again. Do NOT write a wall of text summarizing what they chose.

## MCP Tools

### `publish_report` (blocks until user responds)

Publishes a report and waits. Returns the user's decisions when they click Respond.

### `update_report` (revise and wait again)

Updates an existing report with revised content. The report resets to pending and the tool blocks until the user responds to the new version. Use this after receiving inline comments to publish a revision.

Requires: `reportId` (from the previous `publish_report` result) and new `sections`.

## Understanding the Response

The response from `publish_report` and `update_report` includes:

```json
{
  "reportId": "uuid",
  "decisions": [{"decisionId": "x", "value": "chosen option"}],
  "comments": [
    {
      "selectedText": "the text the user highlighted",
      "comment": "their feedback on that specific part",
      "sectionIndex": 2
    }
  ],
  "comment": "optional general comment",
  "respondedAt": "..."
}
```

### Inline comments

Users can select any text in your report and press `c` to leave a comment on it. The `comments` array contains these. Each has:
- `selectedText` — what they highlighted
- `comment` — their feedback
- `sectionIndex` — which section (0-indexed) it refers to

**When you receive comments**: use `update_report` to revise the report addressing their feedback, then wait for their approval.

## Section Types

### `table` (use for comparisons — compact)

```json
{"type": "table", "title": "Options", "headers": ["Name", "Speed"], "rows": [["Express", "Good"], ["Hono", "Excellent"]]}
```

### `card` (titled content block)

```json
{"type": "card", "title": "Summary", "subtitle": "Optional subtitle", "content": "Text content here"}
```

### `info` (callout/alert)

```json
{"type": "info", "title": "Recommendation", "content": "Use Hono for performance."}
```

### `code` (code blocks)

```json
{"type": "code", "title": "src/index.ts", "content": "const app = new Hono();\napp.get('/', (c) => c.text('Hello'));"}
```

### `diff` (unified diffs — renders like GitHub with green/red lines)

```json
{"type": "diff", "title": "src/users.ts", "content": "--- a/src/users.ts\n+++ b/src/users.ts\n@@ -1,3 +1,3 @@\n-function old() {\n+async function new() {\n   return data;\n }"}
```

### `decision` (interactive choice — only in publish_report)

Types: `single-select`, `multi-select`, `confirm`, `text`

```json
{"type": "decision", "decision": {"id": "framework", "type": "single-select", "label": "Which framework?", "options": ["Express", "Hono"]}}
```

### `markdown` (simple text)

```json
{"type": "markdown", "content": "Some **bold** text."}
```

### `jsx` (full control — use sparingly, high token cost)

Write raw JSX with shadcn components when shorthand types can't express what you need.

Available components:

- **Layout:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Separator`, `ScrollArea`, `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- **Data:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Badge`, `Avatar`, `AvatarImage`, `AvatarFallback`, `Progress`, `Skeleton`
- **Feedback:** `Alert`, `AlertTitle`, `AlertDescription`, `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`, `HoverCard`, `HoverCardTrigger`, `HoverCardContent`
- **Navigation:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator`, `BreadcrumbPage`, `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- **Overlays:** `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Popover`, `PopoverTrigger`, `PopoverContent`
- **Form:** `Button`, `Label`, `Checkbox`, `RadioGroup`, `RadioGroupItem`, `Switch`, `Toggle`, `Textarea`
- **HTML:** All standard elements (`p`, `h1`-`h6`, `strong`, `em`, `ul`, `li`, `code`, `pre`, `div`, `span`, etc.)

## MCP Server Setup

Add to your agent's MCP config:

```json
{
  "mcpServers": {
    "briefme": {
      "command": "briefme-mcp"
    }
  }
}
```

## Tips

1. Prefer `table`, `card`, `info`, `code`, `diff` — they use far fewer tokens than `jsx`.
2. Only use `jsx` for complex layouts that shorthand can't handle.
3. After getting a response, publish another report for follow-ups.
4. Keep decisions focused — one clear question per decision.
5. Use `summary` — it appears in the dashboard list so the user can prioritize.

## Shell Fallback (if MCP is not available)

```bash
PIPE="/tmp/briefme-$$" && mkfifo "$PIPE" && \
curl -s -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Report Title",
    "summary": "Summary",
    "agent": "Agent",
    "callbackPipe": "'"$PIPE"'",
    "sections": [...]
  }' && \
cat "$PIPE" && rm "$PIPE"
```
