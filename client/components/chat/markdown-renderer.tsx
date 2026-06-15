"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let currentListType: "bullet" | "ordered" | null = null;

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      if (currentListType === "bullet") {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-xs">
            {currentList}
          </ul>
        );
      } else if (currentListType === "ordered") {
        elements.push(
          <ol key={`ol-${key}`} className="list-decimal pl-5 my-2 space-y-1 text-xs">
            {currentList}
          </ol>
        );
      }
      currentList = [];
      currentListType = null;
    }
  };

  const parseInline = (text: string): React.ReactNode[] => {
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const splitText = text.split(regex);
    
    return splitText.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-primary">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="bg-secondary/80 border border-border px-1.5 py-0.5 rounded font-mono text-[11px] text-amber-700 font-semibold">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Bullet list item
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      flushList(index);
      currentListType = "bullet";
      const itemContent = trimmed.substring(2);
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {parseInline(itemContent)}
        </li>
      );
      return;
    }
    
    // Ordered list item
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      flushList(index);
      currentListType = "ordered";
      const itemContent = orderedMatch[2];
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {parseInline(itemContent)}
        </li>
      );
      return;
    }
    
    // Normal paragraph line — flush list first
    flushList(index);
    
    if (trimmed === "") {
      elements.push(<div key={`br-${index}`} className="h-2" />);
      return;
    }
    
    // Headers
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={index} className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-3 mb-1">
          {parseInline(trimmed.substring(4))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={index} className="text-sm font-bold text-foreground mt-4 mb-1.5">
          {parseInline(trimmed.substring(3))}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={index} className="text-base font-bold text-foreground mt-4 mb-2">
          {parseInline(trimmed.substring(2))}
        </h2>
      );
    } else {
      // Regular paragraph line
      elements.push(
        <p key={index} className="text-xs leading-relaxed my-1">
          {parseInline(line)}
        </p>
      );
    }
  });
  
  // Flush any final open list
  flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
}
