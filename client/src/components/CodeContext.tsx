import React from "react";
import { cn } from "@/lib/utils";

interface CodeContextProps {
  code: string;
  lineNumber: number;
  filePath: string;
  contextLines?: number;
}

/**
 * Component that displays code with line numbers and highlights the specific line
 * Shows context lines above and below the highlighted line
 */
export default function CodeContext({
  code,
  lineNumber,
  filePath,
  contextLines = 5,
}: CodeContextProps) {
  // If we don't have actual code, we just show the snippet without context
  if (!code.includes("\n") && code.length < 100) {
    return (
      <div className="overflow-x-auto">
        <pre className="p-4 bg-zinc-900 text-white rounded-md">
          <code>{code}</code>
        </pre>
        <div className="text-xs text-muted-foreground mt-1">
          {filePath}:{lineNumber}
        </div>
      </div>
    );
  }

  // Split the code into lines
  const codeLines = code.split("\n");
  
  // Calculate start and end line numbers to display
  const startLine = Math.max(1, lineNumber - contextLines);
  const endLine = Math.min(codeLines.length, lineNumber + contextLines);
  
  // Get the lines to display
  const displayLines = codeLines.slice(startLine - 1, endLine);
  
  // Calculate the line number width for proper alignment
  const lineNumberWidth = endLine.toString().length;
  
  return (
    <div className="overflow-x-auto">
      <pre className="p-4 bg-zinc-900 text-white rounded-md">
        {displayLines.map((line, index) => {
          const currentLineNumber = startLine + index;
          const isHighlighted = currentLineNumber === lineNumber;
          
          return (
            <div
              key={currentLineNumber}
              className={cn(
                "flex items-start",
                isHighlighted && "bg-red-900/30"
              )}
            >
              <span
                className={cn(
                  "text-gray-500 select-none mr-4 text-right inline-block",
                  isHighlighted && "text-white font-bold"
                )}
                style={{ minWidth: `${lineNumberWidth}ch` }}
              >
                {currentLineNumber}
              </span>
              <code className={cn(isHighlighted && "font-bold")}>{line}</code>
            </div>
          );
        })}
      </pre>
      <div className="text-xs text-muted-foreground mt-1">
        {filePath}:{lineNumber}
      </div>
    </div>
  );
}