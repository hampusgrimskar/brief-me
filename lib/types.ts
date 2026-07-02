export type DecisionType = "single-select" | "multi-select" | "text" | "confirm";

export interface Decision {
  id: string;
  type: DecisionType;
  label: string;
  description?: string;
  options?: string[]; // for single-select and multi-select
  required?: boolean;
}

export interface ReportSection {
  type: "markdown" | "jsx" | "decision" | "table" | "card" | "info" | "code" | "diff" | "tabs" | "accordion" | "progress" | "mermaid" | "steps";
  content?: string; // for markdown, jsx, card, info, code, diff, mermaid sections
  decision?: Decision; // for decision sections
  // table shorthand
  title?: string; // for table, card, info, code, diff, accordion items
  subtitle?: string; // for card
  headers?: string[]; // for table
  rows?: string[][]; // for table
  // code shorthand
  language?: string; // for code
  // tabs shorthand
  tabs?: { label: string; content: string }[];
  // accordion shorthand
  items?: { title: string; content: string }[];
  // progress shorthand
  value?: number; // 0-100
  label?: string;
  // card/info variant for color
  variant?: "default" | "info" | "success" | "warning" | "error";
  // steps shorthand
  steps?: { title: string; description?: string }[];
}

export interface Report {
  id: string;
  title: string;
  summary?: string;
  agent: string;
  sections: ReportSection[];
  createdAt: string;
  status: "pending" | "responded";
  callbackPipe?: string;
}

export interface DecisionResponse {
  decisionId: string;
  value: string | string[] | boolean;
}

export interface InlineComment {
  selectedText: string;
  comment: string;
  sectionIndex: number;
}

export interface ReportResponse {
  reportId: string;
  decisions: DecisionResponse[];
  comments: InlineComment[];
  comment?: string;
  respondedAt: string;
}
