// src/app/categories/[id]/page.tsx

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserLayout from "@/components/layout/UserLayout";
import {
  FolderOpen,
  Search,
  CheckCircle2,
  Circle,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  useCategoryDetail,
  usePaginatedCategoryQuestions,
} from "@/having/userCategory/hooks";
import { QUESTION_LEVEL_LABELS, QUESTION_LEVEL_COLORS } from "@/constants";
import { dateUtils } from "@/lib/utils/common";
import type { QuestionWithSolvedStatus } from "@/having/userCategory/types";

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
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
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push("...");
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

      {pages.map((page, idx) =>
        typeof page === "number" ? (
          <button
            key={idx}
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-9 px-3 rounded text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
            }`}
          >
            {page}
          </button>
        ) : (
          <span key={idx} className="px-2 text-gray-500 text-sm">
            {page}
          </span>
        )
      )}

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

function CategoryDetailContent() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Fetch category detail
  const {
    data: categoryDetail,
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategoryDetail(categoryId);

  // Get paginated questions
  const { data: paginatedData, isLoading: paginatedLoading } =
    usePaginatedCategoryQuestions(categoryId, page, selectedLevel);

  // Filter questions by search term (client-side)
  const filteredQuestions =
    paginatedData?.questions.filter((q) =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Icon helper function
  const getIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("array")) return "📊";
    if (lowerName.includes("string")) return "🔤";
    if (lowerName.includes("tree") || lowerName.includes("graph")) return "🌳";
    if (lowerName.includes("dynamic") || lowerName.includes("dp")) return "🧠";
    if (lowerName.includes("sort") || lowerName.includes("search")) return "🔍";
    if (lowerName.includes("math")) return "🧮";
    if (lowerName.includes("linked") || lowerName.includes("list")) return "🔗";
    if (lowerName.includes("stack") || lowerName.includes("queue")) return "📚";
    if (lowerName.includes("hash") || lowerName.includes("map")) return "🗺️";
    if (lowerName.includes("bit")) return "⚙️";
    if (lowerName.includes("heap")) return "🎯";
    if (lowerName.includes("backtrack")) return "↩️";
    return "📁";
  };

  const handleQuestionClick = (questionId: string) => {
    router.push(`/questions/${questionId}`);
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading category...</p>
        </div>
      </div>
    );
  }

  if (categoryError || !categoryDetail) {
    return (
      <UserLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
          <div className="text-center">
            <FolderOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {categoryError ? "Error Loading Category" : "Category Not Found"}
            </h3>
            <p className="text-gray-400 mb-4">
              {categoryError instanceof Error
                ? categoryError.message
                : "The category you're looking for doesn't exist."}
            </p>
            <button
              onClick={() => router.push("/categories")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Categories
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  const { category } = categoryDetail;
  const totalQuestions = category.totalQuestions;
  const totalSolved = category.userSolved.total;

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#1A1A1A]">
        {/* Header */}
        <div className="bg-[#262626] border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <button
                onClick={() => router.push("/categories")}
                className="flex items-center hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Categories
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium">{category.name}</span>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex gap-6">
            {/* Left Sidebar - Progress Card */}
            <div className="w-72 flex-shrink-0">
              <div className="bg-[#262626] rounded-lg border border-gray-700 p-5 sticky top-6">
                {/* Category Icon and Name */}
                <div className="text-center mb-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3 text-2xl">
                    {getIcon(category.name)}
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    {category.name}
                  </h2>
                </div>

                {/* Progress Section */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300">
                      Progress
                    </h3>
                  </div>

                  <div className="flex gap-4">
                    {/* Progress Circle with Arc Bars */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background Circle */}
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#374151"
                          strokeWidth="8"
                          fill="none"
                        />

                        {/* Easy Progress Bar - Green Arc (Top) */}
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#00B8A3"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${
                            (category.userSolved.easy /
                              category.questionCounts.easy) *
                            ((2 * Math.PI * 56) / 3)
                          } ${2 * Math.PI * 56}`}
                          strokeDashoffset={0}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                          opacity={category.questionCounts.easy > 0 ? 1 : 0.3}
                        />

                        {/* Medium Progress Bar - Orange Arc (Middle) */}
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#FFA116"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${
                            (category.userSolved.medium /
                              category.questionCounts.medium) *
                            ((2 * Math.PI * 56) / 3)
                          } ${2 * Math.PI * 56}`}
                          strokeDashoffset={`${-((2 * Math.PI * 56) / 3)}`}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                          opacity={category.questionCounts.medium > 0 ? 1 : 0.3}
                        />

                        {/* Hard Progress Bar - Red Arc (Bottom) */}
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#EF4743"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${
                            (category.userSolved.hard /
                              category.questionCounts.hard) *
                            ((2 * Math.PI * 56) / 3)
                          } ${2 * Math.PI * 56}`}
                          strokeDashoffset={`${-((2 * 2 * Math.PI * 56) / 3)}`}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                          opacity={category.questionCounts.hard > 0 ? 1 : 0.3}
                        />
                      </svg>

                      {/* Center Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-white">
                          {totalSolved}/{totalQuestions}
                        </div>
                        <div className="text-xs text-gray-400">Solved</div>
                      </div>
                    </div>

                    {/* Difficulty Stats */}
                    <div className="flex-1 flex flex-col justify-center space-y-2">
                      {/* Easy */}
                      <div className="flex items-center justify-between py-1.5 px-2.5 bg-gray-800/50 rounded">
                        <span className="text-xs text-[#00B8A3] font-medium">
                          Easy
                        </span>
                        <span className="text-xs font-bold text-white">
                          {category.userSolved.easy}/
                          {category.questionCounts.easy}
                        </span>
                      </div>

                      {/* Medium */}
                      <div className="flex items-center justify-between py-1.5 px-2.5 bg-gray-800/50 rounded">
                        <span className="text-xs text-[#FFA116] font-medium">
                          Med.
                        </span>
                        <span className="text-xs font-bold text-white">
                          {category.userSolved.medium}/
                          {category.questionCounts.medium}
                        </span>
                      </div>

                      {/* Hard */}
                      <div className="flex items-center justify-between py-1.5 px-2.5 bg-gray-800/50 rounded">
                        <span className="text-xs text-[#EF4743] font-medium">
                          Hard
                        </span>
                        <span className="text-xs font-bold text-white">
                          {category.userSolved.hard}/
                          {category.questionCounts.hard}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Questions */}
            <div className="flex-1 min-w-0">
              {/* Filters */}
              <div className="bg-[#262626] rounded-lg border border-gray-700 p-4 mb-4">
                <div className="flex gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Difficulty Filter */}
                  <select
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Questions List */}
              {paginatedLoading && filteredQuestions.length === 0 ? (
                <div className="text-center py-16 bg-[#262626] rounded-lg border border-gray-700">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading questions...</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-16 bg-[#262626] rounded-lg border border-gray-700">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No questions found
                  </h3>
                  <p className="text-gray-400">
                    {searchTerm || selectedLevel !== "all"
                      ? "Try adjusting your search criteria or filters."
                      : "No questions available in this category yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestions.map(
                    (question: QuestionWithSolvedStatus, index) => {
                      const levelKey =
                        question.level.toUpperCase() as keyof typeof QUESTION_LEVEL_COLORS;
                      const colors = QUESTION_LEVEL_COLORS[levelKey];

                      return (
                        <div
                          key={question.id}
                          onClick={() => handleQuestionClick(question.id)}
                          className="bg-[#262626] rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-4">
                            {/* Status Icon */}
                            <div className="flex-shrink-0 pt-0.5">
                              {question.isSolved ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-600" />
                              )}
                            </div>

                            {/* Question Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                                  {(page - 1) * 20 + index + 1}.{" "}
                                  {question.title}
                                </h3>
                              </div>

                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${colors.bg} ${colors.text}`}
                                >
                                  {QUESTION_LEVEL_LABELS[levelKey]}
                                </span>
                                {question.isSolved && question.solvedAt && (
                                  <span className="text-xs text-green-400">
                                    ✓ Solved{" "}
                                    {dateUtils.formatRelativeTime(
                                      question.solvedAt
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {/* Pagination */}
              {paginatedData && paginatedData.totalPages > 1 && (
                <Pagination
                  currentPage={paginatedData.currentPage}
                  totalPages={paginatedData.totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default function CategoryDetailPage() {
  return (
    <ProtectedRoute>
      <CategoryDetailContent />
    </ProtectedRoute>
  );
}
