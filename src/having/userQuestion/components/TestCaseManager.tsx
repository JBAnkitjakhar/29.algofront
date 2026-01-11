// src/having/userQuestion/components/TestCaseManager.tsx - COMPLETE FILE

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, X, CheckCircle, XCircle, Clock } from "lucide-react";
import type { TestCase } from "@/having/userQuestion/types";

interface TestCaseResult {
  testCase: TestCase;
  userOutput: string;
  actualTime: number;
  status: "passed" | "failed" | "tle";
}

interface TestCaseManagerProps {
  allTestCases: TestCase[];
  selectedTestCases: TestCase[];
  onTestCaseSelectionChange: (testCases: TestCase[]) => void;
  results?: TestCaseResult[];
  mode: "edit" | "results";
}

export function TestCaseManager({
  allTestCases,
  selectedTestCases,
  onTestCaseSelectionChange,
  results,
  mode,
}: TestCaseManagerProps) {
  const [expandedTestCases, setExpandedTestCases] = useState<Set<number>>(
    new Set([0])
  );

  const toggleExpanded = (id: number) => {
    setExpandedTestCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addTestCase = () => {
    if (selectedTestCases.length >= 5) return;

    const nextTestCase = allTestCases.find(
      (tc) => !selectedTestCases.some((selected) => selected.id === tc.id)
    );

    if (nextTestCase) {
      onTestCaseSelectionChange([...selectedTestCases, nextTestCase]);
      setExpandedTestCases((prev) => new Set(prev).add(nextTestCase.id));
    }
  };

  const removeTestCase = (testCaseId: number) => {
    if (selectedTestCases.length <= 1) return;
    onTestCaseSelectionChange(
      selectedTestCases.filter((tc) => tc.id !== testCaseId)
    );
    setExpandedTestCases((prev) => {
      const next = new Set(prev);
      next.delete(testCaseId);
      return next;
    });
  };

  const getResultForTestCase = (testCaseId: number): TestCaseResult | undefined => {
    return results?.find((r) => r.testCase.id === testCaseId);
  };

  const getStatusIcon = (status: "passed" | "failed" | "tle") => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "tle":
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: "passed" | "failed" | "tle") => {
    switch (status) {
      case "passed":
        return "border-green-500 bg-green-900/10";
      case "failed":
        return "border-red-500 bg-red-900/10";
      case "tle":
        return "border-yellow-500 bg-yellow-900/10";
    }
  };

  const formatInputDisplay = (input: Record<string, unknown>): string => {
    return Object.entries(input)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key} = [${value.join(", ")}]`;
        }
        return `${key} = ${JSON.stringify(value)}`;
      })
      .join("\n");
  };

  const formatOutputDisplay = (output: unknown): string => {
    if (Array.isArray(output)) {
      return JSON.stringify(output);
    }
    return String(output);
  };

  const canAddMore = selectedTestCases.length < 5 && selectedTestCases.length < allTestCases.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-300">
          Test Cases ({selectedTestCases.length}/{allTestCases.length})
        </h3>
        {mode === "edit" && canAddMore && (
          <button
            onClick={addTestCase}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Case</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {selectedTestCases.map((testCase, index) => {
          const result = getResultForTestCase(testCase.id);
          const isExpanded = expandedTestCases.has(testCase.id);

          return (
            <div
              key={testCase.id}
              className={`border rounded-lg overflow-hidden ${
                result ? getStatusColor(result.status) : "border-gray-700 bg-[#262626]"
              }`}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700/30"
                onClick={() => toggleExpanded(testCase.id)}
              >
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-white">
                    Case {index + 1}
                  </span>
                  {result && (
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(result.status)}
                      <span
                        className={`text-xs ${
                          result.status === "passed"
                            ? "text-green-400"
                            : result.status === "tle"
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {result.actualTime}ms
                      </span>
                    </div>
                  )}
                </div>

                {mode === "edit" && selectedTestCases.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTestCase(testCase.id);
                    }}
                    className="p-1 hover:bg-gray-600 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Content */}
              {isExpanded && (
                <div className="p-3 pt-0 space-y-2 border-t border-gray-700">
                  {/* Input */}
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">
                      Input:
                    </div>
                    <pre className="text-xs text-gray-300 bg-[#1A1A1A] p-2 rounded overflow-x-auto font-mono">
                      {formatInputDisplay(testCase.input)}
                    </pre>
                  </div>

                  {/* Expected Output */}
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">
                      Expected Output:
                    </div>
                    <pre className="text-xs text-gray-300 bg-[#1A1A1A] p-2 rounded overflow-x-auto font-mono">
                      {formatOutputDisplay(testCase.expectedOutput)}
                    </pre>
                  </div>

                  {/* Result Info (only in results mode) */}
                  {result && (
                    <>
                      {/* User Output */}
                      <div>
                        <div className="text-xs font-medium text-gray-400 mb-1">
                          Your Output:
                        </div>
                        <pre
                          className={`text-xs p-2 rounded overflow-x-auto font-mono ${
                            result.status === "passed"
                              ? "text-green-400 bg-green-900/20"
                              : "text-red-400 bg-red-900/20"
                          }`}
                        >
                          {result.userOutput}
                        </pre>
                      </div>

                      {/* Timing Info */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          Expected Time: {testCase.expectedTimeLimit}ms
                        </span>
                        <span
                          className={`font-medium ${
                            result.status === "tle"
                              ? "text-yellow-400"
                              : result.actualTime <= testCase.expectedTimeLimit
                              ? "text-green-400"
                              : "text-yellow-400"
                          }`}
                        >
                          Actual: {result.actualTime}ms
                        </span>
                      </div>

                      {/* Status Message */}
                      {result.status === "tle" && (
                        <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded">
                          ⚠️ Time Limit Exceeded
                        </div>
                      )}
                      {result.status === "failed" && (
                        <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                          ❌ Output mismatch
                        </div>
                      )}
                    </>
                  )}

                  {/* Expected Time Limit (edit mode only) */}
                  {mode === "edit" && !result && (
                    <div className="text-xs text-gray-500">
                      Time Limit: {testCase.expectedTimeLimit}ms
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary (results mode) */}
      {mode === "results" && results && results.length > 0 && (
        <div className="mt-4 p-3 bg-[#262626] border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Results:</span>
            <div className="flex items-center space-x-4">
              <span className="text-green-400">
                {results.filter((r) => r.status === "passed").length} Passed
              </span>
              <span className="text-red-400">
                {results.filter((r) => r.status === "failed").length} Failed
              </span>
              <span className="text-yellow-400">
                {results.filter((r) => r.status === "tle").length} TLE
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}