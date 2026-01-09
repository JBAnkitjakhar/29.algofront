// src/having/adminSolutions/components/SolutionCard.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  PhotoIcon,
  PlayIcon,
  FolderOpenIcon,
  CubeTransparentIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/useAuth";
import { dateUtils } from "@/lib/utils/common";
import { QUESTION_LEVEL_LABELS, QUESTION_LEVEL_COLORS, ADMIN_ROUTES } from "@/constants";
import type { SolutionWithQuestion } from "../types";
import { DeleteSolutionModal } from "./DeleteSolutionModal";

interface SolutionCardProps {
  solution: SolutionWithQuestion;
}

export function SolutionCard({ solution }: SolutionCardProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isAdmin } = useAuth();

  const levelColors = QUESTION_LEVEL_COLORS[solution.questionLevel];

  const handleEdit = () => {
    router.push(`${ADMIN_ROUTES.SOLUTIONS}/${solution.id}/edit`);
  };

  // Check if code templates exist
  const hasCodeTemplates = solution.codeTemplatesCounts && 
    Object.keys(solution.codeTemplatesCounts).length > 0;

  // Format code templates for tooltip
  const codeTemplatesInfo = hasCodeTemplates
    ? Object.entries(solution.codeTemplatesCounts)
        .map(([lang, count]) => `${lang}: ${count}`)
        .join(", ")
    : "";

  // Check if has any media assets
  const hasMediaAssets = solution.imageCount > 0 || 
    solution.visualizerCount > 0 || 
    solution.hasYoutubeLink || 
    solution.hasDriveLink;

  return (
    <>
      <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] shadow-xl rounded-xl border border-gray-700/50 hover:shadow-2xl hover:border-blue-500/30 hover:scale-[1.02] transition-all duration-300">
        <div className="p-6">
          {/* Header with Title and Actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-violet-500 font-bol mb-3 line-clamp-2 leading-tight">
                {solution.questionTitle}
              </h3>
            </div>

            {isAdmin() && (
              <div className="flex space-x-2 ml-4 flex-shrink-0">
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center p-2.5 border border-gray-600 rounded-lg text-gray-300 bg-gray-800/50 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-200 cursor-pointer"
                  title="Edit solution"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center p-2.5 border border-gray-600 rounded-lg text-red-400 bg-gray-800/50 hover:bg-red-600 hover:text-white hover:border-red-500 transition-all duration-200 cursor-pointer"
                  title="Delete solution"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Difficulty & Code Templates in same row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 ${levelColors.bg} ${levelColors.text} ${levelColors.border}`}
            >
              {QUESTION_LEVEL_LABELS[solution.questionLevel]}
            </span>

            {hasCodeTemplates && (
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-900/40 to-emerald-900/40 text-green-300 rounded-full text-xs font-medium border border-green-500/40 cursor-pointer hover:border-green-400 transition-colors"
                title={codeTemplatesInfo}
              >
                <CodeBracketIcon className="h-3.5 w-3.5" />
                Code Templates
              </span>
            )}
          </div>

          {/* Media Assets Section */}
          {hasMediaAssets && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {solution.imageCount > 0 && (
                  <div className="flex items-center gap-1.5 text-blue-300 bg-gradient-to-r from-blue-900/40 to-blue-800/40 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-500/40">
                    <PhotoIcon className="h-3.5 w-3.5" />
                    {solution.imageCount} {solution.imageCount === 1 ? "Image" : "Images"}
                  </div>
                )}

                {solution.visualizerCount > 0 && (
                  <div className="flex items-center gap-1.5 text-purple-300 bg-gradient-to-r from-purple-900/40 to-purple-800/40 px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-500/40">
                    <CubeTransparentIcon className="h-3.5 w-3.5" />
                    {solution.visualizerCount} {solution.visualizerCount === 1 ? "Visualizer" : "Visualizers"}
                  </div>
                )}

                {solution.hasYoutubeLink && (
                  <div className="flex items-center gap-1.5 text-red-300 bg-gradient-to-r from-red-900/40 to-red-800/40 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/40">
                    <PlayIcon className="h-3.5 w-3.5" />
                    YouTube
                  </div>
                )}

                {solution.hasDriveLink && (
                  <div className="flex items-center gap-1.5 text-indigo-300 bg-gradient-to-r from-indigo-900/40 to-indigo-800/40 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/40">
                    <FolderOpenIcon className="h-3.5 w-3.5" />
                    Drive
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer with timestamps */}
          <div className="pt-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>Created {dateUtils.formatRelativeTime(solution.createdAt)}</span>
              </div>
              <div className="text-right">
                <div className="text-gray-300 font-medium">{solution.createdByName}</div>
                {solution.updatedAt !== solution.createdAt && (
                  <div className="text-gray-500 mt-0.5">
                    Updated {dateUtils.formatRelativeTime(solution.updatedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteSolutionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        solution={solution}
      />
    </>
  );
}