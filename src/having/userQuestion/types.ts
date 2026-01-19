// src/having/userQuestion/types.ts

export interface QuestionDetail {
  id: string;
  version: number;
  title: string;
  statement: string;
  imageUrls: string[];
  imageFolderUrl: string | null;
  
  userStarterCode: Record<string, string>;
  generalTemplate: Record<string, string>;
  correctSolution: Record<string, string>;
  testcases: TestCase[];
  
  categoryId: string;
  level: 'EASY' | 'MEDIUM' | 'HARD';
  displayOrder: number;
  createdByName: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: number;
  input: Record<string, unknown>;
  expectedOutput: unknown;
  expectedTimeLimit: number;
}

export interface UserQuestionProgress {
  solved: boolean;
  solvedAt: string | null;
}

export interface SolutionSummary {
  id: string;
  questionId: string;
  content: string;
  driveLink: string | null;
  youtubeLink: string | null;
  imageUrls: string[];
  visualizerFileIds: string[];
  codeTemplates: Record<string, string[]>;
  createdByName: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  youtubeVideoId: string | null;
  youtubeEmbedUrl: string | null;
}

export type ApproachStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'TLE';

export interface ComplexityAnalysis {
  timeComplexity: string;
  spaceComplexity: string;
  complexityDescription: string;
}

export interface TestCaseFailure {
  input: string;
  userOutput: string;
  expectedOutput: string;
}

export interface ApproachMetadata {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  codeLanguage: string;
  status: ApproachStatus;
  runtime: number | null;
  memory: number | null;
  complexityAnalysis: ComplexityAnalysis | null;
  wrongTestcase: TestCaseFailure | null;
  tleTestcase: TestCaseFailure | null;
  contentSize: number;
  contentSizeKB: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApproachDetail extends ApproachMetadata {
  textContent: string;
  codeContent: string;
}

export interface CreateApproachRequest {
  textContent: string;
  codeContent: string;
  codeLanguage: string;
  status?: ApproachStatus;
  runtime?: number;
  memory?: number;
  complexityAnalysis?: ComplexityAnalysis;
  wrongTestcase?: TestCaseFailure;
  tleTestcase?: TestCaseFailure;
}

export interface UpdateApproachRequest {
  textContent: string;
}
export interface QuestionPageData {
  question: QuestionDetail | null;
  progress: UserQuestionProgress | null;
  solutions: SolutionSummary[];
  approaches: ApproachMetadata[];
}

export interface BackendTestCaseResult {
  index: number;
  output: string;
  timeMs: number;
  status: 'success' | 'error' | 'timeout';
}

export interface ExecutionMetrics {
  maxTimeMs: number;
  totalMemoryMb: number;
  totalTestCases: number;
  executedTestCases: number;
}

export interface ExecutionResponse {
  success: boolean;
  testCaseResults: BackendTestCaseResult[];
  metrics: ExecutionMetrics;
  message: string;
  error?: string;
}