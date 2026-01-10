// src/having/userQuestion/components/SolutionViewer.tsx

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  FolderOpen,
  ExternalLink,
  Code,
  Palette,
  FileText,
  Box,
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
  ChevronDown,
} from "lucide-react";
import { Editor } from "@monaco-editor/react";
import { TipTapViewer } from "@/having/userQuestion/components/TipTapViewer";
import { useVisualizerContent } from "@/having/userQuestion/hooks";
import type { SolutionSummary } from "@/having/userQuestion/types";

interface SolutionViewerProps {
  solution: SolutionSummary;
  onBack: () => void;
}

// Monaco Editor Themes
const MONACO_THEMES = [
  { name: "VS Code Dark", value: "vs-dark" },
  { name: "VS Code Light", value: "light" },
  { name: "High Contrast Dark", value: "hc-black" },
  { name: "High Contrast Light", value: "hc-light" },
];

// Language mapping for Monaco Editor
const getMonacoLanguage = (language: string): string => {
  const languageMap: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    csharp: "csharp",
    "c#": "csharp",
    php: "php",
    ruby: "ruby",
    go: "go",
    rust: "rust",
    kotlin: "kotlin",
    swift: "swift",
  };

  return languageMap[language.toLowerCase()] || "plaintext";
};

// Language labels
const getLanguageLabel = (language: string): string => {
  const labelMap: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    csharp: "C#",
    php: "PHP",
    ruby: "Ruby",
    go: "Go",
    rust: "Rust",
    kotlin: "Kotlin",
    swift: "Swift",
  };

  return labelMap[language.toLowerCase()] || language;
};

type ViewMode = "code" | "explanation" | "visualizer";

export function SolutionViewer({ solution, onBack }: SolutionViewerProps) {
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [leftView, setLeftView] = useState<ViewMode>("code");
  const [rightView, setRightView] = useState<ViewMode>("explanation");
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [selectedVisualizerIndex, setSelectedVisualizerIndex] = useState(0);
  const [fontSize, setFontSize] = useState(14);
  const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // ✅ NEW: Code template selection state
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const isResizingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get visualizer file IDs from solution
  const visualizerFileIds = solution.visualizerFileIds || [];
  
  // ✅ NEW: Check for code templates
  const codeTemplates = solution.codeTemplates || {};
  const availableLanguages = Object.keys(codeTemplates);
  const hasCodeTemplates = availableLanguages.length > 0;
  const hasVisualizers = visualizerFileIds.length > 0;

  // ✅ Initialize selected language
  useEffect(() => {
    if (hasCodeTemplates && !selectedLanguage) {
      setSelectedLanguage(availableLanguages[0]);
      setSelectedTemplateIndex(0);
    }
  }, [hasCodeTemplates, selectedLanguage, availableLanguages]);

  // ✅ Get current code template
  const getCurrentCodeTemplate = () => {
    if (!selectedLanguage || !codeTemplates[selectedLanguage]) {
      return null;
    }
    const templates = codeTemplates[selectedLanguage];
    return templates[selectedTemplateIndex] || null;
  };

  const currentCode = getCurrentCodeTemplate();
  const templatesForLanguage = selectedLanguage ? codeTemplates[selectedLanguage] || [] : [];

  // Fetch only the currently selected visualizer content
  const selectedFileId = hasVisualizers
    ? visualizerFileIds[selectedVisualizerIndex]
    : null;
  const { data: visualizerContent, isLoading: isLoadingContent } =
    useVisualizerContent(selectedFileId || "", !!selectedFileId);

  // Load saved panel width
  useEffect(() => {
    const savedWidth = localStorage.getItem("solution_viewer_panel_width");
    if (savedWidth) setLeftPanelWidth(parseFloat(savedWidth));
  }, []);

  // Save panel width
  useEffect(() => {
    localStorage.setItem(
      "solution_viewer_panel_width",
      leftPanelWidth.toString()
    );
  }, [leftPanelWidth]);

  // Handle panel resizing
  const handlePanelMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!containerRef.current) return;

      isResizingRef.current = true;
      setIsResizing(true);
      const startX = e.clientX;
      const startWidth = leftPanelWidth;
      const containerWidth = containerRef.current.offsetWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizingRef.current) return;

        moveEvent.preventDefault();

        const deltaX = moveEvent.clientX - startX;
        const deltaPercent = (deltaX / containerWidth) * 100;
        const newWidth = startWidth + deltaPercent;

        const clampedWidth = Math.max(20, Math.min(80, newWidth));

        setLeftPanelWidth(clampedWidth);
      };

      const handleMouseUp = () => {
        isResizingRef.current = false;
        setIsResizing(false);
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

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 12));
  };

  // Ensure left and right views are different
  const handleLeftViewChange = (view: ViewMode) => {
    if (view === rightView) {
      setRightView(leftView);
    }
    setLeftView(view);
  };

  const handleRightViewChange = (view: ViewMode) => {
    if (view === leftView) {
      setLeftView(rightView);
    }
    setRightView(view);
  };

  // Handle YouTube link click
  const handleYouTubeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowYouTubePlayer(true);
  };

  // ✅ Handle language change
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setSelectedTemplateIndex(0); // Reset to first template
    setShowLanguageSelector(false);
  };

  // Render view content
  const renderViewContent = (view: ViewMode) => {
    switch (view) {
      case "code":
        if (!hasCodeTemplates) {
          return (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No code templates available for this solution</p>
              </div>
            </div>
          );
        }

        if (!currentCode) {
          return (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No code available</p>
              </div>
            </div>
          );
        }

        return (
          <div className="h-full flex flex-col">
            {/* Language & Template Selector */}
            <div className="border-b border-gray-700 px-4 py-2 bg-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Language Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    <Code className="w-4 h-4" />
                    <span>{getLanguageLabel(selectedLanguage)}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showLanguageSelector && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowLanguageSelector(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 bg-[#262626] border border-gray-700 rounded-lg shadow-lg z-50 min-w-[150px] max-h-60 overflow-y-auto">
                        {availableLanguages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => handleLanguageChange(lang)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                              selectedLanguage === lang
                                ? "bg-blue-900/20 text-blue-400"
                                : "text-gray-300"
                            }`}
                          >
                            {getLanguageLabel(lang)} ({codeTemplates[lang].length})
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Template Navigation - Only show if multiple templates */}
                {templatesForLanguage.length > 1 && (
                  <div className="flex items-center gap-2 border-l border-gray-700 pl-2">
                    <button
                      onClick={() =>
                        setSelectedTemplateIndex(Math.max(0, selectedTemplateIndex - 1))
                      }
                      disabled={selectedTemplateIndex === 0}
                      className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Prev
                    </button>
                    <span className="text-xs text-gray-400">
                      Template {selectedTemplateIndex + 1} / {templatesForLanguage.length}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedTemplateIndex(
                          Math.min(templatesForLanguage.length - 1, selectedTemplateIndex + 1)
                        )
                      }
                      disabled={selectedTemplateIndex === templatesForLanguage.length - 1}
                      className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500">
                {availableLanguages.length} language{availableLanguages.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={getMonacoLanguage(selectedLanguage)}
                value={currentCode}
                theme={editorTheme}
                options={{
                  readOnly: true,
                  fontSize: fontSize,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  lineNumbers: "on",
                }}
              />
            </div>
          </div>
        );

      case "explanation":
        return (
          <div className="h-full overflow-auto custom-scrollbar">
            {(solution.youtubeLink || solution.driveLink) && (
              <div className="px-6 pt-4 pb-3 border-b border-gray-700 bg-[#262626]">
                <div className="flex items-center space-x-3">
                  {solution.youtubeLink && (
                    <button
                      onClick={handleYouTubeClick}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/40 rounded transition-colors text-sm"
                      title="Watch video explanation"
                    >
                      <Play className="w-4 h-4" />
                      <span>Watch Video</span>
                    </button>
                  )}

                  {solution.driveLink && (
                    <a
                      href={solution.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-900/30 text-blue-400 hover:bg-blue-900/40 rounded transition-colors text-sm"
                      title="Open drive resources"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Resources</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="p-6">
              <TipTapViewer
                content={solution.content}
                className="text-gray-300"
              />
            </div>
          </div>
        );

      case "visualizer":
        if (!hasVisualizers) {
          return (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No visualizers available for this solution</p>
              </div>
            </div>
          );
        }

        return (
          <div className="h-full flex flex-col">
            {visualizerFileIds.length > 1 && (
              <div className="border-b border-gray-700 px-4 py-2 bg-[#262626]">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      setSelectedVisualizerIndex(
                        Math.max(0, selectedVisualizerIndex - 1)
                      )
                    }
                    disabled={selectedVisualizerIndex === 0}
                    className="px-3 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-300 font-medium">
                    Visualizer {selectedVisualizerIndex + 1} of {visualizerFileIds.length}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedVisualizerIndex(
                        Math.min(
                          visualizerFileIds.length - 1,
                          selectedVisualizerIndex + 1
                        )
                      )
                    }
                    disabled={
                      selectedVisualizerIndex === visualizerFileIds.length - 1
                    }
                    className="px-3 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 relative">
              {isLoadingContent ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-400">
                      Loading visualizer...
                    </p>
                  </div>
                </div>
              ) : visualizerContent ? (
                <iframe
                  key={selectedFileId}
                  srcDoc={visualizerContent}
                  title={`Algorithm Visualizer ${selectedVisualizerIndex + 1}`}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Box className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Failed to load visualizer</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // View selector component
  const ViewSelector = ({
    currentView,
    onChange,
    label,
  }: {
    currentView: ViewMode;
    onChange: (view: ViewMode) => void;
    label: string;
  }) => (
    <div className="flex items-center space-x-1">
      <span className="text-xs text-gray-400 mr-1">{label}:</span>
      <button
        onClick={() => onChange("code")}
        disabled={!hasCodeTemplates}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
          currentView === "code"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        } ${!hasCodeTemplates ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <Code className="w-3 h-3" />
        <span>Code</span>
        {hasCodeTemplates && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-900 text-blue-300 rounded-full text-xs font-medium">
            {availableLanguages.length}
          </span>
        )}
      </button>
      <button
        onClick={() => onChange("explanation")}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
          currentView === "explanation"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`}
      >
        <FileText className="w-3 h-3" />
        <span>Explanation</span>
      </button>
      <button
        onClick={() => onChange("visualizer")}
        disabled={!hasVisualizers}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
          currentView === "visualizer"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        } ${!hasVisualizers ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <Box className="w-3 h-3" />
        <span>Visualizer</span>
        {hasVisualizers && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-900 text-blue-300 rounded-full text-xs font-medium">
            {visualizerFileIds.length}
          </span>
        )}
      </button>
    </div>
  );

  // If YouTube player is active, show full-page player
  if (showYouTubePlayer && solution.youtubeEmbedUrl) {
    return (
      <div className="h-full flex flex-col bg-[#1A1A1A]">
        <div className="border-b border-gray-700 px-4 py-3 bg-[#262626]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowYouTubePlayer(false)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Solution</span>
              </button>
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Play className="w-5 h-5 mr-2 text-red-400" />
                Video Tutorial
              </h3>
            </div>
            <button
              onClick={() => setShowYouTubePlayer(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Close video"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-[#1A1A1A]">
          <div className="w-full max-w-6xl">
            <div className="aspect-video rounded-lg overflow-hidden border border-gray-700 shadow-2xl">
              <iframe
                src={solution.youtubeEmbedUrl}
                title="YouTube video tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal split-view layout
  return (
    <div className="h-full flex flex-col bg-[#1A1A1A]">
      <div className="border-b border-gray-700 px-4 py-2 bg-[#262626]">
        <div className="flex items-center justify-between">
          <ViewSelector
            currentView={leftView}
            onChange={handleLeftViewChange}
            label="Left"
          />

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 border-l border-r border-gray-700 px-3">
              <button
                onClick={decreaseFontSize}
                className="p-1.5 text-gray-400 hover:bg-gray-700 rounded"
                title="Decrease font size"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs text-gray-400 min-w-[2rem] text-center">
                {fontSize}px
              </span>
              <button
                onClick={increaseFontSize}
                className="p-1.5 text-gray-400 hover:bg-gray-700 rounded"
                title="Increase font size"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="p-1.5 text-gray-400 hover:bg-gray-700 rounded"
                title="Change editor theme"
              >
                <Palette size={14} />
              </button>

              {showThemeSelector && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowThemeSelector(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 bg-[#262626] border border-gray-700 rounded-lg shadow-lg z-50 min-w-[180px]">
                    {MONACO_THEMES.map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => {
                          setEditorTheme(theme.value);
                          setShowThemeSelector(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                          editorTheme === theme.value
                            ? "bg-blue-900/20 text-blue-400"
                            : "text-gray-300"
                        }`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

          <ViewSelector
            currentView={rightView}
            onChange={handleRightViewChange}
            label="Right"
          />
        </div>
      </div>

      <div className="flex-1 flex min-h-0" ref={containerRef}>
        <div
          className="bg-[#262626] border-r border-gray-700"
          style={{ 
            width: `${leftPanelWidth}%`,
            pointerEvents: isResizing ? 'none' : 'auto'
          }}
        >
          {renderViewContent(leftView)}
        </div>

        <div
          className="w-1 bg-gray-700 cursor-col-resize hover:bg-blue-500 transition-colors relative group"
          onMouseDown={handlePanelMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20"></div>
        </div>

        <div
          className="bg-[#262626]"
          style={{ 
            width: `${100 - leftPanelWidth}%`,
            pointerEvents: isResizing ? 'none' : 'auto'
          }}
        >
          {renderViewContent(rightView)}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar {
          overflow-y: overlay;
          scrollbar-gutter: stable;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
      `}</style>
    </div>
  );
}