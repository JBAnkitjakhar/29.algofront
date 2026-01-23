// src/having/adminquestions/components/TestcaseEditor.tsx

"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Testcase } from "../types";
import { MonacoCodeEditor } from "./MonacoCodeEditor";

interface TestcaseEditorProps {
  testcases: Testcase[];
  onChange: (testcases: Testcase[]) => void;
}

export function TestcaseEditor({ testcases, onChange }: TestcaseEditorProps) {
  const [jsonText, setJsonText] = useState(
    JSON.stringify(testcases, null, 2)
  );
  const [error, setError] = useState("");

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    
    if (!value.trim()) {
      setError("");
      onChange([]);
      return;
    }

    try {
      const parsed = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        setError("JSON must be an array of testcases");
        return;
      }

      // Validate structure
      for (let i = 0; i < parsed.length; i++) {
        const tc = parsed[i];
        if (!tc.id || !tc.input || tc.expectedOutput === undefined) {
          setError(
            `Testcase ${i + 1}: Must have id, input, expectedOutput`
          );
          return;
        }
      }

      onChange(parsed);
      setError("");
    } catch (err) {
      setError("Invalid JSON: " + (err as Error).message);
    }
  };

  const totalSize = jsonText.length;
  const maxSize = 30000;
  const isOverLimit = totalSize > maxSize;
  const isWarning = totalSize > maxSize * 0.8;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">Testcases</h3>
          <p className="text-sm text-gray-400 mt-1">
            Paste your testcases JSON array below. (Max 30,000 characters total)
          </p>
        </div>
        <div
          className={`text-xs ${
            isOverLimit
              ? "text-red-400 font-semibold"
              : isWarning
              ? "text-yellow-400"
              : "text-gray-500"
          }`}
        >
          {totalSize.toLocaleString()} / {maxSize.toLocaleString()} characters
        </div>
      </div>

      {/* JSON Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Testcases JSON Array
        </label>
        
        <MonacoCodeEditor
          value={jsonText}
          onChange={handleJsonChange}
          language="json"
          placeholder='[\n  {\n    "id": 1,\n    "input": {"nums": [-1, 0, 1]},\n    "expectedOutput": [[-1, 0, 1]]\n  }\n]'
          maxLength={maxSize}
        />

        {error && (
          <p className="text-sm text-red-400 mt-2">❌ {error}</p>
        )}
      </div>

      {/* Info Box */}
      <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-md">
        <p className="text-sm text-blue-400 mb-2">
          💡 <strong>Format:</strong> JSON array of testcases. Each testcase needs:
        </p>
        <ul className="text-xs text-blue-300 space-y-1 ml-4">
          <li>• <code className="bg-blue-900/30 px-1 py-0.5 rounded">id</code> - Unique number</li>
          <li>• <code className="bg-blue-900/30 px-1 py-0.5 rounded">input</code> - Object with parameter names as keys</li>
          <li>• <code className="bg-blue-900/30 px-1 py-0.5 rounded">expectedOutput</code> - Expected result (any JSON value)</li>
        </ul>
      </div>

      {/* Warning */}
      {isOverLimit && (
        <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">
            Total testcases size exceeds {maxSize.toLocaleString()} characters.
            Please reduce the size before saving.
          </p>
        </div>
      )}

      {/* Success indicator */}
      {!error && testcases.length > 0 && (
        <div className="p-3 bg-green-900/20 border border-green-700 rounded-md">
          <p className="text-sm text-green-400">
            ✅ {testcases.length} testcase{testcases.length > 1 ? "s" : ""} loaded successfully
          </p>
        </div>
      )}
    </div>
  );
}