// src/having/adminQuestions/components/QuestionCard.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  TagIcon,
  EyeIcon,
  CodeBracketIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/useAuth";
import { dateUtils } from "@/lib/utils/common";
import { QUESTION_LEVEL_LABELS, QUESTION_LEVEL_COLORS, ADMIN_ROUTES } from "@/constants";
import type { QuestionWithCategory } from "../types";
import { DeleteQuestionModal } from "./DeleteQuestionModal";

interface QuestionCardProps {
  question: QuestionWithCategory;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isAdmin } = useAuth();

  const levelColors = QUESTION_LEVEL_COLORS[question.level];

  const handleEdit = () => {
    router.push(`${ADMIN_ROUTES.QUESTIONS}/${question.id}/edit`);
  };

  const handleTitleClick = () => {
    router.push(`/questions/${question.id}`);
  };

  // Check if each code template type exists
  const hasUserStarter = question.userStarterCodeLanguages.length > 0;
  const hasCorrectSolution = question.correctSolutionLanguages.length > 0;

  return (
    <>
      <div className="bg-[#262626] shadow-lg rounded-lg border border-gray-700 hover:shadow-xl hover:border-gray-600 transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 
                onClick={handleTitleClick}
                className="text-lg font-semibold text-white truncate cursor-pointer hover:text-blue-400 transition-colors"
                title="View question"
              >
                {question.title}
              </h3>
              <div className="mt-2 flex items-center space-x-2 flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${levelColors.bg} ${levelColors.text} ${levelColors.border}`}
                >
                  {QUESTION_LEVEL_LABELS[question.level]}
                </span>
                <div className="flex items-center text-sm text-gray-400">
                  <TagIcon className="h-4 w-4 mr-1" />
                  {question.categoryName}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <span className="font-medium">Order:</span>
                  <span className="ml-1">{question.displayOrder}</span>
                </div>
              </div>
            </div>

            {isAdmin() && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center p-2 border border-gray-600 rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                  title="Edit question"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center p-2 border border-gray-600 rounded-md text-red-400 bg-gray-800 hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                  title="Delete question"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-3 text-sm flex-wrap">
            {question.imageCount > 0 && (
              <div className="flex items-center text-blue-400">
                <EyeIcon className="h-4 w-4 mr-1" />
                {question.imageCount} image{question.imageCount !== 1 ? "s" : ""}
              </div>
            )}

            {question.testcaseCount > 0 && (
              <div className="flex items-center text-amber-400">
                <BeakerIcon className="h-4 w-4 mr-1" />
                {question.testcaseCount} testcase{question.testcaseCount !== 1 ? "s" : ""}
              </div>
            )}

            {question.solutionCount > 0 && (
              <div className="flex items-center text-purple-400">
                {question.solutionCount} solution{question.solutionCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Code Templates - Only show if any exist */}
          {(hasUserStarter || hasCorrectSolution) && (
            <div className="mt-3 flex items-center gap-2 text-sm flex-wrap">
              <CodeBracketIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
              
              {hasUserStarter && (
                <span 
                  className="px-2 py-0.5 bg-green-900/30 text-green-300 rounded border border-green-500/30 cursor-pointer"
                  title={`Starter: ${question.userStarterCodeLanguages.join(", ")}`}
                >
                  userStarter
                </span>
              )}
              
              {hasCorrectSolution && (
                <span 
                  className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded border border-purple-500/30 cursor-pointer"
                  title={`Sol: ${question.correctSolutionLanguages.join(", ")}`}
                >
                  correctSol
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Updated {dateUtils.formatRelativeTime(question.updatedAt)}
              </div>
              <div className="text-right">
                <div className="text-gray-300">{question.createdByName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteQuestionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        question={question}
      />
    </>
  );
}