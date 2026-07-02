"use client";

import { useState, useEffect, useCallback } from "react";
import { InlineComment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface InlineCommentsProps {
  sectionIndex: number;
  comments: InlineComment[];
  onAddComment: (comment: InlineComment) => void;
  onRemoveComment: (index: number) => void;
  disabled?: boolean;
}

export function InlineComments({
  sectionIndex,
  comments,
  onAddComment,
  onRemoveComment,
  disabled,
}: InlineCommentsProps) {
  const [showInput, setShowInput] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [commentText, setCommentText] = useState("");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text && text.length > 0) {
          // Check if the selection is within this section
          const sectionEl = document.querySelector(`[data-section-index="${sectionIndex}"]`);
          if (sectionEl && selection?.anchorNode && sectionEl.contains(selection.anchorNode)) {
            e.preventDefault();
            setSelectedText(text);
            setShowInput(true);
          }
        }
      }
    },
    [sectionIndex, disabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onAddComment({
        selectedText,
        comment: commentText.trim(),
        sectionIndex,
      });
      setShowInput(false);
      setCommentText("");
      setSelectedText("");
    }
  };

  const handleCancel = () => {
    setShowInput(false);
    setCommentText("");
    setSelectedText("");
  };

  const sectionComments = comments.filter((c) => c.sectionIndex === sectionIndex);

  return (
    <>
      {showInput && (
        <div className="mt-3 border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <div className="text-xs text-muted-foreground mb-1">Commenting on:</div>
          <div className="text-sm bg-muted rounded px-2 py-1 mb-2 font-mono line-clamp-2">
            &ldquo;{selectedText}&rdquo;
          </div>
          <Textarea
            placeholder="Type your comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="mb-2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) {
                handleSubmitComment();
              }
              if (e.key === "Escape") {
                handleCancel();
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmitComment}>
              Add Comment
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {sectionComments.length > 0 && (
        <div className="mt-3 space-y-2">
          {sectionComments.map((c, i) => {
            const globalIndex = comments.indexOf(c);
            return (
              <div
                key={i}
                className="border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">Comment</Badge>
                      <span>on &ldquo;{c.selectedText.slice(0, 50)}{c.selectedText.length > 50 ? "..." : ""}&rdquo;</span>
                    </div>
                    <p className="text-sm">{c.comment}</p>
                  </div>
                  {!disabled && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-6 px-2"
                      onClick={() => onRemoveComment(globalIndex)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
