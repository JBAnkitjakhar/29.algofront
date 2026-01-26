// src/app/admin/questions/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Editor } from "@tiptap/react";
import {
  QuestionEditorSidebar,
  QuestionEditorWithTabs,
} from "@/having/adminQuestions/components";
import {
  useCreateQuestion,
  useCategoriesMetadata,
} from "@/having/adminQuestions/hooks";
import { ADMIN_ROUTES, QUESTION_LEVEL_LABELS } from "@/constants";
import { QUESTION_VALIDATION } from "@/having/adminQuestions/constants";
import type {
  CreateQuestionRequest,
  QuestionLevel,
} from "@/having/adminQuestions/types";
import {
  SaveIcon,
  Loader2Icon,
  HelpCircleIcon,
  AlertTriangleIcon,
  XIcon,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import apiClient from "@/lib/api/client";

export default function CreateQuestionPage() {
  const router = useRouter();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [formData, setFormData] = useState<CreateQuestionRequest>({
    title: "",
    statement: "",
    categoryId: "",
    level: "EASY",
    displayOrder: 1,
    methodName: "",
    imageUrls: [],
    userStarterCode: {},
    submitTemplate: {},    // ✅ RENAMED from correctSolution
    runTemplate: {},       // ✅ NEW
    testcases: [],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [statementCharCount, setStatementCharCount] = useState(0);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);

  const { data: categories, isLoading: categoriesLoading } =
    useCategoriesMetadata();
  const createQuestionMutation = useCreateQuestion();

  const extractImagesFromStatement = (htmlContent: string): string[] => {
    if (typeof window === "undefined") return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const images = doc.querySelectorAll("img");
    return Array.from(images).map((img) => img.src);
  };

  const handleImageUpload = (imageUrl: string) => {
    console.log("✅ Image uploaded:", imageUrl);
  };

  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      const match = url.match(/\/upload\/v\d+\/(.+)\.[^.]+$/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    } catch (error) {
      console.error("Error extracting public_id:", error);
      return null;
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (
      !confirm(
        "Delete this image? It will be removed from Cloudinary immediately."
      )
    ) {
      return;
    }

    setIsDeletingImage(imageUrl);

    try {
      const publicId = extractPublicIdFromUrl(imageUrl);

      if (!publicId) {
        throw new Error("Could not extract public_id from image URL");
      }

      const response = await apiClient.delete(
        `/files/images?publicId=${encodeURIComponent(publicId)}`
      );

      if (!response.success) {
        throw new Error(response.message || "Delete failed");
      }

      setFormData((prev) => ({
        ...prev,
        imageUrls: (prev.imageUrls || []).filter((url) => url !== imageUrl),
      }));

      if (editor) {
        const currentHtml = editor.getHTML();
        const parser = new DOMParser();
        const doc = parser.parseFromString(currentHtml, "text/html");
        const images = doc.querySelectorAll("img");

        images.forEach((img) => {
          if (img.src === imageUrl) {
            img.remove();
          }
        });

        const updatedHtml = doc.body.innerHTML;
        editor.commands.setContent(updatedHtml);
        setFormData((prev) => ({ ...prev, statement: updatedHtml }));
      }

      toast.success("Image deleted successfully from Cloudinary");
    } catch (error: unknown) {
      console.error("❌ Delete failed:", error);

      let errorMessage = "Failed to delete image";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const apiError = error as {
          response?: { data?: { message?: string }; status?: number };
        };
        errorMessage = apiError.response?.data?.message || errorMessage;
      }

      toast.error(`Failed to delete: ${errorMessage}`);
    } finally {
      setIsDeletingImage(null);
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Title validation
    if (!formData.title.trim()) {
      errors.push("Question title is required");
    } else {
      if (formData.title.trim().length < QUESTION_VALIDATION.TITLE_MIN_LENGTH) {
        errors.push(
          `Title must be at least ${QUESTION_VALIDATION.TITLE_MIN_LENGTH} characters`
        );
      }
      if (formData.title.trim().length > QUESTION_VALIDATION.TITLE_MAX_LENGTH) {
        errors.push(
          `Title must be less than ${QUESTION_VALIDATION.TITLE_MAX_LENGTH} characters`
        );
      }
    }

    // Method Name validation
    if (!formData.methodName.trim()) {
      errors.push("Method name is required");
    } else {
      if (formData.methodName.trim().length < QUESTION_VALIDATION.METHOD_NAME_MIN_LENGTH) {
        errors.push(
          `Method name must be at least ${QUESTION_VALIDATION.METHOD_NAME_MIN_LENGTH} characters`
        );
      }
      if (formData.methodName.trim().length > QUESTION_VALIDATION.METHOD_NAME_MAX_LENGTH) {
        errors.push(
          `Method name must be less than ${QUESTION_VALIDATION.METHOD_NAME_MAX_LENGTH} characters`
        );
      }
    }

    // Statement validation
    if (!formData.statement.trim()) {
      errors.push("Question statement is required");
    } else {
      const charCount = formData.statement.trim().length;
      setStatementCharCount(charCount);

      if (charCount < QUESTION_VALIDATION.STATEMENT_MIN_LENGTH) {
        errors.push(
          `Statement must be at least ${QUESTION_VALIDATION.STATEMENT_MIN_LENGTH} characters`
        );
      }
      if (charCount > QUESTION_VALIDATION.STATEMENT_MAX_LENGTH) {
        errors.push(
          `Statement must be less than ${QUESTION_VALIDATION.STATEMENT_MAX_LENGTH} characters`
        );
      }
    }

    // Category validation
    if (!formData.categoryId) {
      errors.push("Category is required");
    }

    // Display order validation
    if (!formData.displayOrder || formData.displayOrder < 1) {
      errors.push("Display order must be at least 1");
    }

    // User Starter Code validation
    Object.entries(formData.userStarterCode || {}).forEach(([lang, code]) => {
      if (code.length > QUESTION_VALIDATION.USER_STARTER_CODE_MAX_LENGTH) {
        errors.push(
          `User starter code for ${lang} exceeds ${QUESTION_VALIDATION.USER_STARTER_CODE_MAX_LENGTH} characters`
        );
      }
    });

    // Submit Template validation  // ✅ RENAMED
    Object.entries(formData.submitTemplate || {}).forEach(([lang, code]) => {
      if (code.length > QUESTION_VALIDATION.SUBMIT_TEMPLATE_MAX_LENGTH) {
        errors.push(
          `Submit template for ${lang} exceeds ${QUESTION_VALIDATION.SUBMIT_TEMPLATE_MAX_LENGTH} characters`
        );
      }
    });

    // Run Template validation  // ✅ NEW
    Object.entries(formData.runTemplate || {}).forEach(([lang, code]) => {
      if (code.length > QUESTION_VALIDATION.RUN_TEMPLATE_MAX_LENGTH) {
        errors.push(
          `Run template for ${lang} exceeds ${QUESTION_VALIDATION.RUN_TEMPLATE_MAX_LENGTH} characters`
        );
      }
    });

    // Testcases validation
    const testcasesSize = JSON.stringify(formData.testcases).length;
    if (testcasesSize > QUESTION_VALIDATION.TESTCASES_MAX_LENGTH) {
      errors.push(
        `Testcases exceed ${QUESTION_VALIDATION.TESTCASES_MAX_LENGTH} characters total`
      );
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const imagesInStatement = extractImagesFromStatement(formData.statement);

    const updatedFormData = {
      ...formData,
      imageUrls: imagesInStatement,
    };

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    setErrors([]);

    createQuestionMutation.mutate(updatedFormData, {
      onSuccess: () => {
        router.push(ADMIN_ROUTES.QUESTIONS);
      },
    });
  };

  const updateFormData = <T extends keyof CreateQuestionRequest>(
    field: T,
    value: CreateQuestionRequest[T]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isOverLimit =
    statementCharCount > QUESTION_VALIDATION.STATEMENT_MAX_LENGTH;
  const isWarning =
    statementCharCount > QUESTION_VALIDATION.STATEMENT_MAX_LENGTH * 0.8;

  const currentImages = extractImagesFromStatement(formData.statement);

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      <QuestionEditorSidebar
        editor={editor}
        onImageUpload={handleImageUpload}
      />

      <div className="flex-1 max-w-5xl mx-auto px-6 py-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Create New Question
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Add a new coding question with statement, code templates, and
            testcases
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-[#262626] border border-gray-700 rounded-lg p-6">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Question Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData("title", e.target.value)}
              className="w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter question title..."
              maxLength={QUESTION_VALIDATION.TITLE_MAX_LENGTH}
            />
            <div className="mt-1 text-xs text-gray-500">
              {formData.title.length}/{QUESTION_VALIDATION.TITLE_MAX_LENGTH}{" "}
              characters
            </div>
          </div>

          {/* Method Name */}
          <div className="bg-[#262626] border border-gray-700 rounded-lg p-6">
            <label
              htmlFor="methodName"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Method Name *
            </label>
            <input
              type="text"
              id="methodName"
              value={formData.methodName}
              onChange={(e) => updateFormData("methodName", e.target.value)}
              className="w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., numDistinctIslands, twoSum, etc."
              maxLength={QUESTION_VALIDATION.METHOD_NAME_MAX_LENGTH}
            />
            <div className="mt-1 text-xs text-gray-500">
              {formData.methodName.length}/{QUESTION_VALIDATION.METHOD_NAME_MAX_LENGTH}{" "}
              characters
            </div>
          </div>

          {/* Category and Level */}
          <div className="bg-[#262626] border border-gray-700 rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => updateFormData("categoryId", e.target.value)}
                className="w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
                disabled={categoriesLoading}
              >
                <option value="">Select category...</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty Level *
              </label>
              <select
                value={formData.level}
                onChange={(e) =>
                  updateFormData("level", e.target.value as QuestionLevel)
                }
                className="w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
              >
                {Object.entries(QUESTION_LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Order *
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  updateFormData("displayOrder", parseInt(e.target.value) || 1)
                }
                min={1}
                className="w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabbed Editor */}
          <QuestionEditorWithTabs
            statement={formData.statement}
            onStatementChange={(content) => {
              updateFormData("statement", content);
              setStatementCharCount(content.trim().length);
            }}
            onEditorReady={setEditor}
            userStarterCode={formData.userStarterCode || {}}
            onUserStarterCodeChange={(code) =>
              updateFormData("userStarterCode", code)
            }
            submitTemplate={formData.submitTemplate || {}}        // ✅ RENAMED
            onSubmitTemplateChange={(code) =>                     // ✅ RENAMED
              updateFormData("submitTemplate", code)
            }
            runTemplate={formData.runTemplate || {}}              // ✅ NEW
            onRunTemplateChange={(code) =>                        // ✅ NEW
              updateFormData("runTemplate", code)
            }
            testcases={formData.testcases || []}
            onTestcasesChange={(testcases) =>
              updateFormData("testcases", testcases)
            }
          />

          {/* Uploaded Images Section */}
          {currentImages.length > 0 && (
            <div className="bg-[#262626] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Uploaded Images ({currentImages.length}/
                  {QUESTION_VALIDATION.MAX_IMAGES_PER_QUESTION})
                </label>
                <span className="text-xs text-gray-500">
                  Click X to delete from Cloudinary
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group border border-gray-700 rounded-lg overflow-hidden bg-gray-800"
                  >
                    <Image
                      src={imageUrl}
                      alt={`Uploaded ${index + 1}`}
                      width={300}
                      height={200}
                      className="w-full h-32 object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(imageUrl)}
                      disabled={isDeletingImage === imageUrl}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 cursor-pointer"
                      title="Delete from Cloudinary"
                    >
                      {isDeletingImage === imageUrl ? (
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                      ) : (
                        <XIcon className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span className="truncate">Image {index + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {currentImages.length >=
                QUESTION_VALIDATION.MAX_IMAGES_PER_QUESTION && (
                <p className="text-xs text-orange-400 mt-2">
                  Maximum image limit reached
                </p>
              )}
            </div>
          )}

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-300 mb-2">
                Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-400">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 border-l border-gray-700 bg-[#262626] flex-shrink-0">
        <div className="sticky top-0 p-4 space-y-4 max-h-screen overflow-y-auto">
          <div className="space-y-2">
            <button
              onClick={handleSubmit}
              disabled={createQuestionMutation.isPending || isOverLimit}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              {createQuestionMutation.isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4" />
                  Create Question
                </>
              )}
            </button>
            <button
              onClick={() => router.push(ADMIN_ROUTES.QUESTIONS)}
              className="w-full px-4 py-2.5 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Statement Character Count */}
          <div
            className={`p-4 rounded-lg border-2 transition-all ${
              isOverLimit
                ? "bg-red-900/20 border-red-600"
                : isWarning
                ? "bg-yellow-900/20 border-yellow-600"
                : "bg-blue-900/20 border-blue-600"
            }`}
          >
            <div className="flex items-start space-x-2 mb-2">
              {isOverLimit && (
                <AlertTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold text-sm mb-1 ${
                    isOverLimit
                      ? "text-red-300"
                      : isWarning
                      ? "text-yellow-300"
                      : "text-blue-300"
                  }`}
                >
                  📊 Statement Length
                </h3>
                <div
                  className={`space-y-1 text-xs ${
                    isOverLimit
                      ? "text-red-400"
                      : isWarning
                      ? "text-yellow-400"
                      : "text-blue-400"
                  }`}
                >
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span className="font-semibold">
                      {statementCharCount.toLocaleString()} /{" "}
                      {QUESTION_VALIDATION.STATEMENT_MAX_LENGTH.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isOverLimit
                          ? "bg-red-500"
                          : isWarning
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (statementCharCount /
                            QUESTION_VALIDATION.STATEMENT_MAX_LENGTH) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-red-300 mb-2">
                Validation Errors
              </h3>
              <ul className="text-xs text-red-400 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Help */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2 text-gray-300 font-medium">
              <HelpCircleIcon className="w-5 h-5" />
              <span>Quick Help</span>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-1">📝 Statement</h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Use rich text editor</li>
                <li>• Max 15k characters</li>
                <li>• Images auto-uploaded</li>
              </ul>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-1">
                🎯 User Starter Code
              </h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Function signature only</li>
                <li>• 3k chars per language</li>
                <li>• Multiple languages OK</li>
              </ul>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-1">
                📤 Submit Template
              </h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• For submit mode</li>
                <li>• 23k chars per language</li>
                <li>• Full test framework</li>
              </ul>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-1">
                ▶️ Run Template
              </h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• For run mode</li>
                <li>• 23k chars per language</li>
                <li>• Quick test execution</li>
              </ul>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-1">🧪 Testcases</h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• JSON input/output</li>
                <li>• 30k chars total</li>
                <li>• Ordered parameters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}