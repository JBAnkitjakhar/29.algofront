// src/having/userQuestion/components/ComplexityAnalysisModal.tsx

"use client";

import { useState } from "react";
import { X, TrendingUp } from "lucide-react";
import { useAnalyzeComplexity } from "@/having/userQuestion/hooks";
import toast from "react-hot-toast";

interface ComplexityAnalysisModalProps {
  questionId: string;
  approachId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_TIME_COMPLEXITIES = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n²)",
  "O(n³)",
  "O(2ⁿ)",
  "O(n!)",
];

const COMMON_SPACE_COMPLEXITIES = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n²)",
];

export function ComplexityAnalysisModal({
  questionId,
  approachId,
  onClose,
  onSuccess,
}: ComplexityAnalysisModalProps) {
  const [timeComplexity, setTimeComplexity] = useState("");
  const [spaceComplexity, setSpaceComplexity] = useState("");
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [isCustomSpace, setIsCustomSpace] = useState(false);

  const analyzeMutation = useAnalyzeComplexity();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!timeComplexity.trim() || !spaceComplexity.trim()) {
      toast.error("Please enter both time and space complexity");
      return;
    }

    analyzeMutation.mutate(
      {
        questionId,
        approachId,
        data: {
          timeComplexity: timeComplexity.trim(),
          spaceComplexity: spaceComplexity.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Complexity analysis added successfully!");
          onSuccess?.();
          onClose();
        },
        onError: (error: Error) => {
          // Backend will return specific error if already analyzed
          toast.error(error.message);
        },
      }
    );
  };

  const handleTimeComplexitySelect = (value: string) => {
    setTimeComplexity(value);
    setIsCustomTime(false);
  };

  const handleSpaceComplexitySelect = (value: string) => {
    setSpaceComplexity(value);
    setIsCustomSpace(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#262626] border border-gray-700 rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">
              Analyze Complexity
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Time Complexity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Complexity
            </label>
            
            {/* Common Options */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {COMMON_TIME_COMPLEXITIES.map((complexity) => (
                <button
                  key={complexity}
                  type="button"
                  onClick={() => handleTimeComplexitySelect(complexity)}
                  className={`px-3 py-2 text-sm rounded border transition-colors ${
                    timeComplexity === complexity
                      ? "bg-purple-900/30 border-purple-500 text-purple-400"
                      : "bg-[#1A1A1A] border-gray-600 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {complexity}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="customTime"
                checked={isCustomTime}
                onChange={(e) => {
                  setIsCustomTime(e.target.checked);
                  if (e.target.checked) setTimeComplexity("");
                }}
                className="w-4 h-4 rounded border-gray-600 bg-[#1A1A1A] text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="customTime" className="text-sm text-gray-400">
                Custom complexity
              </label>
            </div>

            {isCustomTime && (
              <input
                type="text"
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                placeholder="e.g., O(n log n)"
                className="mt-2 w-full px-3 py-2 bg-[#1A1A1A] border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            )}
          </div>

          {/* Space Complexity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Space Complexity
            </label>
            
            {/* Common Options */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {COMMON_SPACE_COMPLEXITIES.map((complexity) => (
                <button
                  key={complexity}
                  type="button"
                  onClick={() => handleSpaceComplexitySelect(complexity)}
                  className={`px-3 py-2 text-sm rounded border transition-colors ${
                    spaceComplexity === complexity
                      ? "bg-purple-900/30 border-purple-500 text-purple-400"
                      : "bg-[#1A1A1A] border-gray-600 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {complexity}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="customSpace"
                checked={isCustomSpace}
                onChange={(e) => {
                  setIsCustomSpace(e.target.checked);
                  if (e.target.checked) setSpaceComplexity("");
                }}
                className="w-4 h-4 rounded border-gray-600 bg-[#1A1A1A] text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="customSpace" className="text-sm text-gray-400">
                Custom complexity
              </label>
            </div>

            {isCustomSpace && (
              <input
                type="text"
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                placeholder="e.g., O(n)"
                className="mt-2 w-full px-3 py-2 bg-[#1A1A1A] border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            )}
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-900/20 border border-yellow-900/30 rounded-md">
            <p className="text-xs text-yellow-400">
              ⚠️ This can only be done once. Make sure your analysis is correct
              before submitting.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={analyzeMutation.isPending}
              className="px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                analyzeMutation.isPending ||
                !timeComplexity.trim() ||
                !spaceComplexity.trim()
              }
              className="px-4 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzeMutation.isPending ? "Analyzing..." : "Submit Analysis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}