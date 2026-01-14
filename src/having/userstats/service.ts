// src/having/userstats/service.ts

import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  UserStatsResponse,
  QuestionsMetadataResponse,
  CategoriesMetadataResponse,
  UserProgressStats,
  SolvedQuestionDetail,
  PaginatedQuestions,
  SubmissionHistoryResponse,
  YearStats,
  HeatmapData,
  DailySubmission,
} from "./types";
import { USER_STATS_ENDPOINTS, PAGINATION_CONFIG } from "./constants";

class UserStatsService {
  /**
   * Fetch all required data and process it into UserProgressStats
   */
  async getUserProgressStats(): Promise<ApiResponse<UserProgressStats>> {
    try {
      const [userStatsRes, questionsRes, categoriesRes] = await Promise.all([
        apiClient.get<UserStatsResponse>(USER_STATS_ENDPOINTS.USER_STATS),
        apiClient.get<QuestionsMetadataResponse>(USER_STATS_ENDPOINTS.QUESTIONS_METADATA),
        apiClient.get<CategoriesMetadataResponse>(USER_STATS_ENDPOINTS.CATEGORIES_METADATA),
      ]);

      if (!userStatsRes.success || !userStatsRes.data) {
        return {
          success: false,
          error: "Failed to fetch user stats",
          message: userStatsRes.message || "Unable to load your progress",
        };
      }

      if (!questionsRes.success || !questionsRes.data) {
        return {
          success: false,
          error: "Failed to fetch questions metadata",
          message: questionsRes.message || "Unable to load questions data",
        };
      }

      if (!categoriesRes.success || !categoriesRes.data) {
        return {
          success: false,
          error: "Failed to fetch categories metadata",
          message: categoriesRes.message || "Unable to load categories data",
        };
      }

      const stats = this.processUserStats(
        userStatsRes.data,
        questionsRes.data,
        categoriesRes.data
      );

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("Error fetching user progress stats:", error);
      return {
        success: false,
        error: "Unexpected error",
        message: "Failed to load your progress data",
      };
    }
  }

  /**
   * Process raw API data into structured UserProgressStats
   */
  private processUserStats(
    userStats: UserStatsResponse,
    questionsMetadata: QuestionsMetadataResponse,
    categoriesMetadata: CategoriesMetadataResponse
  ): UserProgressStats {
    const categoryMap = new Map<string, string>();
    categoriesMetadata.forEach((cat) => {
      categoryMap.set(cat.id, cat.name);
    });

    const totalByLevel = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    categoriesMetadata.forEach((cat) => {
      totalByLevel.easy += cat.easyCount;
      totalByLevel.medium += cat.mediumCount;
      totalByLevel.hard += cat.hardCount;
    });

    const totalQuestions = totalByLevel.easy + totalByLevel.medium + totalByLevel.hard;

    const solvedQuestionsList: SolvedQuestionDetail[] = [];
    const solvedByLevel = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    Object.entries(userStats.solvedQuestions).forEach(([questionId, solvedAt]) => {
      const questionMeta = questionsMetadata.questions[questionId];
      
      if (questionMeta) {
        const categoryName = categoryMap.get(questionMeta.categoryId) || "Unknown";
        
        solvedQuestionsList.push({
          questionId,
          title: questionMeta.title,
          level: questionMeta.level,
          categoryName,
          solvedAt,
        });

        const levelKey = questionMeta.level.toLowerCase() as 'easy' | 'medium' | 'hard';
        solvedByLevel[levelKey]++;
      }
    });

    solvedQuestionsList.sort((a, b) => 
      new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - PAGINATION_CONFIG.MAX_RECENT_DAYS);

    const recentSolvedQuestions = solvedQuestionsList.filter((q) => 
      new Date(q.solvedAt) >= sevenDaysAgo
    );

    const progressPercentage = totalQuestions > 0 
      ? (userStats.totalSolved / totalQuestions) * 100 
      : 0;

    const progressByLevel = {
      easy: totalByLevel.easy > 0 
        ? (solvedByLevel.easy / totalByLevel.easy) * 100 
        : 0,
      medium: totalByLevel.medium > 0 
        ? (solvedByLevel.medium / totalByLevel.medium) * 100 
        : 0,
      hard: totalByLevel.hard > 0 
        ? (solvedByLevel.hard / totalByLevel.hard) * 100 
        : 0,
    };

    return {
      totalSolved: userStats.totalSolved,
      totalQuestions,
      progressPercentage,
      solvedByLevel,
      totalByLevel,
      progressByLevel,
      recentSolved: recentSolvedQuestions.length,
      recentSolvedQuestions,
      allSolvedQuestions: solvedQuestionsList,
    };
  }

  /**
   * Get paginated questions from cached stats
   */
  getPaginatedQuestions(
    allQuestions: SolvedQuestionDetail[],
    page: number
  ): PaginatedQuestions {
    const pageSize = PAGINATION_CONFIG.PAGE_SIZE;
    const totalItems = allQuestions.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const questions = allQuestions.slice(startIndex, endIndex);

    return {
      questions,
      currentPage,
      totalPages,
      pageSize,
      totalItems,
    };
  }

  /**
   * Fetch user submission history and process into heatmap data
   */
  async getSubmissionHistory(year?: number): Promise<ApiResponse<YearStats>> {
    try {
      const response = await apiClient.get<SubmissionHistoryResponse>(
        USER_STATS_ENDPOINTS.SUBMISSION_HISTORY
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: "Failed to fetch submission history",
          message: response.message || "Unable to load submission data",
        };
      }

      const stats = this.processSubmissionHistory(response.data, year);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("Error fetching submission history:", error);
      return {
        success: false,
        error: "Unexpected error",
        message: "Failed to load submission history",
      };
    }
  }

  /**
   * Process submission history into heatmap data
   * ⭐ UPDATED: Now uses 8-level color system based on submission count ranges
   */
  private processSubmissionHistory(
    history: SubmissionHistoryResponse,
    targetYear?: number
  ): YearStats {
    const currentYear = targetYear || new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const submissionMap = new Map<string, number>();
    history.submissionHistory.forEach((day) => {
      submissionMap.set(day.date, day.count);
    });

    // ⭐ Calculate level based on submission count ranges
    const getLevel = (count: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 => {
      if (count === 0) return 0;
      if (count <= 2) return 1;   // 1-2 submissions
      if (count <= 4) return 2;   // 3-4 submissions
      if (count <= 7) return 3;   // 5-7 submissions
      if (count <= 10) return 4;  // 8-10 submissions
      if (count <= 15) return 5;  // 11-15 submissions
      if (count <= 20) return 6;  // 16-20 submissions
      return 7;                    // 21+ submissions
    };

    const heatmapData: HeatmapData[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = submissionMap.get(dateStr) || 0;
      const level = getLevel(count);

      heatmapData.push({
        date: dateStr,
        count,
        level,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const { maxStreak, currentStreak } = this.calculateStreaks(history.submissionHistory);

    const yearSubmissions = history.submissionHistory
      .filter((day) => day.date.startsWith(currentYear.toString()))
      .reduce((sum, day) => sum + day.count, 0);

    const yearDays = history.submissionHistory
      .filter((day) => day.date.startsWith(currentYear.toString()))
      .length;

    return {
      year: currentYear,
      totalSubmissions: yearSubmissions,
      totalDays: yearDays,
      maxStreak,
      currentStreak,
      heatmapData,
    };
  }

  /**
   * Calculate max and current streaks
   */
  private calculateStreaks(history: DailySubmission[]): {
    maxStreak: number;
    currentStreak: number;
  } {
    if (history.length === 0) {
      return { maxStreak: 0, currentStreak: 0 };
    }

    const sorted = [...history].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sorted.length; i++) {
      const date = new Date(sorted[i].date);
      date.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (date.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    let lastDate: Date | null = null;
    for (const day of sorted) {
      const date = new Date(day.date);
      date.setHours(0, 0, 0, 0);

      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round(
          (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }

      lastDate = date;
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    return { maxStreak, currentStreak };
  }
}

export const userStatsService = new UserStatsService();