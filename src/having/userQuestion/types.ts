// src/having/userQuestion/types.ts

export interface QuestionDetail {
  id: string;
  version: number;
  title: string;
  statement: string;
  imageUrls: string[];
  testcases: TestCase[];
  userStarterCode: Record<string, string>;
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

export type ApproachStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED';

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

export interface UpdateApproachRequest {
  textContent: string;
}

export interface QuestionPageData {
  question: QuestionDetail | null;
  progress: UserQuestionProgress | null;
  solutions: SolutionSummary[];
  approaches: ApproachMetadata[];
}

// ============ RUN MODE TYPES ============
export interface RunCodeRequest {
  code: string;
  language: string;
  testCases: Array<{  // ✅ Send full testcase objects, not IDs!
    input: Record<string, unknown>;
  }>;
}

export interface RunTestCaseResult {
  id: number;
  status: 'PASS' | 'FAIL' | 'TLE';
  expectedOutput: string | null;
  userOutput: string | null;
  error: string | null;
}

export interface RunCodeResponse {
  success: boolean;
  verdict: 'ACCEPTED' | 'WRONG_ANSWER' | 'TLE';
  message: string;
  testCaseResults: RunTestCaseResult[];
  metrics: {
    memoryUsedMb: number;
    totalTestCases: number;
    passedTestCases: number;
    failedTestCases: number;
    tleTestCases: number;
  };
}


// ============ SUBMIT MODE TYPES ============
export interface SubmitCodeRequest {
  code: string;
  language: string;
}

export interface SubmitFirstFailure {
  testCaseId: number;
  input: string;
  expectedOutput: string;
  userOutput: string | null;
  error: string | null;
}

export interface SubmitCodeResponse {
  success: boolean;
  verdict: 'ACCEPTED' | 'WRONG_ANSWER' | 'TLE';
  message: string;
  passedTestCases: number;
  totalTestCases: number;
  metrics: {
    runtime: number;
    memory: number;
  } | null;
  firstFailure: SubmitFirstFailure | null;
  approachId: string | null;
}