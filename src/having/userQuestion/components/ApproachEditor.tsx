// src/components/questions/ApproachEditor.tsx

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Save, X, RotateCcw } from "lucide-react";
import { Editor } from "@monaco-editor/react";
import { useUpdateApproach } from "@/having/userQuestion/hooks";
import type { ApproachDetail } from "@/having/userQuestion/types";
import toast from "react-hot-toast";

interface ApproachEditorProps {
  approach: ApproachDetail;
  onBack: () => void;
}

const TEXT_CONTENT_LIMIT = 50000;
const CODE_CONTENT_LIMIT = 50000;

export function ApproachEditor({ approach, onBack }: ApproachEditorProps) {
  const [textContent, setTextContent] = useState(approach.textContent);
  const [codeContent, setCodeContent] = useState(approach.codeContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);

  const updateMutation = useUpdateApproach();
  const isResizingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved panel width
  useEffect(() => {
    const savedWidth = localStorage.getItem("approach_editor_panel_width");
    if (savedWidth) setLeftPanelWidth(parseFloat(savedWidth));
  }, []);

  // Save panel width
  useEffect(() => {
    localStorage.setItem(
      "approach_editor_panel_width",
      leftPanelWidth.toString()
    );
  }, [leftPanelWidth]);

  useEffect(() => {
    const changed =
      textContent !== approach.textContent ||
      codeContent !== approach.codeContent;
    setHasChanges(changed);
  }, [textContent, codeContent, approach]);

  // Handle panel resizing
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

    if (codeContent.length > CODE_CONTENT_LIMIT) {
      toast.error(`Code exceeds ${CODE_CONTENT_LIMIT} characters`);
      return;
    }

    updateMutation.mutate(
      {
        questionId: approach.questionId,
        approachId: approach.id,
        data: {
          textContent,
          codeContent,
          codeLanguage: approach.codeLanguage,
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
    setCodeContent(approach.codeContent);
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

  const textCharsLeft = TEXT_CONTENT_LIMIT - textContent.length;
  const codeCharsLeft = CODE_CONTENT_LIMIT - codeContent.length;

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A]">
      {/* Header with Actions */}
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

      {/* Resizable Panels */}
      <div className="flex-1 flex min-h-0" ref={containerRef}>
        {/* Left Panel - Code Editor */}
        <div
          className="flex flex-col bg-[#262626] border-r border-gray-700"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#1A1A1A] border-b border-gray-700">
            <h3 className="text-xs font-medium text-gray-300">
              Code ({approach.codeLanguage})
            </h3>
            <span
              className={`text-xs ${
                codeCharsLeft < 0 ? "text-red-400" : "text-gray-500"
              }`}
            >
              {codeCharsLeft.toLocaleString()} characters left
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={approach.codeLanguage.toLowerCase()}
              value={codeContent}
              onChange={(value) => setCodeContent(value || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                lineNumbers: "on",
              }}
            />
          </div>
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-gray-700 cursor-col-resize hover:bg-blue-500 transition-colors relative group"
          onMouseDown={handlePanelMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20"></div>
        </div>

        {/* Right Panel - Description */}
        <div
          className="flex flex-col bg-[#262626]"
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
          <div className="flex-1 min-h-0 p-4">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Describe your approach, thought process, time/space complexity..."
              className="w-full h-full resize-none bg-[#1A1A1A] text-gray-300 border border-gray-600 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}