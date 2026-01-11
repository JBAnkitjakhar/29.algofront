// src/having/userQuestion/components/TestCaseManager.tsx - COMPLETE FILE

"use client";

import { useState } from "react";
import { Plus, X, CheckCircle, XCircle, Clock } from "lucide-react";
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
  mode?: "edit" | "results";
}

export function TestCaseManager({
  allTestCases,
  selectedTestCases,
  onTestCaseSelectionChange,
  results,
  mode = "edit",
}: TestCaseManagerProps) {
  const [activeTab, setActiveTab] = useState(0);

  const formatValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const addTestCase = () => {
    if (selectedTestCases.length >= 5) return;

    const selectedIds = new Set(selectedTestCases.map(tc => tc.id));
    const nextTestCase = allTestCases.find(tc => !selectedIds.has(tc.id));

    if (nextTestCase) {
      onTestCaseSelectionChange([...selectedTestCases, nextTestCase]);
      setActiveTab(selectedTestCases.length);
    }
  };

  const removeTestCase = (index: number) => {
    if (selectedTestCases.length <= 1) return;

    const newTestCases = selectedTestCases.filter((_, i) => i !== index);
    onTestCaseSelectionChange(newTestCases);

    if (activeTab >= newTestCases.length) {
      setActiveTab(newTestCases.length - 1);
    } else if (activeTab > index) {
      setActiveTab(activeTab - 1);
    }
  };

  const getResultForTestCase = (index: number): TestCaseResult | undefined => {
    return results?.[index];
  };

  const canAddMore = selectedTestCases.length < 5 && selectedTestCases.length < allTestCases.length;

  return (
    <>
      <div className="h-full flex flex-col bg-[#262626]">
        {/* Header with Tabs */}
        <div className="flex items-center border-b border-gray-700 bg-[#1A1A1A]">
          <span className="px-4 py-2 text-sm font-medium text-gray-400">
            Test Case
          </span>
          <div className="flex items-center space-x-1 px-2">
            {selectedTestCases.map((testCase, index) => {
              const result = getResultForTestCase(index);
              
              return (
                <div key={testCase.id} className="flex items-center group">
                  <button
                    onClick={() => setActiveTab(index)}
                    className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === index
                        ? "text-white border-b-2 border-blue-500"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <span>Case {index + 1}</span>
                    {result && (
                      <span>
                        {result.status === "passed" ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        ) : result.status === "tle" ? (
                          <Clock className="w-3.5 h-3.5 text-yellow-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </span>
                    )}
                  </button>
                  {mode === "edit" && selectedTestCases.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTestCase(index);
                      }}
                      className="ml-1 p-0.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove test case"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            {mode === "edit" && canAddMore && (
              <button
                onClick={addTestCase}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Add test case"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {selectedTestCases.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No test cases available
            </div>
          ) : (
            selectedTestCases[activeTab] && (
              <div className="space-y-3">
                {/* Input Section */}
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-2">Input:</div>
                  {Object.entries(selectedTestCases[activeTab].input).map(
                    ([key, value]) => (
                      <div key={key} className="mb-2">
                        <div className="text-xs text-gray-500 mb-1">{key} =</div>
                        <div className="bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono">
                          {formatValue(value)}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Results Mode - Show detailed comparison */}
                {mode === "results" && getResultForTestCase(activeTab) ? (
                  <>
                    {(() => {
                      const result = getResultForTestCase(activeTab)!;
                      return (
                        <>
                          {/* Your Output */}
                          <div>
                            <div className="text-xs font-medium text-gray-400 mb-1">
                              Your Output:
                            </div>
                            <div
                              className={`border rounded px-3 py-2 text-sm font-mono ${
                                result.status === "passed"
                                  ? "text-green-400 bg-green-900/20 border-green-500"
                                  : "text-red-400 bg-red-900/20 border-red-500"
                              }`}
                            >
                              {result.userOutput}
                            </div>
                          </div>

                          {/* Expected Output */}
                          <div>
                            <div className="text-xs font-medium text-gray-400 mb-1">
                              Expected Output:
                            </div>
                            <div className="bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono">
                              {formatValue(selectedTestCases[activeTab].expectedOutput)}
                            </div>
                          </div>

                          {/* Timing Info */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">
                              Expected Time: {selectedTestCases[activeTab].expectedTimeLimit}ms
                            </span>
                            <span
                              className={`font-medium ${
                                result.status === "tle"
                                  ? "text-yellow-400"
                                  : result.actualTime <= selectedTestCases[activeTab].expectedTimeLimit
                                  ? "text-green-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              Actual: {result.actualTime}ms
                            </span>
                          </div>

                          {/* Status Messages */}
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
                          {result.status === "passed" && (
                            <div className="text-xs text-green-400 bg-green-900/20 p-2 rounded">
                              ✓ Test case passed
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : mode === "edit" ? (
                  <>
                    {/* Expected Output (Edit mode only) */}
                    <div>
                      <div className="text-xs font-medium text-gray-400 mb-1">Expected Output:</div>
                      <div className="bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono">
                        {formatValue(selectedTestCases[activeTab].expectedOutput)}
                      </div>
                    </div>

                    {/* Time Limit Info */}
                    <div className="text-xs text-gray-500">
                      Time Limit: {selectedTestCases[activeTab].expectedTimeLimit}ms
                    </div>
                  </>
                ) : null}
              </div>
            )
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #525252;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #404040 #1a1a1a;
        }
      `}</style>
    </>
  );
}