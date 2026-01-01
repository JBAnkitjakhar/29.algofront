// src/app/categories/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserLayout from "@/components/layout/UserLayout";
import {
  FolderOpen,
  Search,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import {
  useAllCategoriesWithProgress,
  useSearch,
} from "@/having/userCategory/hooks";
import { QUESTION_LEVEL_LABELS, QUESTION_LEVEL_COLORS } from "@/constants";
import type {
  CategoryWithUserProgress,
  QuestionSearchResult,
} from "@/having/userCategory/types";

function CategoryCard({
  category,
  onClick,
}: {
  category: CategoryWithUserProgress;
  onClick: () => void;
}) {
  const totalQuestions = category.totalQuestions;
  const { easy, medium, hard } = category.questionCounts;
  const completedProblems = category.userSolved.total;

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

  return (
    <div
      onClick={onClick}
      className="group bg-[#262626] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-blue-500/50 overflow-hidden hover:scale-105 cursor-pointer relative"
    >
      <div className="p-6">
        {/* Icon with Glow Effect */}
        <div className="mb-4 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all"></div>
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-700 group-hover:ring-blue-500 transition-all text-3xl">
              {getIcon(category.name)}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 text-center group-hover:text-blue-400 transition-colors">
          {category.name}
        </h3>

        {/* Solved Count */}
        <div className="text-center mb-4">
          <span className="text-sm text-gray-400">
            {completedProblems} / {totalQuestions} solved
          </span>
        </div>

        {/* Difficulty Breakdown */}
        <div className="flex items-center justify-center gap-6 mb-4">
          {easy > 0 && (
            <div className="text-center">
              <div className="w-2 h-2 bg-[#00B8A3] rounded-full mx-auto mb-1"></div>
              <span className="text-xs font-semibold text-gray-300">
                {easy}
              </span>
            </div>
          )}
          {medium > 0 && (
            <div className="text-center">
              <div className="w-2 h-2 bg-[#FFA116] rounded-full mx-auto mb-1"></div>
              <span className="text-xs font-semibold text-gray-300">
                {medium}
              </span>
            </div>
          )}
          {hard > 0 && (
            <div className="text-center">
              <div className="w-2 h-2 bg-[#EF4743] rounded-full mx-auto mb-1"></div>
              <span className="text-xs font-semibold text-gray-300">
                {hard}
              </span>
            </div>
          )}
        </div>

        {/* Footer - Explore CTA */}
        <div className="pt-4 border-t border-gray-700 flex items-center justify-center">
          <div className="flex items-center text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
            <span className="mr-1">Explore</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </div>
  );
}

function QuestionCard({
  question,
  onClick,
}: {
  question: QuestionSearchResult;
  onClick: () => void;
}) {
  const levelKey =
    question.level.toUpperCase() as keyof typeof QUESTION_LEVEL_COLORS;
  const colors = QUESTION_LEVEL_COLORS[levelKey];

  return (
    <div
      onClick={onClick}
      className="bg-[#262626] rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className="flex-shrink-0 pt-1">
          {question.isSolved ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-600" />
          )}
        </div>

        {/* Question Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
              {question.title}
            </h4>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">{question.categoryName}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${colors.bg} ${colors.text}`}
            >
              {QUESTION_LEVEL_LABELS[levelKey]}
            </span>
            {question.isSolved && (
              <span className="text-green-400 text-xs font-medium">
                ✓ Solved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriesContent() {
  const router = useRouter();

  // Input values (immediate)
  const [categorySearchInput, setCategorySearchInput] = useState("");
  const [questionSearchInput, setQuestionSearchInput] = useState("");

  // Debounced values (delayed by 500ms)
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [questionSearchTerm, setQuestionSearchTerm] = useState("");

  const {
    data: allCategoriesData,
    isLoading,
    error,
  } = useAllCategoriesWithProgress();

  // Search with debounced values
  const { data: categorySearchResults } = useSearch(categorySearchTerm);
  const { data: questionSearchResults } = useSearch(questionSearchTerm);

  // Debounce category search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCategorySearchTerm(categorySearchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [categorySearchInput]);

  // Debounce question search
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuestionSearchTerm(questionSearchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [questionSearchInput]);

  const categories = allCategoriesData?.categories || [];

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/categories/${categoryId}`);
  };

  const handleQuestionClick = (questionId: string) => {
    router.push(`/questions/${questionId}`);
  };

  // Check if searches are active
  const showCategorySearch = categorySearchTerm.trim().length > 0;
  const showQuestionSearch = questionSearchTerm.trim().length > 0;

  // Filter categories (only show if NOT searching questions)
  const filteredCategories = !showQuestionSearch
    ? showCategorySearch && categorySearchResults
      ? categorySearchResults.categories
      : categories
    : [];

  // Get questions (only when question search is active)
  const filteredQuestions =
    showQuestionSearch && questionSearchResults
      ? questionSearchResults.questions
      : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
          <div className="text-center">
            <FolderOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Error Loading Categories
            </h3>
            <p className="text-gray-400 mb-4">
              {error instanceof Error
                ? error.message
                : "Unable to load categories"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#1A1A1A]">
        {/* Header */}
        <div className="bg-[#262626] border-b border-gray-700">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="text-center">
              <FolderOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-base text-gray-400 max-w-2xl mx-auto">
                Explore different categories of coding problems and track your
                progress.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bars */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Category Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Categories
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by category name..."
                  value={categorySearchInput}
                  onChange={(e) => setCategorySearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg bg-[#262626] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              {showCategorySearch && categorySearchResults && (
                <p className="mt-2 text-sm text-gray-400">
                  Found {categorySearchResults.totalCategories} categories
                </p>
              )}
            </div>

            {/* Question Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Questions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by question title..."
                  value={questionSearchInput}
                  onChange={(e) => setQuestionSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg bg-[#262626] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              {showQuestionSearch && questionSearchResults && (
                <p className="mt-2 text-sm text-gray-400">
                  Found {questionSearchResults.totalQuestions} questions
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Questions Section - Only show when searching questions */}
            {showQuestionSearch && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  Questions ({filteredQuestions.length})
                </h2>
                {filteredQuestions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredQuestions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onClick={() => handleQuestionClick(question.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[#262626] rounded-lg border border-gray-700">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      No questions found
                    </h3>
                    <p className="text-gray-400">
                      Try adjusting your search terms.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Categories Section - Only show when NOT searching questions */}
            {!showQuestionSearch && filteredCategories.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  {showCategorySearch
                    ? `Categories (${filteredCategories.length})`
                    : "All Categories"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onClick={() => handleCategoryClick(category.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Categories Found */}
            {!showQuestionSearch &&
              showCategorySearch &&
              filteredCategories.length === 0 && (
                <div className="text-center py-16 bg-[#262626] rounded-lg border border-gray-700">
                  <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No categories found
                  </h3>
                  <p className="text-gray-400">
                    Try adjusting your search terms.
                  </p>
                </div>
              )}

            {/* Cache Info */}
            {!showCategorySearch &&
              !showQuestionSearch &&
              filteredCategories.length > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    {categories.length} categories •
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <CategoriesContent />
    </ProtectedRoute>
  );
}
