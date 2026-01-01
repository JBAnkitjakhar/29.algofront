// src/having/userQuestion/components/UserApproaches.tsx

"use client";

import { useState, useEffect } from "react";
import { Trash2, Code } from "lucide-react";
import {
  useApproachesByQuestion,
  useDeleteApproach,
  useApproachDetail,
} from "@/having/userQuestion/hooks";
import { dateUtils } from "@/lib/utils/common";
import type { ApproachDetail } from "@/having/userQuestion/types";

interface UserApproachesProps {
  questionId: string;
  onEditApproach?: (approach: ApproachDetail) => void;
}

export function UserApproaches({
  questionId,
  onEditApproach,
}: UserApproachesProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingApproachId, setLoadingApproachId] = useState<string | null>(null);

  const { data: approaches, isLoading } = useApproachesByQuestion(questionId);
  const deleteMutation = useDeleteApproach();

  // Fetch full approach when needed for editing
  const { data: approachDetail } = useApproachDetail(
    questionId,
    loadingApproachId || ""
  );

  // Auto-navigate when approach detail is loaded (moved to useEffect)
  useEffect(() => {
    if (approachDetail && loadingApproachId === approachDetail.id) {
      onEditApproach?.(approachDetail);
      setLoadingApproachId(null);
    }
  }, [approachDetail, loadingApproachId, onEditApproach]);

  const handleDelete = (e: React.MouseEvent, approachId: string) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm("Are you sure you want to delete this approach?")) return;

    setDeletingId(approachId);
    deleteMutation.mutate(
      { questionId, approachId },
      {
        onSettled: () => setDeletingId(null),
      }
    );
  };

  const handleCardClick = (approachId: string) => {
    setLoadingApproachId(approachId);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
        <p className="text-gray-400">Loading approaches...</p>
      </div>
    );
  }

  if (!approaches || approaches.length === 0) {
    return (
      <div className="text-center py-12">
        <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          No Approaches Yet
        </h3>
        <p className="text-gray-400 mb-4">
          Submit your solution using the compiler to track your approaches
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          My Approaches ({approaches.length})
        </h3>
        <div className="text-sm text-gray-400">
          Total size:{" "}
          {(
            approaches.reduce((sum, a) => sum + a.contentSize, 0) / 1024
          ).toFixed(1)}{" "}
          KB
        </div>
      </div>

      {approaches.map((approach) => (
        <div
          key={approach.id}
          onClick={() => handleCardClick(approach.id)}
          className="border border-gray-700 rounded-lg overflow-hidden bg-[#262626] hover:border-gray-600 transition-all cursor-pointer group"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 bg-blue-900/30 text-blue-400 rounded text-sm font-medium group-hover:bg-blue-900/40 transition-colors">
                  {approach.codeLanguage}
                </span>
                <span className="text-sm text-gray-400">
                  {approach.contentSizeKB} KB
                </span>
              </div>

              <button
                onClick={(e) => handleDelete(e, approach.id)}
                disabled={deletingId === approach.id}
                className="p-1.5 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors z-10"
                title="Delete approach"
              >
                {deletingId === approach.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Last updated {dateUtils.formatRelativeTime(approach.updatedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}