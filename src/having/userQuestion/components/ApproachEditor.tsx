// src/having/userQuestion/components/ApproachEditor.tsx

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  X,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Editor } from "@monaco-editor/react";
import {
  useUpdateApproach,
  useAnalyzeComplexity,
} from "@/having/userQuestion/hooks";
import { ComplexityAnalysisModal } from "./ComplexityAnalysisModal";
import type { ApproachDetail } from "@/having/userQuestion/types";
import toast from "react-hot-toast";

interface ApproachEditorProps {
  approach: ApproachDetail;
  onBack: () => void;
}

const TEXT_CONTENT_LIMIT = 50000;

export function ApproachEditor({ approach, onBack }: ApproachEditorProps) {
  const [textContent, setTextContent] = useState(approach.textContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [showComplexityModal, setShowComplexityModal] = useState(false);
  const [complexityResult, setComplexityResult] = useState<{
    timeComplexity: string;
    spaceComplexity: string;
    description: string;
  } | null>(null);
  const [complexityError, setComplexityError] = useState("");

  const updateMutation = useUpdateApproach();
  const analyzeMutation = useAnalyzeComplexity();
  const isResizingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedWidth = localStorage.getItem("approach_editor_panel_width");
    if (savedWidth) setLeftPanelWidth(parseFloat(savedWidth));
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "approach_editor_panel_width",
      leftPanelWidth.toString()
    );
  }, [leftPanelWidth]);

  useEffect(() => {
    const changed = textContent !== approach.textContent;
    setHasChanges(changed);
  }, [textContent, approach]);

  const handlePanelMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!containerRef.current) return;

      isResizingRef.current = true;
      const startX = e.clientX;
      const startWidth = leftPanelWidth;
      const containerWidth = containerRef.current.offsetWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizingRef.current) return;
        moveEvent.preventDefault();

        const deltaX = moveEvent.clientX - startX;
        const deltaPercent = (deltaX / containerWidth) * 100;
        const newWidth = startWidth + deltaPercent;
        const clampedWidth = Math.max(30, Math.min(70, newWidth));

        setLeftPanelWidth(clampedWidth);
      };

      const handleMouseUp = () => {
        isResizingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [leftPanelWidth]
  );

  const handleSave = async () => {
    if (textContent.length > TEXT_CONTENT_LIMIT) {
      toast.error(`Description exceeds ${TEXT_CONTENT_LIMIT} characters`);
      return;
    }

    updateMutation.mutate(
      {
        questionId: approach.questionId,
        approachId: approach.id,
        data: {
          textContent,
        },
      },
      {
        onSuccess: () => {
          toast.success("Approach updated successfully!");
          setHasChanges(false);
          onBack();
        },
        onError: () => {
          toast.error("Failed to update approach");
        },
      }
    );
  };

  const handleReset = () => {
    setTextContent(approach.textContent);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (
        !confirm("You have unsaved changes. Are you sure you want to go back?")
      ) {
        return;
      }
    }
    onBack();
  };

  const handleAnalyzeComplexity = () => {
    // ✅ If complexity already exists, just show it (cached in approach)
    if (approach.complexityAnalysis) {
      setComplexityResult({
        timeComplexity: approach.complexityAnalysis.timeComplexity,
        spaceComplexity: approach.complexityAnalysis.spaceComplexity,
        description: approach.complexityAnalysis.complexityDescription || "",
      });
      setComplexityError("");
      setShowComplexityModal(true);
      return;
    }

    // ✅ No complexity exists → Call backend (backend will analyze and save)
    analyzeMutation.mutate(
      {
        questionId: approach.questionId,
        approachId: approach.id,
      },
      {
        onSuccess: (updatedApproach) => {
          // Backend returns full ApproachDetail with complexity filled
          if (updatedApproach.complexityAnalysis) {
            setComplexityResult({
              timeComplexity: updatedApproach.complexityAnalysis.timeComplexity,
              spaceComplexity: updatedApproach.complexityAnalysis.spaceComplexity,
              description: updatedApproach.complexityAnalysis.complexityDescription || "",
            });
            setComplexityError("");
            setShowComplexityModal(true);
          }
        },
        onError: (error: Error) => {
          if (
            error.message.includes("429") ||
            error.message.includes("quota") ||
            error.message.includes("rate limit")
          ) {
            setComplexityError(
              "Rate limit exceeded. Please wait a moment and try again."
            );
          } else {
            setComplexityError(
              error.message || "Failed to analyze complexity. Please try again."
            );
          }
          setShowComplexityModal(true);
        },
      }
    );
  };

  const handleRetryAnalysis = () => {
    setShowComplexityModal(false);
    setComplexityError("");
    setComplexityResult(null);
    handleAnalyzeComplexity();
  };

  const textCharsLeft = TEXT_CONTENT_LIMIT - textContent.length;
  const isAnalyzing = analyzeMutation.isPending;

  const getStatusIcon = () => {
    switch (approach.status) {
      case "ACCEPTED":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "WRONG_ANSWER":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "TLE":
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = () => {
    switch (approach.status) {
      case "ACCEPTED":
        return "bg-green-900/20 border-green-500 text-green-400";
      case "WRONG_ANSWER":
        return "bg-red-900/20 border-red-500 text-red-400";
      case "TLE":
        return "bg-yellow-900/20 border-yellow-500 text-yellow-400";
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A]">
      <div className="border-b border-gray-700 px-4 py-2 bg-[#262626]">
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              disabled={!hasChanges || updateMutation.isPending}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors text-sm disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0" ref={containerRef}>
        <div
          className="flex flex-col bg-[#262626] border-r border-gray-700"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#1A1A1A] border-b border-gray-700">
            <h3 className="text-xs font-medium text-gray-300">
              Code ({approach.codeLanguage})
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={approach.codeLanguage.toLowerCase()}
              value={approach.codeContent}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                lineNumbers: "on",
                readOnly: true,
              }}
            />
          </div>
        </div>

        <div
          className="w-1 bg-gray-700 cursor-col-resize hover:bg-blue-500 transition-colors relative group"
          onMouseDown={handlePanelMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20"></div>
        </div>

        <div
          className="flex flex-col bg-[#262626] overflow-hidden"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#1A1A1A] border-b border-gray-700">
            <h3 className="text-xs font-medium text-gray-300">Description</h3>
            <span
              className={`text-xs ${
                textCharsLeft < 0 ? "text-red-400" : "text-gray-500"
              }`}
            >
              {textCharsLeft.toLocaleString()} characters left
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className={`m-4 p-4 rounded-lg border ${getStatusColor()}`}>
              <div className="flex items-center space-x-2 mb-3">
                {getStatusIcon()}
                <span className="font-semibold text-sm">
                  {approach.status.replace("_", " ")}
                </span>
              </div>

              {approach.status === "ACCEPTED" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Runtime:</span>
                      <span className="ml-2 font-medium">
                        {approach.runtime} ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Memory:</span>
                      <span className="ml-2 font-medium">
                        {(approach.memory! / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-green-500/30">
                    <button
                      onClick={handleAnalyzeComplexity}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-purple-900/30 text-purple-400 hover:bg-purple-900/40 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400"></div>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Analyze Complexity</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {approach.status === "WRONG_ANSWER" && approach.wrongTestcase && (
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Failed Test Case:</div>
                  <div className="bg-[#1A1A1A] rounded p-2 space-y-1 font-mono text-xs">
                    <div>
                      <span className="text-gray-500">Input:</span>
                      <span className="ml-2">
                        {approach.wrongTestcase.input}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Expected:</span>
                      <span className="ml-2 text-green-400">
                        {approach.wrongTestcase.expectedOutput}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Your Output:</span>
                      <span className="ml-2 text-red-400">
                        {approach.wrongTestcase.userOutput}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {approach.status === "TLE" && approach.tleTestcase && (
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Time Limit Exceeded:</div>
                  <div className="bg-[#1A1A1A] rounded p-2 space-y-1 font-mono text-xs">
                    <div>
                      <span className="text-gray-500">Input:</span>
                      <span className="ml-2">{approach.tleTestcase.input}</span>
                    </div>
                    {approach.runtime && (
                      <div>
                        <span className="text-gray-500">Runtime:</span>
                        <span className="ml-2">{approach.runtime} ms</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 pt-0">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Describe your approach, thought process, optimizations..."
                className="w-full h-96 resize-none bg-[#1A1A1A] text-gray-300 border border-gray-600 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {showComplexityModal && (
        <ComplexityAnalysisModal
          timeComplexity={complexityResult?.timeComplexity || ""}
          spaceComplexity={complexityResult?.spaceComplexity || ""}
          description={complexityResult?.description || ""}
          error={complexityError}
          onClose={() => {
            setShowComplexityModal(false);
            setComplexityError("");
            setComplexityResult(null);
          }}
          onRetry={complexityError ? handleRetryAnalysis : undefined}
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }
      `}</style>
    </div>
  );
}