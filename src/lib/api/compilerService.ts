// src/lib/api/compilerService.ts  

import { apiClient } from './client';
import { ApiResponse } from '@/types';

export interface ExecutionRequest {
  language: string;
  version: string;
  code: string;
  stdin?: string;
  args?: string[];
  files?: Array<{ name: string; content: string }>;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  signal: string | null;
  cpuTime: number | null;    // NEW: CPU time in milliseconds
  wallTime: number | null;   // NEW: Wall time in milliseconds
  memory: number | null;     // NEW: Memory in bytes
}

export interface ExecutionResponse {
  language: string;
  version: string;
  run: ExecutionResult;
  compile?: ExecutionResult;
  successful: boolean;
  errorMessage: string | null;
  output: string;
}

export interface WrappedExecutionResponse {
  data?: ExecutionResponse;
  language?: string;
  version?: string;
  run?: ExecutionResult;
  compile?: ExecutionResult;
  successful?: boolean;
  errorMessage?: string | null;
  output?: string;
}

export interface Runtime {
  language: string;
  version: string;
  aliases: string[];
  runtime?: string;
}

export interface HealthCheckResponse {
  status: string;
  responseTime?: number;
  runtimesCount?: number;
  apiUrl?: string;
  error?: string;
}

export class CompilerService {
  async executeCode(request: ExecutionRequest): Promise<ApiResponse<WrappedExecutionResponse>> {
    return apiClient.post<WrappedExecutionResponse>('/compiler/execute', request);
  }

  async getRuntimes(): Promise<ApiResponse<Runtime[]>> {
    return apiClient.get<Runtime[]>('/compiler/runtimes');
  }

  async getSupportedLanguages(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/compiler/languages');
  }

  async healthCheck(): Promise<ApiResponse<HealthCheckResponse>> {
    return apiClient.get<HealthCheckResponse>('/compiler/health');
  }
}

export const compilerService = new CompilerService();