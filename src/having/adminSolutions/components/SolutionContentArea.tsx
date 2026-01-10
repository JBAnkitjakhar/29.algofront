// src/having/adminSolutions/components/SolutionContentArea.tsx

"use client";

import { useState} from "react";
import { Editor } from "@tiptap/react";
import { FileText, Code2, Link as LinkIcon } from "lucide-react";
import { SolutionEditor } from "./SolutionEditor";
import { VisualizerManager } from "./VisualizerManager";
import { CodeTemplatesManager } from "./CodeTemplatesManager";
import { LinksManager } from "./LinksManager";
import { CubeTransparentIcon } from "@heroicons/react/24/outline";

interface SolutionContentAreaProps {
  content: string;
  onContentChange: (content: string) => void;
  onEditorReady?: (editor: Editor) => void;
  solutionId?: string;
  visualizerFileIds: string[];
  onVisualizerFileIdsChange: (fileIds: string[]) => void;
  codeTemplates: Record<string, string[]>;
  onCodeTemplatesChange: (templates: Record<string, string[]>) => void;
  youtubeLink?: string;
  onYoutubeLinkChange: (link: string) => void;
  driveLink?: string;
  onDriveLinkChange: (link: string) => void;
}

export function SolutionContentArea({
  content,
  onContentChange,
  onEditorReady,
  solutionId,
  visualizerFileIds,
  onVisualizerFileIdsChange,
  codeTemplates,
  onCodeTemplatesChange,
  youtubeLink,
  onYoutubeLinkChange,      
  driveLink,
  onDriveLinkChange,
}: SolutionContentAreaProps) {
  const [activeView, setActiveView] = useState<"editor" | "code" | "visualizers" | "links">("editor");
  const visualizerCount = visualizerFileIds.length;
  const codeTemplateCount = Object.values(codeTemplates).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex-1 flex flex-col">
      {/* Tab Buttons */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex space-x-2">
          {/* Solution Editor */}
          <button
            type="button"
            onClick={() => setActiveView("editor")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activeView === "editor"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            Solution
          </button>

          {/* Code Templates */}
          <button
            type="button"
            onClick={() => setActiveView("code")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activeView === "code"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Code Templates ({codeTemplateCount})
          </button>

          {/* Visualizers */}
          <button
            type="button"
            onClick={() => setActiveView("visualizers")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activeView === "visualizers"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
            }`}
          >
            <CubeTransparentIcon className="w-4 h-4" />
            Visualizers ({visualizerCount}/2)
          </button>

          {/* Additional Resources */}
          <button
            type="button"
            onClick={() => setActiveView("links")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activeView === "links"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Resources
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-800">
        {activeView === "editor" && (
          <SolutionEditor
            content={content}
            onChange={onContentChange}
            onEditorReady={onEditorReady}
            placeholder="Explain your solution approach, algorithm, and implementation details..."
          />
        )}

        {activeView === "code" && (
          <CodeTemplatesManager
            codeTemplates={codeTemplates}
            onChange={onCodeTemplatesChange}
          />
        )}

        {activeView === "visualizers" && (
          <VisualizerManager
            solutionId={solutionId}
            visualizerFileIds={visualizerFileIds}
            onVisualizerFileIdsChange={onVisualizerFileIdsChange}
          />
        )}

        {activeView === "links" && (
          <LinksManager
            youtubeLink={youtubeLink}
            onYoutubeLinkChange={onYoutubeLinkChange}
            driveLink={driveLink}
            onDriveLinkChange={onDriveLinkChange}
          />
        )}
      </div>
    </div>
  );
}