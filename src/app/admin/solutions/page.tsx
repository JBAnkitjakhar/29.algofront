// src/app/admin/solutions/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSolutionsWithQuestions, useAllSolutionsForSearch } from "@/having/adminSolutions/hooks";
import { ADMIN_ROUTES } from "@/constants";
import { SolutionCard } from "@/having/adminSolutions/components";

export default function AdminSolutionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const { isAdmin } = useAuth();
  
  // Regular paginated solutions for display when no search
  const { solutions, pagination, isLoading, error } = useSolutionsWithQuestions({
    page,
    size: pageSize,
  });

  // All solutions for search functionality
  const { solutions: allSolutions, isLoading: allSolutionsLoading } = useAllSolutionsForSearch();

  // Filter solutions based on question title search
  const filteredSolutions = useMemo(() => {
    if (!searchQuery.trim()) {
      return solutions;
    }

    const query = searchQuery.toLowerCase().trim();
    // ✅ Fixed: Use questionTitle instead of question.title
    return allSolutions.filter((solution) =>
      solution.questionTitle?.toLowerCase().includes(query)
    );
  }, [solutions, allSolutions, searchQuery]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setPage(0); // Reset to first page
  };

  // Determine if we're in search mode
  const isSearchMode = !!searchQuery.trim();

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];

    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages: number[] = [];
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl">
              Solutions Management
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Create and manage official solutions with rich content and interactive visualizers
            </p>
          </div>
          {isAdmin() && (
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <button
                type="button"
                onClick={() => router.push(`${ADMIN_ROUTES.SOLUTIONS}/new`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Solution
              </button>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {pagination && (
          <div className="mt-8 bg-[#262626] overflow-hidden shadow-lg rounded-lg border border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <LightBulbIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-400 truncate">
                        {isSearchMode ? "Filtered Results" : "Total Solutions"}
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {isSearchMode ? filteredSolutions.length : pagination.totalElements}
                      </dd>
                    </dl>
                  </div>
                </div>
                {searchQuery && (
                  <div className="text-sm text-gray-400">
                    {filteredSolutions.length} result{filteredSolutions.length !== 1 ? "s" : ""} found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mt-6 bg-[#262626] shadow-lg rounded-lg p-4 border border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search solutions by question title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Solutions Grid */}
        <div className="mt-8">
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
              <p className="text-sm text-red-300">{error.message || "Failed to load solutions"}</p>
            </div>
          )}

          {(isLoading || allSolutionsLoading) && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#262626] border border-gray-700 shadow-lg rounded-lg p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !allSolutionsLoading && !error && filteredSolutions.length === 0 && (
            <div className="text-center py-12">
              <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">
                {searchQuery ? "No solutions match your search" : "No solutions found"}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchQuery
                  ? "Try adjusting your search query."
                  : "Get started by creating your first solution."}
              </p>
              {searchQuery ? (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                isAdmin() && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => router.push(`${ADMIN_ROUTES.SOLUTIONS}/new`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Solution
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {!isLoading && !allSolutionsLoading && !error && filteredSolutions.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredSolutions.map((solution) => (
                <SolutionCard key={solution.id} solution={solution} />
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
                onClick={() => setPage(Math.min(pagination.totalPages - 1, page + 1))}
                disabled={page === pagination.totalPages - 1}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-300">
                  Showing <span className="font-medium">{page * pageSize + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min((page + 1) * pageSize, pagination.totalElements)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.totalElements}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-600 bg-gray-800 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {getPageNumbers().map((pageNum) => (
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
                  ))}

                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages - 1, page + 1))}
                    disabled={page === pagination.totalPages - 1}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-600 bg-gray-800 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
