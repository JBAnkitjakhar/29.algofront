// src/having/userQuestion/components/UserApproaches.tsx

"use client";

import { useState, useEffect } from "react";
import { 
  Trash2, 
  Code, 
  CheckCircle, 
  XCircle, 
  Clock,
} from "lucide-react";
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

  const { data: approachDetail } = useApproachDetail(
    questionId,
    loadingApproachId || ""
  );

  useEffect(() => {
    if (approachDetail && loadingApproachId === approachDetail.id) {
      onEditApproach?.(approachDetail);
      setLoadingApproachId(null);
    }
  }, [approachDetail, loadingApproachId, onEditApproach]);

  const handleDelete = (e: React.MouseEvent, approachId: string) => {
    e.stopPropagation();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "WRONG_ANSWER":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "TLE":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-green-900/30 text-green-400";
      case "WRONG_ANSWER":
        return "bg-red-900/30 text-red-400";
      case "TLE":
        return "bg-yellow-900/30 text-yellow-400";
      default:
        return "bg-gray-700 text-gray-300";
    }
  };

  const sortedApproaches = approaches 
    ? [...approaches].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    : [];

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

      {sortedApproaches.map((approach) => (
        <div
          key={approach.id}
          onClick={() => handleCardClick(approach.id)}
          className="border border-gray-700 rounded-lg overflow-hidden bg-[#262626] hover:border-gray-600 transition-all cursor-pointer group"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(approach.status)}
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(approach.status)}`}>
                  {approach.status.replace("_", " ")}
                </span>
                <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-medium">
                  {approach.codeLanguage}
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

            {approach.status === "ACCEPTED" && approach.runtime !== null && approach.memory !== null && (
              <div className="flex items-center space-x-4 mb-2 text-sm">
                <span className="text-gray-400">
                  Runtime: <span className="text-green-400">{approach.runtime} ms</span>
                </span>
                <span className="text-gray-400">
                  Memory: <span className="text-green-400">
                    {(approach.memory / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </span>
              </div>
            )}

            {approach.status === "WRONG_ANSWER" && approach.wrongTestcase && (
              <div className="mb-2 p-2 bg-red-900/10 border border-red-900/30 rounded text-xs">
                <div className="text-red-400 font-medium mb-1">Failed Test Case:</div>
                <div className="text-gray-400">
                  <div>Input: {approach.wrongTestcase.input}</div>
                  <div>Expected: {approach.wrongTestcase.expectedOutput}</div>
                  <div>Got: {approach.wrongTestcase.userOutput}</div>
                </div>
              </div>
            )}

            {approach.status === "TLE" && approach.tleTestcase && (
              <div className="mb-2 p-2 bg-yellow-900/10 border border-yellow-900/30 rounded text-xs">
                <div className="text-yellow-400 font-medium mb-1">Time Limit Exceeded:</div>
                <div className="text-gray-400">
                  <div>Input: {approach.tleTestcase.input}</div>
                </div>
              </div>
            )}

            {approach.status === "ACCEPTED" && approach.complexityAnalysis && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-400">
                    Time: <span className="text-purple-400">{approach.complexityAnalysis.timeComplexity}</span>
                  </span>
                  <span className="text-gray-400">
                    Space: <span className="text-purple-400">{approach.complexityAnalysis.spaceComplexity}</span>
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-500">
                {dateUtils.formatRelativeTime(approach.updatedAt)}
              </p>
              <span className="text-xs text-gray-500">
                {approach.contentSizeKB} KB
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}