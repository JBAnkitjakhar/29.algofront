// src/having/adminquestions/components/CodeTemplateEditor.tsx

"use client";

import { useState } from "react";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import { PROGRAMMING_LANGUAGES } from "../constants";
import { MonacoCodeEditor } from "./MonacoCodeEditor";

interface CodeTemplateEditorProps {
  code: Record<string, string>;
  onChange: (code: Record<string, string>) => void;
  title: string;
  description: string;
  maxLength: number;
  placeholder?: string;
}

export function CodeTemplateEditor({
  code,
  onChange,
  title,
  description,
  maxLength,
  placeholder = "// Enter code template...",
}: CodeTemplateEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    Object.keys(code)[0] || null
  );
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const availableLanguages = PROGRAMMING_LANGUAGES.filter(
    (lang) => !code[lang.value]
  );

  const handleAddLanguage = (languageValue: string) => {
    const language = PROGRAMMING_LANGUAGES.find(
      (lang) => lang.value === languageValue
    );
    if (!language) return;

    const newCode = {
      ...code,
      [languageValue]: language.template,
    };
    onChange(newCode);
    setSelectedLanguage(languageValue);
    setShowLanguageDropdown(false);
  };

  const handleRemoveLanguage = (languageValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCode = { ...code };
    delete newCode[languageValue];
    onChange(newCode);

    // Select another language if available
    const remainingLanguages = Object.keys(newCode);
    setSelectedLanguage(remainingLanguages[0] || null);
  };

  const handleCodeChange = (languageValue: string, newCode: string) => {
    onChange({
      ...code,
      [languageValue]: newCode,
    });
  };

  const currentCode = selectedLanguage ? code[selectedLanguage] || "" : "";
  const currentLength = currentCode.length;
  const isOverLimit = currentLength > maxLength;
  const isWarning = currentLength > maxLength * 0.8;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>

      {/* Language Selector */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(code).map((langValue) => {
          const language = PROGRAMMING_LANGUAGES.find(
            (l) => l.value === langValue
          );
          return (
            <div
              key={langValue}
              onClick={() => setSelectedLanguage(langValue)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                transition-colors cursor-pointer
                ${
                  selectedLanguage === langValue
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }
              `}
            >
              {language?.label || langValue}
              <button
                type="button"
                onClick={(e) => handleRemoveLanguage(langValue, e)}
                className="hover:text-red-400 cursor-pointer"
                title="Remove language"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Add Language Dropdown */}
        {availableLanguages.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 border border-dashed border-gray-600 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Language
            </button>

            {/* Dropdown Menu */}
            {showLanguageDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLanguageDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => handleAddLanguage(lang.value)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Code Editor */}
      {selectedLanguage ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-300">
              Code Template
            </label>
            <div
              className={`text-xs ${
                isOverLimit
                  ? "text-red-400 font-semibold"
                  : isWarning
                  ? "text-yellow-400"
                  : "text-gray-500"
              }`}
            >
              {currentLength.toLocaleString()} / {maxLength.toLocaleString()}{" "}
              characters
            </div>
          </div>

          <MonacoCodeEditor
            value={currentCode}
            onChange={(newCode) => handleCodeChange(selectedLanguage, newCode)}
            language={selectedLanguage}
            placeholder={placeholder}
            maxLength={maxLength}
          />

          {isOverLimit && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">
                Code exceeds the maximum length of {maxLength.toLocaleString()}{" "}
                characters. Please shorten it before saving.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No languages added yet.</p>
          <p className="text-sm mt-1">Click Add Language to get started.</p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-md">
        <p className="text-sm text-blue-400">
          💡 <strong>Tip:</strong> Add templates for multiple programming
          languages to give users more options.
        </p>
      </div>
    </div>
  );
}