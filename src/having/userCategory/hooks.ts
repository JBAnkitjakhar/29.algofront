// src/having/userCategory/hooks.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userCategoryService } from "./service";
import { USER_CATEGORY_QUERY_KEYS } from "./constants";
import type { 
  AllCategoriesData,
  PaginatedQuestions,
  SearchResults,
} from "./types";

/**
 * ✅ UPDATED: Hook to fetch all categories with user progress + questions metadata
 * Now fetches everything needed for search functionality
 * Used in /categories page
 */
export function useAllCategoriesWithProgress() {
  return useQuery({
    queryKey: USER_CATEGORY_QUERY_KEYS.ALL_CATEGORIES,
    queryFn: async () => {
      const response = await userCategoryService.getAllCategoriesWithProgress();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch categories");
    },
    
    // ✅ Long stale time - data doesn't change often
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 mins
    
    // ✅ Refetch on page refresh
    refetchOnMount: true,
    
    // ❌ Don't refetch on tab switch
    refetchOnWindowFocus: false,
    
    // ❌ Don't refetch on network reconnect
    refetchOnReconnect: false,
    
    // ❌ No background polling
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
}

/**
 * ✅ UPDATED: Hook to fetch specific category detail with all questions
 * Now optimized to reuse cached questions metadata if available
 * Used in /categories/[id] page
 */
export function useCategoryDetail(categoryId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: USER_CATEGORY_QUERY_KEYS.CATEGORY_DETAIL(categoryId),
    queryFn: async () => {
      // ✅ Try to get cached data from all categories query
      const allCategoriesData = queryClient.getQueryData<AllCategoriesData>(
        USER_CATEGORY_QUERY_KEYS.ALL_CATEGORIES
      );

      // If we have cached questions metadata, use it (avoids 1 API call)
      if (allCategoriesData) {
        console.log('✅ Using cached questions metadata for category detail');
        const cachedDetail = userCategoryService.getCategoryDetailWithCachedData(
          categoryId,
          allCategoriesData
        );
        
        if (cachedDetail) {
          return cachedDetail;
        }
      }

      // Otherwise, fetch fresh data (3 API calls)
      console.log('🔄 Fetching fresh category detail (no cache available)');
      const response = await userCategoryService.getCategoryDetail(categoryId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch category details");
    },
    
    enabled: !!categoryId,
    
    // ✅ Same caching strategy
    staleTime: 20 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

/**
 * Hook to get paginated questions from cached category detail
 */
export function usePaginatedCategoryQuestions(
  categoryId: string,
  page: number = 1,
  levelFilter?: string
) {
  // First, get category detail (this will be cached)
  const { data: categoryDetail } = useCategoryDetail(categoryId);

  // Then create paginated view
  return useQuery({
    queryKey: USER_CATEGORY_QUERY_KEYS.PAGINATED(categoryId, page, levelFilter),
    queryFn: (): PaginatedQuestions => {
      if (!categoryDetail) {
        return {
          questions: [],
          currentPage: 1,
          totalPages: 0,
          pageSize: 20,
          totalItems: 0,
        };
      }
      
      return userCategoryService.getPaginatedQuestions(
        categoryDetail,
        page,
        levelFilter
      );
    },
    
    // Only run if we have category detail
    enabled: !!categoryDetail,
    
    // ✅ Same caching strategy
    staleTime: 20 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

/**
 * ✅ NEW: Hook to search categories and questions
 * Uses cached data from all categories query
 */
export function useSearch(searchTerm: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...USER_CATEGORY_QUERY_KEYS.ALL_CATEGORIES, 'search', searchTerm],
    queryFn: (): SearchResults => {
      // Get cached data
      const allCategoriesData = queryClient.getQueryData<AllCategoriesData>(
        USER_CATEGORY_QUERY_KEYS.ALL_CATEGORIES
      );

      if (!allCategoriesData) {
        return {
          categories: [],
          questions: [],
          totalCategories: 0,
          totalQuestions: 0,
        };
      }

      return userCategoryService.searchCategoriesAndQuestions(
        allCategoriesData,
        searchTerm
      );
    },
    
    // Only run if we have a search term
    enabled: searchTerm.trim().length > 0,
    
    // ✅ Search results can be cached briefly
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}