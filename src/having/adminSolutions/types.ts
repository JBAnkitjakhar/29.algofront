// src/having/adminSolutions/types.ts

export interface SolutionSummary {
  id: string;
  questionId: string;
  imageCount: number;
  visualizerCount: number;
  codeTemplatesCounts: Record<string, number>;
  hasYoutubeLink: boolean;
  hasDriveLink: boolean;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SolutionsSummaryResponse {
  content: SolutionSummary[];
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

export interface QuestionMetadata {
  id: string;
  title: string;
  level: "EASY" | "MEDIUM" | "HARD";
  categoryId: string;
}

export interface QuestionsMetadataResponse {
  questions: Record<string, QuestionMetadata>;
}

export interface SolutionDetail {
  id: string;
  questionId: string;
  content: string;
  imageUrls?: string[];
  visualizerFileIds?: string[];
  codeTemplates?: Record<string, string[]>;
  youtubeLink?: string;
  driveLink?: string;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  updatedByName?: string;
}

export interface CreateSolutionRequest {
  questionId: string;
  content: string;
  driveLink?: string;
  youtubeLink?: string;
  imageUrls?: string[];
  visualizerFileIds?: string[];
  codeTemplates?: Record<string, string[]>;
}

export interface UpdateSolutionRequest {
  questionId: string;
  content?: string;
  driveLink?: string;
  youtubeLink?: string;
  imageUrls?: string[];
  visualizerFileIds?: string[];
  codeTemplates?: Record<string, string[]>;
}

export interface SolutionWithQuestion extends SolutionSummary {
  questionTitle: string;
  questionLevel: "EASY" | "MEDIUM" | "HARD";
  categoryId: string;
}

export interface VisualizerFileMetadata {
  fileId: string;
  filename: string;
  originalFileName: string;
  size: number;
  uploadDate: string;
  contentType?: string;
  isInteractive?: boolean;
  solutionId?: string;
}

export interface SolutionStats {
  totalSolutions: number;
  solutionsWithImages: number;
  solutionsWithYoutubeVideos: number;
  solutionsWithVisualizers: number;
}

export interface VisualizerMetadataResponse {
  data: VisualizerFileMetadata;
  success: boolean;
}