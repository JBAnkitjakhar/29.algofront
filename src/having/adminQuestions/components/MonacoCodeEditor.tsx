// src/having/adminquestions/components/MonacoCodeEditor.tsx

"use client";

import { Editor } from "@monaco-editor/react";

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  maxLength?: number;
}

export function MonacoCodeEditor({
  value,
  onChange,
  language,
  maxLength,
}: MonacoCodeEditorProps) {
  const handleChange = (newValue: string | undefined) => {
    const val = newValue || "";
    if (maxLength && val.length > maxLength) {
      return; // Don't allow exceeding max length
    }
    onChange(val);
  };

  // Map language values to Monaco language IDs
  const getMonacoLanguage = (lang: string) => {
    const languageMap: Record<string, string> = {
      javascript: "javascript",
      typescript: "typescript",
      python: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      csharp: "csharp",
      php: "php",
      ruby: "ruby",
      go: "go",
      rust: "rust",
      kotlin: "kotlin",
      swift: "swift",
      sql: "sql",
      html: "html",
      css: "css",
      json: "json",
    };
    return languageMap[lang] || "javascript";
  };

  return (
    <div className="border border-gray-700 rounded-md overflow-hidden">
      <Editor
        height="800px"
        language={getMonacoLanguage(language)}
        value={value}
        onChange={handleChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: "selection",
          folding: true,
          lineHeight: 22,
          fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace",
        }}
      />
    </div>
  );
}