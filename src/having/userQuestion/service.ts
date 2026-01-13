// src/having/userQuestion/service.ts

import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types";
import type {
  QuestionDetail,
  UserQuestionProgress,
  SolutionSummary,
  ApproachMetadata,
  ApproachDetail,
  CreateApproachRequest,
  UpdateApproachRequest,
  AnalyzeComplexityRequest,
  AnalyzeComplexityBackendRequest,
  AnalyzeComplexityBackendResponse,
} from "./types";

// Define the backend wrapper type
interface BackendWrappedResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class UserQuestionService {
  async getQuestionById(id: string): Promise<ApiResponse<QuestionDetail>> {
    return apiClient.get<QuestionDetail>(`/questions/${id}`);
  }

  async getQuestionProgress(
    questionId: string
  ): Promise<ApiResponse<UserQuestionProgress>> {
    return apiClient.get<UserQuestionProgress>(
      `/user/me/progress/${questionId}`
    );
  }

  async markQuestionSolved(questionId: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/user/me/mark/${questionId}`);
  }

  async unmarkQuestionSolved(questionId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/user/me/unmark/${questionId}`);
  }

  async getSolutionsByQuestion(
    questionId: string
  ): Promise<ApiResponse<SolutionSummary[]>> {
    return apiClient.get<SolutionSummary[]>(
      `/solutions/question/${questionId}`
    );
  }

  async getApproachesByQuestion(
    questionId: string
  ): Promise<ApiResponse<ApproachMetadata[]>> {
    return apiClient.get<ApproachMetadata[]>(
      `/approaches/question/${questionId}`
    );
  }

  async getApproachDetail(
    questionId: string,
    approachId: string
  ): Promise<ApiResponse<ApproachDetail>> {
    return apiClient.get<ApproachDetail>(
      `/approaches/question/${questionId}/${approachId}`
    );
  }

  async createApproach(
    questionId: string,
    data: CreateApproachRequest
  ): Promise<ApiResponse<ApproachDetail>> {
    return apiClient.post<ApproachDetail>(
      `/approaches/question/${questionId}`,
      data
    );
  }

  async updateApproach(
    questionId: string,
    approachId: string,
    data: UpdateApproachRequest
  ): Promise<ApiResponse<ApproachDetail>> {
    return apiClient.put<ApproachDetail>(
      `/approaches/question/${questionId}/${approachId}`,
      data
    );
  }

  async deleteApproach(
    questionId: string,
    approachId: string
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      `/approaches/question/${questionId}/${approachId}`
    );
  }

  async analyzeComplexityWithAI(
    data: AnalyzeComplexityBackendRequest
  ): Promise<ApiResponse<AnalyzeComplexityBackendResponse>> {
    const response = await apiClient.post<BackendWrappedResponse<AnalyzeComplexityBackendResponse>>(
      `/complexity/analyze`,
      data
    );
    
    // Backend returns { success: true, data: { timeComplexity, spaceComplexity, complexityDescription }, message }
    // Extract the nested data
    if (response.success && response.data) {
      const wrappedData = response.data as BackendWrappedResponse<AnalyzeComplexityBackendResponse>;
      const nestedData = wrappedData.data || response.data;
      return {
        success: true,
        data: nestedData as AnalyzeComplexityBackendResponse,
      };
    }
    
    return response as ApiResponse<AnalyzeComplexityBackendResponse>;
  }

  async saveComplexityAnalysis(
    questionId: string,
    approachId: string,
    data: AnalyzeComplexityRequest
  ): Promise<ApiResponse<ApproachDetail>> {
    return apiClient.put<ApproachDetail>(
      `/approaches/question/${questionId}/${approachId}/analyze-complexity`,
      data
    );
  }

  getVisualizerContentUrl(fileId: string): string {
    return `${
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"
    }/files/visualizers/${fileId}`;
  }
}

export const userQuestionService = new UserQuestionService();