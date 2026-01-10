// src/app/admin/solutions/[id]/edit/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Editor } from "@tiptap/react";
import {
  Loader2Icon,
  SaveIcon,
  HelpCircleIcon,
  AlertTriangleIcon,
  XIcon,
  ImageIcon,
} from "lucide-react";
import {
  SolutionEditorSidebar,
  SolutionContentArea,
} from "@/having/adminSolutions/components";
import {
  useSolutionDetail,
  useUpdateSolution,
} from "@/having/adminSolutions/hooks";
import { ADMIN_ROUTES } from "@/constants";
import { SOLUTION_VALIDATION } from "@/having/adminSolutions/constants";
import type { UpdateSolutionRequest } from "@/having/adminSolutions/types";
import toast from "react-hot-toast";
import Image from "next/image";
import apiClient from "@/lib/api/client";

export default function EditSolutionPage() {
  const router = useRouter();
  const params = useParams();
  const solutionId = params?.id as string;

  const [editor, setEditor] = useState<Editor | null>(null);
  const [formData, setFormData] = useState<UpdateSolutionRequest>({
    questionId: "",
    content: "",
    imageUrls: [],
    visualizerFileIds: [],
    codeTemplates: {},
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [contentCharCount, setContentCharCount] = useState(0);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);

  const { data: solution, isLoading: solutionLoading } = useSolutionDetail(
    solutionId,
    true
  );
  const updateSolutionMutation = useUpdateSolution();

  useEffect(() => {
    if (solution && !isInitialized) {
      const timer = setTimeout(() => {
        setFormData({
          questionId: solution.questionId,
          content: solution.content,
          imageUrls: solution.imageUrls || [],
          visualizerFileIds: solution.visualizerFileIds || [],
          codeTemplates: solution.codeTemplates || {},
          youtubeLink: solution.youtubeLink || undefined,
          driveLink: solution.driveLink || undefined,
        });
        setContentCharCount(solution.content.trim().length);
        setIsInitialized(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [solution, isInitialized]);

  const extractImagesFromContent = useCallback(
    (htmlContent: string): string[] => {
      if (typeof window === "undefined") return [];
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const images = doc.querySelectorAll("img");
      return Array.from(images).map((img) => img.src);
    },
    []
  );

  const handleImageUpload = useCallback((imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), imageUrl],
    }));
  }, []);

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
        setFormData((prev) => ({ ...prev, content: updatedHtml }));
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

  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];

    if (!formData.content?.trim()) {
      errors.push("Solution content is required");
    } else {
      const charCount = formData.content.trim().length;
      if (charCount < SOLUTION_VALIDATION.CONTENT_MIN_LENGTH) {
        errors.push(
          `Content must be at least ${SOLUTION_VALIDATION.CONTENT_MIN_LENGTH} characters`
        );
      }
      if (charCount > SOLUTION_VALIDATION.CONTENT_MAX_LENGTH) {
        errors.push(
          `Content must be less than ${SOLUTION_VALIDATION.CONTENT_MAX_LENGTH} characters`
        );
      }
    }

    if (formData.codeTemplates && Object.keys(formData.codeTemplates).length > 0) {
      for (const [lang, codes] of Object.entries(formData.codeTemplates)) {
        codes.forEach((code, index) => {
          if (code.length > SOLUTION_VALIDATION.CODE_MAX_LENGTH) {
            errors.push(
              `${lang} template ${index + 1} exceeds ${SOLUTION_VALIDATION.CODE_MAX_LENGTH.toLocaleString()} characters`
            );
          }
        });
      }
    }

    return errors;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const imagesInContent = extractImagesFromContent(formData.content || "");

    const updatedFormData = {
      ...formData,
      imageUrls: imagesInContent,
    };

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const hasChanges =
      updatedFormData.content !== solution?.content ||
      JSON.stringify(updatedFormData.codeTemplates) !==
        JSON.stringify(solution?.codeTemplates) ||
      updatedFormData.youtubeLink !== solution?.youtubeLink ||
      updatedFormData.driveLink !== solution?.driveLink ||
      JSON.stringify(updatedFormData.visualizerFileIds) !==
        JSON.stringify(solution?.visualizerFileIds);

    if (!hasChanges) {
      setErrors(["No changes detected"]);
      return;
    }

    setErrors([]);

    updateSolutionMutation.mutate(
      { id: solutionId, request: updatedFormData },
      {
        onSuccess: () => {
          router.push(ADMIN_ROUTES.SOLUTIONS);
        },
      }
    );
  };

  const updateFormData = <T extends keyof UpdateSolutionRequest>(
    field: T,
    value: UpdateSolutionRequest[T]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContentChange = useCallback((content: string) => {
    setFormData((prev) => ({ ...prev, content }));
    setContentCharCount(content.trim().length);
  }, []);

  const handleVisualizerFileIdsChange = useCallback((fileIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      visualizerFileIds: fileIds,
    }));
  }, []);

  const handleYoutubeLinkChange = (link: string) => {
    updateFormData("youtubeLink", link.trim() || undefined);
  };

  const handleDriveLinkChange = (link: string) => {
    updateFormData("driveLink", link.trim() || undefined);
  };

  const isOverLimit = contentCharCount > SOLUTION_VALIDATION.CONTENT_MAX_LENGTH;
  const isWarning =
    contentCharCount > SOLUTION_VALIDATION.CONTENT_MAX_LENGTH * 0.8;

  const currentImages = extractImagesFromContent(formData.content || "");

  if (solutionLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1A1A1A]">
        <div className="text-center">
          <Loader2Icon className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading solution...</p>
        </div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1A1A1A]">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center max-w-md">
          <h3 className="text-lg font-medium text-red-300">
            Solution Not Found
          </h3>
          <p className="mt-2 text-sm text-red-400">
            The solution youre looking for doesnt exist or has been deleted.
          </p>
          <button
            onClick={() => router.push(ADMIN_ROUTES.SOLUTIONS)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Solutions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      <SolutionEditorSidebar
        editor={editor}
        onImageUpload={handleImageUpload}
      />

      <div className="flex-1 flex flex-col max-w-5xl mx-auto px-6 py-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Edit Solution</h1>
          <p className="mt-1 text-sm text-gray-400">
            Update the solution details, content, and resources
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-white">
              Question: {solution.questionId}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Created {new Date(solution.createdAt).toLocaleDateString()} by{" "}
              {solution.createdByName}
            </div>
          </div>

          <div className="bg-[#262626] border border-gray-700 rounded-lg overflow-hidden">
            <SolutionContentArea
              content={formData.content || ""}
              onContentChange={handleContentChange}
              onEditorReady={setEditor}
              solutionId={solutionId}
              visualizerFileIds={formData.visualizerFileIds || []}
              onVisualizerFileIdsChange={handleVisualizerFileIdsChange}
              codeTemplates={formData.codeTemplates || {}}
              onCodeTemplatesChange={(templates) =>
                updateFormData("codeTemplates", templates)
              }
              youtubeLink={formData.youtubeLink}
              onYoutubeLinkChange={handleYoutubeLinkChange}
              driveLink={formData.driveLink}
              onDriveLinkChange={handleDriveLinkChange}
            />
          </div>

          {currentImages.length > 0 && (
            <div className="bg-[#262626] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Uploaded Images ({currentImages.length}/
                  {SOLUTION_VALIDATION.MAX_IMAGES_PER_SOLUTION})
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
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
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
                SOLUTION_VALIDATION.MAX_IMAGES_PER_SOLUTION && (
                <p className="text-xs text-orange-400 mt-2">
                  Maximum image limit reached
                </p>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="w-72 border-l border-gray-700 bg-[#262626] flex-shrink-0">
        <div className="sticky top-0 p-4 space-y-4 max-h-screen overflow-y-auto">
          <div className="space-y-2">
            <button
              onClick={handleSubmit}
              disabled={updateSolutionMutation.isPending || isOverLimit}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {updateSolutionMutation.isPending ? (
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
              onClick={() => router.push(ADMIN_ROUTES.SOLUTIONS)}
              className="w-full px-4 py-2.5 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>

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
                  📊 Content Length
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
                      {contentCharCount.toLocaleString()} /{" "}
                      {SOLUTION_VALIDATION.CONTENT_MAX_LENGTH.toLocaleString()}
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
                          (contentCharCount /
                            SOLUTION_VALIDATION.CONTENT_MAX_LENGTH) *
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

          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2 text-gray-300 font-medium">
              <HelpCircleIcon className="w-5 h-5" />
              <span>Quick Help</span>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-1">💻 Code Templates</h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Max 20k chars per template</li>
                <li>• Max 10 templates total</li>
                <li>• Multiple templates per language</li>
              </ul>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-1">🖼️ Media</h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Max 2MB per image</li>
                <li>• Max 10 images per solution</li>
                <li>• Max 2 HTML visualizers (500KB each)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}