// src/having/userQuestion/components/ComplexityAnalysisModal.tsx

"use client";

import { X, TrendingUp, AlertCircle } from "lucide-react";

interface ComplexityAnalysisModalProps {
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  error?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function ComplexityAnalysisModal({
  timeComplexity,
  spaceComplexity,
  description,
  error,
  onClose,
  onRetry,
}: ComplexityAnalysisModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#262626] border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-[#262626] z-10">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">
              Complexity Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error ? (
            <div className="p-4 bg-red-900/20 border border-red-900/30 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 text-sm font-medium mb-2">{error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#1A1A1A] border border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Time Complexity</div>
                  <div className="text-2xl font-bold text-purple-400">{timeComplexity}</div>
                </div>
                <div className="p-4 bg-[#1A1A1A] border border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Space Complexity</div>
                  <div className="text-2xl font-bold text-purple-400">{spaceComplexity}</div>
                </div>
              </div>

              {description && (
                <div className="p-4 bg-[#1A1A1A] border border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Description</div>
                  <div className="text-gray-300 text-sm leading-relaxed">{description}</div>
                </div>
              )}

              <div className="p-3 bg-green-900/20 border border-green-900/30 rounded-md">
                <p className="text-xs text-green-400">
                  ✓ Analysis complete and saved successfully!
                </p>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-700">
            <div className="p-3 bg-yellow-900/20 border border-yellow-900/30 rounded-md">
              <p className="text-xs text-yellow-400">
                ⚠️ Rate limited to 10 requests per minute. This is a one-time analysis that cannot be modified later.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}