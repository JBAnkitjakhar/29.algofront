// src/having/userQuestion/useQuestionExecution.ts

import { useMutation } from "@tanstack/react-query";
import type { ExecutionResponse } from "@/having/userQuestion/types";

interface ExecutionRequest {
  language: string;
  code: string;
}

export function useQuestionExecution() {
  return useMutation({
    mutationFn: async (request: ExecutionRequest): Promise<ExecutionResponse> => {
      const token = document.cookie.split("token=")[1]?.split(";")[0];

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"}/question-compiler/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || "Execution failed");
      }

      return data;
    },
  });
}

// Also add queue status hook
export function useQueueStatus() {
  return useMutation({
    mutationFn: async () => {
      const token = document.cookie.split("token=")[1]?.split(";")[0];

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"}/question-compiler/queue-status`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
  });
}