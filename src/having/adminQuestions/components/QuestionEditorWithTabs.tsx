// src/having/adminQuestions/components/QuestionEditorWithTabs.tsx

"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { QuestionEditor } from "./QuestionEditor";
import type { Testcase } from "../types";
import { CodeTemplateEditor } from "./CodeTemplateEditor";
import { TestcaseEditor } from "./TestcaseEditor";

type EditorTab = "statement" | "userStarterCode" | "submitTemplate" | "runTemplate" | "testcases";  // ✅ CHANGED

interface QuestionEditorWithTabsProps {
  // Statement
  statement: string;
  onStatementChange: (content: string) => void;
  onEditorReady?: (editor: Editor) => void;
  
  // Code Templates
  userStarterCode: Record<string, string>;
  onUserStarterCodeChange: (code: Record<string, string>) => void;
  
  submitTemplate: Record<string, string>;          // ✅ RENAMED from generalTemplate
  onSubmitTemplateChange: (code: Record<string, string>) => void;  // ✅ RENAMED
  
  runTemplate: Record<string, string>;             // ✅ RENAMED from correctSolution
  onRunTemplateChange: (code: Record<string, string>) => void;     // ✅ RENAMED
  
  // Testcases
  testcases: Testcase[];
  onTestcasesChange: (testcases: Testcase[]) => void;
}

export function QuestionEditorWithTabs({
  statement,
  onStatementChange,
  onEditorReady,
  userStarterCode,
  onUserStarterCodeChange,
  submitTemplate,           // ✅ RENAMED
  onSubmitTemplateChange,   // ✅ RENAMED
  runTemplate,              // ✅ RENAMED
  onRunTemplateChange,      // ✅ RENAMED
  testcases,
  onTestcasesChange,
}: QuestionEditorWithTabsProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("statement");

  const tabs = [
    { id: "statement" as const, label: "Statement", icon: "📝" },
    { id: "userStarterCode" as const, label: "User Starter Code", icon: "🎯" },
    { id: "submitTemplate" as const, label: "Submit Template", icon: "📤" },  // ✅ RENAMED
    { id: "runTemplate" as const, label: "Run Template", icon: "▶️" },        // ✅ RENAMED
    { id: "testcases" as const, label: "Testcases", icon: "🧪" },
  ];

  return (
    <div className="bg-[#262626] border border-gray-700 rounded-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors cursor-pointer
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400 bg-gray-900/50"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-0">
        {activeTab === "statement" && (
          <QuestionEditor
            content={statement}
            onChange={onStatementChange}
            placeholder="Write your question statement here..."
            onEditorReady={onEditorReady}
          />
        )}

        {activeTab === "userStarterCode" && (
          <CodeTemplateEditor
            code={userStarterCode}
            onChange={onUserStarterCodeChange}
            title="User Starter Code"
            description="The function signature that users will see and complete. Keep it simple and focused. (Max 3,000 characters per language)"
            maxLength={3000}
            placeholder="// Function signature for users to implement"
          />
        )}

        {activeTab === "submitTemplate" && (  // ✅ RENAMED
          <CodeTemplateEditor
            code={submitTemplate}              // ✅ RENAMED
            onChange={onSubmitTemplateChange}  // ✅ RENAMED
            title="Submit Template"            // ✅ RENAMED
            description="Complete template used for submit mode with all test cases. Includes test execution framework. (Max 23,000 characters per language)"  // ✅ UPDATED
            maxLength={23000}
            placeholder="// Complete template for submit mode"
          />
        )}

        {activeTab === "runTemplate" && (  // ✅ RENAMED
          <CodeTemplateEditor
            code={runTemplate}              // ✅ RENAMED
            onChange={onRunTemplateChange}  // ✅ RENAMED
            title="Run Template"            // ✅ RENAMED
            description="Template used for run mode with selected test cases. Used for quick testing. (Max 23,000 characters per language)"  // ✅ UPDATED
            maxLength={23000}
            placeholder="// Template for run mode execution"
          />
        )}

        {activeTab === "testcases" && (
          <TestcaseEditor
            testcases={testcases}
            onChange={onTestcasesChange}
          />
        )}
      </div>
    </div>
  );
}