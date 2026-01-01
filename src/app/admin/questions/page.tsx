// src/app/admin/questions/page.tsx  

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  PlusIcon, 
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuestionsWithCategories, useAllQuestionsForSearch } from "@/having/adminQuestions/hooks";
import { QuestionCard } from "@/having/adminQuestions/components";
import { ADMIN_ROUTES } from "@/constants";

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { isAdmin } = useAuth();
  
  // Regular paginated questions for display when no search
  const { questions, pagination, isLoading, error } = useQuestionsWithCategories({
    page,
    size: pageSize,
  });

  // All questions for search functionality
  const { questions: allQuestions, isLoading: allQuestionsLoading } = useAllQuestionsForSearch();

  // Extract unique levels and categories from all questions
  const { levels, categories } = useMemo(() => {
    const levelSet = new Set<string>();
    const categoryMap = new Map<string, string>();

    allQuestions.forEach((question) => {
      if (question.level) levelSet.add(question.level);
      if (question.categoryName) {
        categoryMap.set(question.categoryId, question.categoryName);
      }
    });

    return {
      levels: Array.from(levelSet).sort(),
      categories: Array.from(categoryMap.entries()).map(([id, name]) => ({
        id,
        name,
      })),
    };
  }, [allQuestions]);

  // Filter questions based on search and filters
  const filteredQuestions = useMemo(() => {
    // If no filters are active, use paginated questions
    const hasFilters = searchQuery || selectedLevel || selectedCategory;
    if (!hasFilters) {
      return questions;
    }

    // Otherwise, filter all questions
    let filtered = [...allQuestions];

    // Search by title
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((question) =>
        question.title.toLowerCase().includes(query)
      );
    }

    // Filter by level
    if (selectedLevel) {
      filtered = filtered.filter(
        (question) => question.level === selectedLevel
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (question) => question.categoryId === selectedCategory
      );
    }

    return filtered;
  }, [questions, allQuestions, searchQuery, selectedLevel, selectedCategory]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLevel("");
    setSelectedCategory("");
    setPage(0); // Reset to first page
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedLevel || selectedCategory;

  // Determine if we're in search mode
  const isSearchMode = hasActiveFilters;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl">
              Questions Management
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Create and manage coding questions with rich text editor and image
              support.
            </p>
          </div>
          {isAdmin() && (
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <button
                type="button"
                onClick={() => router.push(`${ADMIN_ROUTES.QUESTIONS}/new`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Question
              </button>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {pagination && (
          <div className="mt-8 bg-[#262626] border border-gray-700 overflow-hidden shadow-lg rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <QuestionMarkCircleIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-400 truncate">
                        {isSearchMode ? "Filtered Results" : "Total Questions"}
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {isSearchMode ? filteredQuestions.length : pagination.totalElements}
                      </dd>
                    </dl>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="text-sm text-gray-400">
                    {isSearchMode && `${filteredQuestions.length} result${filteredQuestions.length !== 1 ? "s" : ""} found`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mt-6 bg-[#262626] border border-gray-700 shadow-lg rounded-lg p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by question title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    hasActiveFilters ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-500/30">
                      {[selectedLevel, selectedCategory].filter(Boolean).length}
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                {/* Level Filter */}
                <div>
                  <label
                    htmlFor="level-filter"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Difficulty Level
                  </label>
                  <select
                    id="level-filter"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Levels</option>
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label
                    htmlFor="category-filter"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Category
                  </label>
                  <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Questions Grid */}
        <div className="mt-8">
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">
                    Error loading questions
                  </h3>
                  <div className="mt-2 text-sm text-red-400">
                    {error.message || "Something went wrong. Please try again."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(isLoading || allQuestionsLoading) && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#262626] border border-gray-700 shadow-lg rounded-lg p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                    <div className="mt-2 flex space-x-2">
                      <div className="h-4 bg-gray-700 rounded w-16"></div>
                      <div className="h-4 bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !allQuestionsLoading && !error && filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">
                {hasActiveFilters ? "No questions match your filters" : "No questions found"}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first question."}
              </p>
              {hasActiveFilters ? (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                isAdmin() && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => router.push(`${ADMIN_ROUTES.QUESTIONS}/new`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Question
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {!isLoading && !allQuestionsLoading && !error && filteredQuestions.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination - Only show when not in search mode */}
        {!isSearchMode && pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-700 bg-[#262626] px-4 py-3 sm:px-6 rounded-lg shadow-lg">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="relative inline-flex items-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage(Math.min(pagination.totalPages - 1, page + 1))
                }
                disabled={page >= pagination.totalPages - 1}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-300">
                  Showing{" "}
                  <span className="font-medium">{page * pageSize + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min((page + 1) * pageSize, pagination.totalElements)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{pagination.totalElements}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-600 bg-gray-800 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum =
                        Math.max(
                          0,
                          Math.min(pagination.totalPages - 5, page - 2)
                        ) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            pageNum === page
                              ? "z-10 bg-blue-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                              : "text-gray-300 ring-1 ring-inset ring-gray-600 bg-gray-800 hover:bg-gray-700 focus:z-20 focus:outline-offset-0"
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    }
                  )}

                  <button
                    onClick={() =>
                      setPage(Math.min(pagination.totalPages - 1, page + 1))
                    }
                    disabled={page >= pagination.totalPages - 1}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-600 bg-gray-800 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}