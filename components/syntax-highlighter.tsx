"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
}

export function SyntaxHighlighter({ code, language }: SyntaxHighlighterProps) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    const lang = language || detectLanguage(code);
    codeToHtml(code, {
      lang,
      theme: "github-light",
    })
      .then(setHtml)
      .catch(() => {
        // Fallback if language isn't supported
        setHtml("");
      });
  }, [code, language]);

  if (!html) {
    // Fallback: plain code block
    return (
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
        <code className="text-sm">{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="rounded-lg overflow-x-auto text-sm [&_pre]:p-4 [&_pre]:bg-muted [&_pre]:rounded-lg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Simple language detection from content
function detectLanguage(code: string): string {
  if (code.includes("import ") && (code.includes("from ") || code.includes("require("))) return "typescript";
  if (code.includes("func ") && code.includes(":=")) return "go";
  if (code.includes("def ") && code.includes(":")) return "python";
  if (code.includes("fn ") && code.includes("->")) return "rust";
  if (code.includes("public class ") || code.includes("private ") || code.includes("@Override")) return "java";
  if (code.includes("package ") && code.includes("import ")) return "java";
  if (code.includes("<?php")) return "php";
  if (code.includes("SELECT ") || code.includes("INSERT ") || code.includes("CREATE TABLE")) return "sql";
  if (code.includes("<!DOCTYPE") || code.includes("<html")) return "html";
  if (code.includes("apiVersion:") || code.includes("kind:")) return "yaml";
  if (code.startsWith("{") || code.startsWith("[")) return "json";
  if (code.includes("#!/bin/bash") || code.includes("#!/bin/sh") || code.includes("echo ")) return "bash";
  if (code.includes("const ") || code.includes("let ") || code.includes("function ")) return "typescript";
  return "text";
}
