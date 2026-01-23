// src/having/adminQuestions/types.ts

export type QuestionLevel = "EASY" | "MEDIUM" | "HARD";

// Testcase structure
export interface Testcase {
  id: number;
  input: Record<string, unknown>;
  expectedOutput: unknown;
}

// Question Summary (from /admin/questions/summary)
export interface QuestionSummary {
  id: string;
  title: string;
  level: QuestionLevel;
  categoryId: string;
  displayOrder: number;
  imageCount: number;
  methodName: string; // ✅ NEW
  
  userStarterCodeLanguages: string[];
  correctSolutionLanguages: string[];
  
  testcaseCount: number;
  createdByName: string;
  updatedAt: string;
  solutionCount: number;
}

export interface QuestionsSummaryResponse {
  content: QuestionSummary[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// Category Metadata (from /categories/metadata)
export interface CategoryMetadata {
  id: string;
  name: string;
  displayOrder: number;
}

export type CategoriesMetadataResponse = CategoryMetadata[];

// Full Question Detail (from /questions/{id})
export interface QuestionDetail {
  id: string;
  version: number;
  title: string;
  statement: string;
  imageUrls: string[] | null;
  methodName: string;
  
  userStarterCode: Record<string, string>;
  correctSolution: Record<string, string>;
  
  testcases: Testcase[];
  
  categoryId: string;
  level: QuestionLevel;
  displayOrder: number;
  createdByName: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Create Question Request
export interface CreateQuestionRequest {
  title: string;
  statement: string;
  categoryId: string;
  level: QuestionLevel;
  displayOrder: number;
  methodName: string;
  imageUrls?: string[];
  userStarterCode?: Record<string, string>;
  correctSolution?: Record<string, string>;
  testcases?: Testcase[];
}

// Update Question Request
export interface UpdateQuestionRequest {
  version?: number;
  title?: string;
  statement?: string;
  categoryId?: string;
  level?: QuestionLevel;
  displayOrder?: number;
  methodName?: string; // ✅ NEW
  imageUrls?: string[];
  userStarterCode?: Record<string, string>;
  correctSolution?: Record<string, string>;
  testcases?: Testcase[];
}

// Question with Category Name (for display)
export interface QuestionWithCategory extends QuestionSummary {
  categoryName: string;
}

// Image Upload Response
export interface ImageUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}