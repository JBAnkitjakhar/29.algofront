// src/app/admin/questions/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Editor } from "@tiptap/react";
import {
  QuestionEditorSidebar,
  QuestionEditorWithTabs,
} from "@/having/adminQuestions/components";
import {
  useQuestionDetail,
  useUpdateQuestion,
  useCategoriesMetadata,
} from "@/having/adminQuestions/hooks";
import { ADMIN_ROUTES, QUESTION_LEVEL_LABELS } from "@/constants";
import { QUESTION_VALIDATION } from "@/having/adminQuestions/constants";
import type {
  UpdateQuestionRequest,
  QuestionLevel,
} from "@/having/adminQuestions/types";
import {
  Loader2Icon,
  SaveIcon,
  HelpCircleIcon,
  AlertTriangleIcon,
  XIcon,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import apiClient from "@/lib/api/client";

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params?.id as string;

  const [editor, setEditor] = useState<Editor | null>(null);
  const [formData, setFormData] = useState<UpdateQuestionRequest>({
    title: "",
    statement: "",
    categoryId: "",
    level: "EASY",
    displayOrder: 1,
    methodName: "",
    imageUrls: [],
    userStarterCode: {},
    correctSolution: {},
    testcases: [],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [statementCharCount, setStatementCharCount] = useState(0);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);

  const { data: question, isLoading: questionLoading } = useQuestionDetail(
    questionId,
    true
  );
  const { data: categories, isLoading: categoriesLoading } =
    useCategoriesMetadata();
  const updateQuestionMutation = useUpdateQuestion();

  useEffect(() => {
    if (question && !isInitialized) {
      const timer = setTimeout(() => {
        setFormData({
          version: question.version,
          title: question.title,
          statement: question.statement,
          categoryId: question.categoryId,
          level: question.level,
          displayOrder: question.displayOrder,
          methodName: question.methodName,
          imageUrls: question.imageUrls || [],
          userStarterCode: question.userStarterCode || {},
          correctSolution: question.correctSolution || {},
          testcases: question.testcases || [],
        });
        setStatementCharCount(question.statement.trim().length);
        setIsInitialized(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [question, isInitialized]);

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

      toast.success("Image deleted successfully");
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

    const title = formData.title || "";
    const statement = formData.statement || "";
    const methodName = formData.methodName || "";

    // Title validation
    if (!title.trim()) {
      errors.push("Question title is required");
    } else {
      if (title.trim().length < QUESTION_VALIDATION.TITLE_MIN_LENGTH) {
        errors.push(
          `Title must be at least ${QUESTION_VALIDATION.TITLE_MIN_LENGTH} characters`
        );
      }
      if (title.trim().length > QUESTION_VALIDATION.TITLE_MAX_LENGTH) {
        errors.push(
          `Title must be less than ${QUESTION_VALIDATION.TITLE_MAX_LENGTH} characters`
        );
      }
    }

    // Method Name validation
    if (!methodName.trim()) {
      errors.push("Method name is required");
    } else {
      if (methodName.trim().length < QUESTION_VALIDATION.METHOD_NAME_MIN_LENGTH) {
        errors.push(
          `Method name must be at least ${QUESTION_VALIDATION.METHOD_NAME_MIN_LENGTH} characters`
        );
      }
      if (methodName.trim().length > QUESTION_VALIDATION.METHOD_NAME_MAX_LENGTH) {
        errors.push(
          `Method name must be less than ${QUESTION_VALIDATION.METHOD_NAME_MAX_LENGTH} characters`
        );
      }
    }

    // Statement validation
    if (!statement.trim()) {
      errors.push("Question statement is required");
    } else {
      const charCount = statement.trim().length;
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

    // Correct Solution validation
    Object.entries(formData.correctSolution || {}).forEach(([lang, code]) => {
      if (code.length > QUESTION_VALIDATION.CORRECT_SOLUTION_MAX_LENGTH) {
        errors.push(
          `Correct solution for ${lang} exceeds ${QUESTION_VALIDATION.CORRECT_SOLUTION_MAX_LENGTH} characters`
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

    const imagesInStatement = extractImagesFromStatement(
      formData.statement || ""
    );

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

    const hasChanges =
      updatedFormData.title !== question?.title ||
      updatedFormData.statement !== question?.statement ||
      updatedFormData.categoryId !== question?.categoryId ||
      updatedFormData.level !== question?.level ||
      updatedFormData.displayOrder !== question?.displayOrder ||
      updatedFormData.methodName !== question?.methodName ||
      JSON.stringify(updatedFormData.imageUrls) !==
        JSON.stringify(question?.imageUrls) ||
      JSON.stringify(updatedFormData.userStarterCode) !==
        JSON.stringify(question?.userStarterCode) ||
      JSON.stringify(updatedFormData.correctSolution) !==
        JSON.stringify(question?.correctSolution) ||
      JSON.stringify(updatedFormData.testcases) !==
        JSON.stringify(question?.testcases);

    if (!hasChanges) {
      setErrors(["No changes detected"]);
      toast.error("No changes to save");
      return;
    }

    setErrors([]);

    updateQuestionMutation.mutate(
      { id: questionId, request: updatedFormData },
      {
        onSuccess: () => {
          router.push(ADMIN_ROUTES.QUESTIONS);
        },
      }
    );
  };

  const updateFormData = <T extends keyof UpdateQuestionRequest>(
    field: T,
    value: UpdateQuestionRequest[T]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isOverLimit =
    statementCharCount > QUESTION_VALIDATION.STATEMENT_MAX_LENGTH;
  const isWarning =
    statementCharCount > QUESTION_VALIDATION.STATEMENT_MAX_LENGTH * 0.8;

  const currentImages = extractImagesFromStatement(formData.statement || "");

  if (questionLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1A1A1A]">
        <div className="text-center">
          <Loader2Icon className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1A1A1A]">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center max-w-md">
          <h3 className="text-lg font-medium text-red-300">
            Question Not Found
          </h3>
          <p className="mt-2 text-sm text-red-400">
            The question youre looking for doesnt exist or has been deleted.
          </p>
          <button
            onClick={() => router.push(ADMIN_ROUTES.QUESTIONS)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
          >
            Back to Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      <QuestionEditorSidebar
        editor={editor}
        onImageUpload={handleImageUpload}
      />

      <div className="flex-1 max-w-5xl mx-auto px-6 py-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Edit Question</h1>
          <p className="mt-1 text-sm text-gray-400">
            Update the question details, statement, code templates, and
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
              value={formData.title || ""}
              onChange={(e) => updateFormData("title", e.target.value)}
              className="w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter question title..."
              maxLength={QUESTION_VALIDATION.TITLE_MAX_LENGTH}
            />
            <div className="mt-1 text-xs text-gray-500">
              {(formData.title || "").length}/
              {QUESTION_VALIDATION.TITLE_MAX_LENGTH} characters
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
              value={formData.methodName || ""}
              onChange={(e) => updateFormData("methodName", e.target.value)}
              className="w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., numDistinctIslands, twoSum, etc."
              maxLength={QUESTION_VALIDATION.METHOD_NAME_MAX_LENGTH}
            />
            <div className="mt-1 text-xs text-gray-500">
              {(formData.methodName || "").length}/
              {QUESTION_VALIDATION.METHOD_NAME_MAX_LENGTH} characters
            </div>
          </div>

          {/* Category, Level, Display Order */}
          <div className="bg-[#262626] border border-gray-700 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => updateFormData("categoryId", e.target.value)}
                  className="w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
                  disabled={categoriesLoading}
                >
                  <option value="">Select a category</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="level"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Difficulty Level *
                </label>
                <select
                  id="level"
                  value={formData.level}
                  onChange={(e) =>
                    updateFormData("level", e.target.value as QuestionLevel)
                  }
                  className="w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
                >
                  {Object.entries(QUESTION_LEVEL_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="displayOrder"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Display Order *
                </label>
                <input
                  type="number"
                  id="displayOrder"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    updateFormData(
                      "displayOrder",
                      parseInt(e.target.value) || 1
                    )
                  }
                  min="1"
                  className="w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tabbed Editor */}
          <QuestionEditorWithTabs
            statement={formData.statement || ""}
            onStatementChange={(content) => {
              updateFormData("statement", content);
              setStatementCharCount(content.trim().length);
            }}
            onEditorReady={setEditor}
            userStarterCode={formData.userStarterCode || {}}
            onUserStarterCodeChange={(code) =>
              updateFormData("userStarterCode", code)
            }
            correctSolution={formData.correctSolution || {}}
            onCorrectSolutionChange={(code) =>
              updateFormData("correctSolution", code)
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
              disabled={updateQuestionMutation.isPending || isOverLimit}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              {updateQuestionMutation.isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4" />
                  Save Changes
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
                ✅ Correct Solution
              </h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Complete solution</li>
                <li>• 23k chars per language</li>
                <li>• Working implementation</li>
              </ul>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-1">🧪 Testcases</h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• JSON input/output</li>
                <li>• 30k chars total</li>
                <li>• Time limits (ms)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}