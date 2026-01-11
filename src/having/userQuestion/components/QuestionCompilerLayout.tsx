// src/having/userQuestion/components/QuestionCompilerLayout.tsx - COMPLETE FILE

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Editor } from "@monaco-editor/react";
import {
  Play,
  RotateCcw,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Palette,
} from "lucide-react";
import { Language, SUPPORTED_LANGUAGES } from "@/lib/compiler/languages";
import { CodeAssembler } from "@/having/userQuestion/components/codeAssembler";
import { ResultComparator } from "@/having/userQuestion/components/resultComparator";
import { TestCaseManager } from "./TestCaseManager";
import { useCreateApproach } from "@/having/userQuestion/hooks";
import type {
  QuestionDetail,
  TestCase,
  BackendTestCaseResult,
} from "@/having/userQuestion/types";
import type { TestCaseResult as TestCaseResultType } from "@/having/userQuestion/components/resultComparator";
import type { editor } from "monaco-editor";
import toast from "react-hot-toast";

interface QuestionCompilerLayoutProps {
  question: QuestionDetail;
}

type TestCaseResult = TestCaseResultType;

const MONACO_THEMES = [
  { name: "VS Code Dark", value: "vs-dark", preview: "bg-gray-800 text-white" },
  { name: "Monokai", value: "monokai", preview: "bg-gray-900 text-green-400" },
];

const customThemes = {
  monokai: {
    base: "vs-dark" as const,
    inherit: true,
    rules: [
      { token: "comment", foreground: "75715E" },
      { token: "keyword", foreground: "F92672" },
      { token: "string", foreground: "E6DB74" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#F8F8F2",
    },
  },
};

// Language key mapping helper
const LANG_KEY_MAP: Record<string, string> = {
  Java: "java",
  "C++": "cpp",
  Python: "python",
  JavaScript: "javascript",
  C: "c",
  Go: "go",
  Rust: "rust",
  TypeScript: "typescript",
};

export function QuestionCompilerLayout({
  question,
}: QuestionCompilerLayoutProps) {
  const getStorageKey = useCallback(
    (language: string, type: "code") =>
      `question_${question.id}_${language}_${type}`,
    [question.id]
  );

  // Get available languages based on userStarterCode
  const availableLanguages = useMemo(() => {
    if (
      !question.userStarterCode ||
      Object.keys(question.userStarterCode).length === 0
    ) {
      return SUPPORTED_LANGUAGES;
    }

    return SUPPORTED_LANGUAGES.filter((language) => {
      const langKey =
        LANG_KEY_MAP[language.name] || language.name.toLowerCase();
      return question.userStarterCode[langKey];
    });
  }, [question.userStarterCode]);

  const defaultLanguage = useMemo(() => {
    if (
      question.userStarterCode &&
      Object.keys(question.userStarterCode).length > 0
    ) {
      // Try Java first
      if (question.userStarterCode["java"]) {
        return (
          availableLanguages.find((lang) => lang.name === "Java") ||
          availableLanguages[0]
        );
      }

      // Otherwise use first available
      const firstLangKey = Object.keys(question.userStarterCode)[0];
      const reverseLangKeyMap: Record<string, string> = {
        java: "Java",
        cpp: "C++",
        python: "Python",
        javascript: "JavaScript",
        c: "C",
        go: "Go",
        rust: "Rust",
        typescript: "TypeScript",
      };

      const mappedName = reverseLangKeyMap[firstLangKey] || firstLangKey;
      return (
        availableLanguages.find((lang) => lang.name === mappedName) ||
        availableLanguages[0]
      );
    }
    return availableLanguages[0] || SUPPORTED_LANGUAGES[0];
  }, [question.userStarterCode, availableLanguages]);

  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>(defaultLanguage);
  const [code, setCode] = useState<string>("");
  const [starterCode, setStarterCode] = useState<string>("");

  const [selectedTestCases, setSelectedTestCases] = useState<TestCase[]>([]);
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([]);
  const [executionMode, setExecutionMode] = useState<
    "idle" | "running" | "results"
  >("idle");

  const [testCaseHeight, setTestCaseHeight] = useState(40);
  const [fontSize, setFontSize] = useState(14);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const createApproachMutation = useCreateApproach();

  // Load first 3 test cases on mount
  useEffect(() => {
    if (question.testcases && question.testcases.length > 0) {
      setSelectedTestCases(question.testcases.slice(0, 3));
    }
  }, [question.testcases]);

  // Load starter code based on selected language
  useEffect(() => {
    let codeToLoad = "";

    const langKey =
      LANG_KEY_MAP[selectedLanguage.name] ||
      selectedLanguage.name.toLowerCase();

    if (question.userStarterCode && question.userStarterCode[langKey]) {
      codeToLoad = question.userStarterCode[langKey];
    }

    // If no starter code, use default from language config
    if (!codeToLoad) {
      codeToLoad = selectedLanguage.defaultCode;
    }

    setStarterCode(codeToLoad);

    const savedCode = localStorage.getItem(
      getStorageKey(selectedLanguage.name, "code")
    );
    setCode(savedCode || codeToLoad);
  }, [selectedLanguage, question.userStarterCode, getStorageKey]);

  // Save code to localStorage
  useEffect(() => {
    if (code && code !== starterCode) {
      localStorage.setItem(getStorageKey(selectedLanguage.name, "code"), code);
    }
  }, [code, selectedLanguage.name, starterCode, getStorageKey]);

  // Persist testcase height
  useEffect(() => {
    const savedHeight = localStorage.getItem("testcase_panel_height");
    if (savedHeight) setTestCaseHeight(parseFloat(savedHeight));
  }, []);

  useEffect(() => {
    localStorage.setItem("testcase_panel_height", testCaseHeight.toString());
  }, [testCaseHeight]);

  const handleLanguageChange = (language: Language) => {
    if (code !== starterCode) {
      localStorage.setItem(getStorageKey(selectedLanguage.name, "code"), code);
    }
    setSelectedLanguage(language);
    setExecutionMode("idle");
    setTestCaseResults([]);
  };

  const handleTestCaseResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startY = e.clientY;
      const startHeight = testCaseHeight;
      const containerHeight = window.innerHeight - 120;

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        const deltaY = startY - e.clientY;
        const deltaPercent = (deltaY / containerHeight) * 100;
        const newHeight = Math.min(
          Math.max(startHeight + deltaPercent, 20),
          60
        );
        setTestCaseHeight(newHeight);
      };

      const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [testCaseHeight]
  );

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    if (selectedTestCases.length === 0) {
      toast.error("No test cases selected");
      return;
    }

    setIsExecuting(true);
    setExecutionMode("running");
    setTestCaseResults([]);

    try {
      const assembled = CodeAssembler.assemble(
        selectedLanguage.name,
        code,
        selectedTestCases
      );

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"
        }/question-compiler/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              document.cookie.split("token=")[1]?.split(";")[0]
            }`,
          },
          body: JSON.stringify({
            language: assembled.language,
            code: assembled.fullCode,
            // ✅ No testCaseIds needed - backend just runs the code
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Execution failed");
        setExecutionMode("idle");
        return;
      }

      // ✅ Backend returns results in order (index 0, 1, 2, ...)
      // We match them with selectedTestCases by array index
      const stdout = result.testCaseResults
        .map(
          (tc: BackendTestCaseResult) =>
            `TC_START:${tc.index}\nOUTPUT:${tc.output}\nTIME:${tc.timeMs}\nTC_END:${tc.index}`
        )
        .join("\n");

      // ✅ ResultComparator matches by index: result[0] → selectedTestCases[0], etc.
      const comparisonResult = ResultComparator.compareResults(
        stdout,
        selectedTestCases,
        result.metrics.totalMemoryMb * 1024 * 1024
      );

      setTestCaseResults(comparisonResult.results);
      setExecutionMode("results");

      if (comparisonResult.allPassed) {
        toast.success("All test cases passed! ✓");
      } else {
        toast.error("Some test cases failed");
      }
    } catch (error) {
      console.error("Execution error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to execute code: " + errorMessage);
      setExecutionMode("idle");
    } finally {
      setIsExecuting(false);
    }
  };
  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    if (!question.testcases || question.testcases.length === 0) {
      toast.error("No test cases available");
      return;
    }

    setIsExecuting(true);
    toast.loading("Submitting your code...", { id: "submit" });

    try {
      const assembled = CodeAssembler.assemble(
        selectedLanguage.name,
        code,
        question.testcases
      );

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"
        }/question-compiler/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              document.cookie.split("token=")[1]?.split(";")[0]
            }`,
          },
          body: JSON.stringify({
            language: assembled.language,
            code: assembled.fullCode,
          }),
        }
      );

      const result = await response.json();
      toast.dismiss("submit");

      if (!result.success) {
        toast.error(result.error || "Submission failed");
        return;
      }

      const stdout = result.testCaseResults
        .map(
          (tc: BackendTestCaseResult) =>
            `TC_START:${tc.index}\nOUTPUT:${tc.output}\nTIME:${tc.timeMs}\nTC_END:${tc.index}`
        )
        .join("\n");

      const comparisonResult = ResultComparator.compareResults(
        stdout,
        question.testcases,
        result.metrics.totalMemoryMb * 1024 * 1024
      );

      const languageMap: Record<string, string> = {
        Java: "java",
        Python: "python",
        JavaScript: "javascript",
        "C++": "cpp",
        C: "c",
        Go: "go",
        Rust: "rust",
        TypeScript: "typescript",
      };

      const approachData = ResultComparator.createApproachData(
        comparisonResult,
        code,
        languageMap[selectedLanguage.name] ||
          selectedLanguage.name.toLowerCase()
      );

      createApproachMutation.mutate(
        { questionId: question.id, data: approachData },
        {
          onSuccess: () => {
            if (comparisonResult.overallStatus === "ACCEPTED") {
              toast.success("Accepted! Your approach has been saved ✓");
            } else if (comparisonResult.overallStatus === "WRONG_ANSWER") {
              toast.error("Wrong Answer - Approach saved for review");
            } else {
              toast.error("Time Limit Exceeded - Approach saved for review");
            }
          },
        }
      );
    } catch (error) {
      console.error("Submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to submit: " + errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setCode(starterCode);
    setExecutionMode("idle");
    setTestCaseResults([]);
    localStorage.removeItem(getStorageKey(selectedLanguage.name, "code"));
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${question.title.replace(/[^a-z0-9]/gi, "_")}.${
      selectedLanguage.extension
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 12));

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setTimeout(() => editor.layout(), 100);
  };

  const handleEditorWillMount = (monaco: typeof import("monaco-editor")) => {
    Object.entries(customThemes).forEach(([name, theme]) => {
      monaco.editor.defineTheme(name, theme);
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A1A] border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Language Selector - Only show available languages */}
          <select
            value={selectedLanguage.name}
            onChange={(e) => {
              const language = availableLanguages.find(
                (lang) => lang.name === e.target.value
              );
              if (language) handleLanguageChange(language);
            }}
            disabled={isExecuting}
            className="px-1 py-0 border border-gray-600 rounded-md text-sm bg-[#1A1A1A] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableLanguages.map((language) => (
              <option key={language.name} value={language.name}>
                {language.name}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-1">
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
              title="Change theme"
            >
              <Palette size={14} />
            </button>

            {showThemeSelector && (
              <div className="absolute top-full left-0 mt-1 bg-[#262626] border border-gray-700 rounded-lg shadow-lg z-50 min-w-[150px]">
                {MONACO_THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => {
                      setEditorTheme(theme.value);
                      setShowThemeSelector(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 ${
                      editorTheme === theme.value
                        ? "bg-blue-900/20 text-blue-400"
                        : "text-gray-300"
                    }`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            disabled={isExecuting}
            className="flex items-center space-x-1.5 px-3 py-0.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isExecuting || !code.trim()}
            className="flex items-center space-x-1.5 px-3 py-0.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Download size={14} />
            <span>Download</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={isExecuting || !code.trim()}
            className="flex items-center space-x-1.5 px-3 py-0.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Upload size={14} />
            <span>{isExecuting ? "Submitting..." : "Submit"}</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isExecuting || !code.trim()}
            className="flex items-center space-x-1.5 px-3 py-0.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Play size={14} />
            <span>{isExecuting ? "Running..." : "Run"}</span>
          </button>
        </div>
      </div>

      {/* Code Editor + Test Cases */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Code Editor */}
        <div className="min-h-0" style={{ height: `${100 - testCaseHeight}%` }}>
          <Editor
            height="100%"
            language={selectedLanguage.monacoLanguage}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme={editorTheme}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            options={{
              fontSize,
              minimap: { enabled: false },
              scrollBeyondLastLine: true,
              automaticLayout: true,
              wordWrap: "on",
            }}
          />
        </div>

        {/* Resize Handle */}
        <div
          className="h-1 bg-gray-700 cursor-row-resize hover:bg-blue-500 transition-colors relative group"
          onMouseDown={handleTestCaseResize}
        >
          <div className="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-blue-500/20"></div>
        </div>

        {/* Test Cases Section */}
        <div
          className="bg-[#262626] border-t border-gray-700 overflow-hidden"
          style={{ height: `${testCaseHeight}%` }}
        >
          <TestCaseManager
            allTestCases={question.testcases || []}
            selectedTestCases={selectedTestCases}
            onTestCaseSelectionChange={setSelectedTestCases}
            results={testCaseResults.length > 0 ? testCaseResults : undefined}
            mode={executionMode === "results" ? "results" : "edit"}
          />
        </div>
      </div>
    </div>
  );
}
