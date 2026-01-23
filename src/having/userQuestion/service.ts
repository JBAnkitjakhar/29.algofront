// src/having/userQuestion/service.ts

import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types";
import type {
  QuestionDetail,
  UserQuestionProgress,
  SolutionSummary,
  ApproachMetadata,
  ApproachDetail,
  UpdateApproachRequest,
  RunCodeRequest,
  SubmitCodeRequest,
  RunCodeResponse,
  SubmitCodeResponse,
} from "./types";

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

  async analyzeComplexity(
    questionId: string,
    approachId: string
  ): Promise<ApiResponse<ApproachDetail>> {
    return apiClient.put<ApproachDetail>(
      `/approaches/question/${questionId}/${approachId}/analyze-complexity`
    );
  }

  // ============ CODE EXECUTION ============
  
  async runCode(
    questionId: string,
    request: RunCodeRequest
  ): Promise<ApiResponse<RunCodeResponse>> {
    return apiClient.post<RunCodeResponse>(
      `/question-compiler/${questionId}/run`,
      request
    );
  }

  async submitCode(
    questionId: string,
    request: SubmitCodeRequest
  ): Promise<ApiResponse<SubmitCodeResponse>> {
    return apiClient.post<SubmitCodeResponse>(
      `/question-compiler/${questionId}/submit`,
      request
    );
  }

  getVisualizerContentUrl(fileId: string): string {
    return `${
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"
    }/files/visualizers/${fileId}`;
  }
}

export const userQuestionService = new UserQuestionService();