// src/having/adminSolutions/components/CodeTemplatesManager.tsx

"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { PROGRAMMING_LANGUAGES, SOLUTION_VALIDATION } from "../constants";
import { MonacoCodeEditor } from "./MonacoCodeEditor";

interface CodeTemplatesManagerProps {
  codeTemplates: Record<string, string[]>;
  onChange: (templates: Record<string, string[]>) => void;
}

export function CodeTemplatesManager({ codeTemplates, onChange }: CodeTemplatesManagerProps) {
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(new Set());
  const [selectedLanguage, setSelectedLanguage] = useState<string>("javascript");

  const toggleLanguage = (lang: string) => {
    const newExpanded = new Set(expandedLanguages);
    if (newExpanded.has(lang)) {
      newExpanded.delete(lang);
    } else {
      newExpanded.add(lang);
    }
    setExpandedLanguages(newExpanded);
  };

  const addLanguage = () => {
    if (codeTemplates[selectedLanguage]) return;

    const template = PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage)?.template || "";
    onChange({
      ...codeTemplates,
      [selectedLanguage]: [template],
    });
    setExpandedLanguages(new Set(expandedLanguages).add(selectedLanguage));
  };

  const removeLanguage = (lang: string) => {
    const newTemplates = { ...codeTemplates };
    delete newTemplates[lang];
    onChange(newTemplates);
    const newExpanded = new Set(expandedLanguages);
    newExpanded.delete(lang);
    setExpandedLanguages(newExpanded);
  };

  const addTemplate = (lang: string) => {
    const template = PROGRAMMING_LANGUAGES.find(l => l.value === lang)?.template || "";
    onChange({
      ...codeTemplates,
      [lang]: [...(codeTemplates[lang] || []), template],
    });
  };

  const removeTemplate = (lang: string, index: number) => {
    const templates = [...(codeTemplates[lang] || [])];
    templates.splice(index, 1);
    if (templates.length === 0) {
      removeLanguage(lang);
    } else {
      onChange({
        ...codeTemplates,
        [lang]: templates,
      });
    }
  };

  const updateTemplate = (lang: string, index: number, code: string) => {
    const templates = [...(codeTemplates[lang] || [])];
    templates[index] = code;
    onChange({
      ...codeTemplates,
      [lang]: templates,
    });
  };

  const availableLanguages = PROGRAMMING_LANGUAGES.filter(
    lang => !codeTemplates[lang.value]
  );

  const totalTemplates = Object.values(codeTemplates).reduce(
    (sum, templates) => sum + templates.length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Add Language */}
      <div className="flex items-center gap-2">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availableLanguages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addLanguage}
          disabled={!availableLanguages.length || !!codeTemplates[selectedLanguage]}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          Add Language
        </button>
      </div>

      <div className="text-xs text-gray-400">
        Total Templates: {totalTemplates} / {SOLUTION_VALIDATION.MAX_CODE_TEMPLATES}
      </div>

      {/* Language Sections */}
      <div className="space-y-3">
        {Object.entries(codeTemplates).map(([lang, templates]) => {
          const langLabel = PROGRAMMING_LANGUAGES.find(l => l.value === lang)?.label || lang;
          const isExpanded = expandedLanguages.has(lang);

          return (
            <div key={lang} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800">
              {/* Language Header */}
              <div className="flex items-center justify-between p-3 bg-gray-750 border-b border-gray-700">
                <button
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className="flex items-center gap-2 text-sm font-medium text-white hover:text-blue-400 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                  {langLabel} ({templates.length} template{templates.length !== 1 ? 's' : ''})
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addTemplate(lang)}
                    disabled={totalTemplates >= SOLUTION_VALIDATION.MAX_CODE_TEMPLATES}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-3 h-3" />
                    Add Template
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <TrashIcon className="w-3 h-3" />
                    Remove Language
                  </button>
                </div>
              </div>

              {/* Templates */}
              {isExpanded && (
                <div className="p-3 space-y-3">
                  {templates.map((code, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          Template {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTemplate(lang, index)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <MonacoCodeEditor
                        value={code}
                        onChange={(newCode) => updateTemplate(lang, index, newCode)}
                        language={lang}
                        maxLength={SOLUTION_VALIDATION.CODE_MAX_LENGTH}
                      />
                      <div className={`text-xs ${code.length > SOLUTION_VALIDATION.CODE_MAX_LENGTH * 0.8 ? 'text-orange-400' : 'text-gray-500'}`}>
                        {code.length.toLocaleString()} / {SOLUTION_VALIDATION.CODE_MAX_LENGTH.toLocaleString()} characters
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {Object.keys(codeTemplates).length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No code templates added yet. Select a language and click Add Language to start.
        </div>
      )}
    </div>
  );
}