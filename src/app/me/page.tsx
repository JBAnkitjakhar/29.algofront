// src/app/me/page.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgressStats, usePaginatedSolvedQuestions, useSubmissionHistory } from "@/having/userstats/hooks";
import { SubmissionHeatmap } from "@/having/userstats/components/SubmissionHeatmap";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserLayout from "@/components/layout/UserLayout";
import { dateUtils } from "@/lib/utils/common";
import { QUESTION_LEVEL_COLORS, QUESTION_LEVEL_LABELS } from "@/constants";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Shimmer loading effect
function ShimmerLoader() {
  return (
    <div className="relative overflow-hidden bg-gray-700 rounded-lg h-full">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-gray-600/50 to-transparent" />
    </div>
  );
}

// LeetCode-Style Circular Progress with Stats on Right
function CircularProgress({ 
  stats 
}: { 
  stats: {
    totalSolved: number;
    totalQuestions: number;
    progressPercentage: number;
    solvedByLevel: { easy: number; medium: number; hard: number };
    totalByLevel: { easy: number; medium: number; hard: number };
  }
}) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 7;

  // Calculate percentages based on TOTAL questions, not individual levels
  const easyPercent = (stats.solvedByLevel.easy / stats.totalQuestions) * 100;
  const mediumPercent = (stats.solvedByLevel.medium / stats.totalQuestions) * 100;
  const hardPercent = (stats.solvedByLevel.hard / stats.totalQuestions) * 100;

  return (
    <div className="flex items-center justify-center gap-8">
      {/* Circular Chart */}
      <div className="relative inline-flex items-center justify-center">
        <svg className="transform -rotate-90" width="150" height="150">
          {/* Background circle */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            stroke="#2D2D2D"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Easy arc */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            stroke="#00B8A3"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${(easyPercent / 100) * circumference} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          
          {/* Medium arc */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            stroke="#FFA116"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${(mediumPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((easyPercent / 100) * circumference)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          
          {/* Hard arc */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            stroke="#EF4743"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${(hardPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-(((easyPercent + mediumPercent) / 100) * circumference)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-white">
            {stats.totalSolved}
          </div>
          <div className="text-xs text-gray-400">
            /{stats.totalQuestions}
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-0.5">
            Solved
          </div>
        </div>
      </div>

      {/* Difficulty Stats on Right */}
      <div className="flex flex-col gap-3">
        {/* Easy */}
        <div className="bg-gray-800 rounded-lg p-3 min-w-[120px]">
          <div className="text-xs text-[#00B8A3] font-medium mb-0.5">Easy</div>
          <div className="text-xl font-bold text-white">
            {stats.solvedByLevel.easy}<span className="text-sm text-gray-400">/{stats.totalByLevel.easy}</span>
          </div>
        </div>

        {/* Medium */}
        <div className="bg-gray-800 rounded-lg p-3 min-w-[120px]">
          <div className="text-xs text-[#FFA116] font-medium mb-0.5">Med.</div>
          <div className="text-xl font-bold text-white">
            {stats.solvedByLevel.medium}<span className="text-sm text-gray-400">/{stats.totalByLevel.medium}</span>
          </div>
        </div>

        {/* Hard */}
        <div className="bg-gray-800 rounded-lg p-3 min-w-[120px]">
          <div className="text-xs text-[#EF4743] font-medium mb-0.5">Hard</div>
          <div className="text-xl font-bold text-white">
            {stats.solvedByLevel.hard}<span className="text-sm text-gray-400">/{stats.totalByLevel.hard}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error component
function ErrorState({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
      <h3 className="text-sm font-bold text-red-300 mb-1">
        Failed to load progress data
      </h3>
      <p className="text-xs text-red-400">
        {error.message || "Something went wrong while fetching your progress."}
      </p>
    </div>
  );
}

// Pagination
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded bg-gray-800 border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-gray-300" />
      </button>

      {pages.map((page, idx) => (
        typeof page === 'number' ? (
          <button
            key={idx}
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-9 px-3 rounded text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            {page}
          </button>
        ) : (
          <span key={idx} className="px-2 text-gray-500 text-sm">
            {page}
          </span>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded bg-gray-800 border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </button>
    </div>
  );
}

function Content() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // ⭐ NEW: Track selected year
  
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useUserProgressStats();

  const {
    data: paginatedData,
    isLoading: paginatedLoading,
  } = usePaginatedSolvedQuestions(currentPage);

  const {
    data: submissionStats,
    isLoading: submissionLoading,
  } = useSubmissionHistory(selectedYear); // ⭐ Pass selected year to fetch correct data

  if (!user) return null;

  if (statsError && !statsLoading) {
    return (
      <UserLayout>
        <div className="min-h-screen bg-[#1A1A1A]">
          <div className="max-w-6xl mx-auto p-6">
            <ErrorState error={statsError as Error} />
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          
          {/* Submission Heatmap - Now with year selection */}
          {submissionLoading ? (
            <div className="h-[200px]">
              <ShimmerLoader />
            </div>
          ) : submissionStats ? (
            <SubmissionHeatmap 
              stats={submissionStats} 
              selectedYear={selectedYear}
              onYearChange={setSelectedYear} // ⭐ Pass callback to handle year change
            />
          ) : null}

          {/* Problems Solved Section */}
          <div className="bg-[#262626] rounded-lg border border-gray-700 p-5">
            {statsLoading ? (
              <div className="h-[180px]">
                <ShimmerLoader />
              </div>
            ) : stats ? (
              <div>
                <h2 className="text-lg font-bold text-white mb-4">
                  Problems Solved
                </h2>
                <CircularProgress stats={stats} />
              </div>
            ) : null}
          </div>

          {/* Solved Questions List */}
          <div className="bg-[#262626] rounded-lg border border-gray-700">
            {/* Header */}
            <div className="border-b border-gray-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                Solved Questions
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Your solved problems sorted by most recent
              </p>
            </div>

            {/* Questions List */}
            <div className="p-6">
              {statsLoading || paginatedLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-16">
                      <ShimmerLoader />
                    </div>
                  ))}
                </div>
              ) : paginatedData && paginatedData.questions.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {paginatedData.questions.map((question) => {
                      const levelKey = question.level.toUpperCase() as keyof typeof QUESTION_LEVEL_COLORS;
                      const colors = QUESTION_LEVEL_COLORS[levelKey];

                      return (
                        <div
                          key={question.questionId}
                          className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-700"
                        >
                          {/* Success indicator */}
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>

                          {/* Question title */}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/questions/${question.questionId}`}
                              className="text-sm font-medium text-white hover:text-blue-400 transition-colors block truncate"
                            >
                              {question.title}
                            </Link>
                          </div>

                          {/* Category */}
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300">
                              {question.categoryName}
                            </span>
                          </div>

                          {/* Difficulty */}
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold ${colors.bg} ${colors.text}`}>
                              {QUESTION_LEVEL_LABELS[levelKey]}
                            </span>
                          </div>

                          {/* Date */}
                          <div className="flex-shrink-0 text-xs text-gray-400 min-w-[120px] text-right">
                            {dateUtils.formatRelativeTime(question.solvedAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Pagination
                    currentPage={paginatedData.currentPage}
                    totalPages={paginatedData.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              ) : (
                <div className="text-center py-20">
                  <Clock className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">
                    No solved questions yet
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Start solving problems to see your progress
                  </p>
                  <Link
                    href="/categories"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Browse Questions
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 2s infinite; }
      `}</style>
    </UserLayout>
  );
}

export default function MePage() {
  return (
    <ProtectedRoute>
      <Content />
    </ProtectedRoute>
  );
}