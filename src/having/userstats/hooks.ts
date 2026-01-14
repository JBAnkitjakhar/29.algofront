// src/having/userstats/hooks.ts

import { useQuery } from "@tanstack/react-query";
import { userStatsService } from "./service";
import { USER_STATS_QUERY_KEYS, PAGINATION_CONFIG } from "./constants";
import type { PaginatedQuestions } from "./types";

/**
 * Main hook to fetch and cache all user progress stats
 * This fetches data from 3 APIs and processes it into a single stats object
 */
export function useUserProgressStats() {
  return useQuery({
    queryKey: USER_STATS_QUERY_KEYS.PROGRESS,
    queryFn: async () => {
      const response = await userStatsService.getUserProgressStats();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch user progress");
    },
    
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook to get paginated solved questions
 * Uses cached stats from useUserProgressStats
 */
export function usePaginatedSolvedQuestions(page: number = 1) {
  const { data: stats } = useUserProgressStats();

  return useQuery({
    queryKey: USER_STATS_QUERY_KEYS.PAGINATED(page),
    queryFn: (): PaginatedQuestions => {
      if (!stats) {
        return {
          questions: [],
          currentPage: 1,
          totalPages: 0,
          pageSize: PAGINATION_CONFIG.PAGE_SIZE,
          totalItems: 0,
        };
      }
      
      return userStatsService.getPaginatedQuestions(
        stats.allSolvedQuestions,
        page
      );
    },
    
    enabled: !!stats,
    staleTime: 20 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

/**
 * Hook to fetch submission history heatmap
 * Now properly supports year parameter
 */
export function useSubmissionHistory(year?: number) {
  return useQuery({
    queryKey: [...USER_STATS_QUERY_KEYS.SUBMISSION_HISTORY, year || new Date().getFullYear()],
    queryFn: async () => {
      const response = await userStatsService.getSubmissionHistory(year);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch submission history");
    },
    
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}