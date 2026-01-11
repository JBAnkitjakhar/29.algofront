// src/having/userQuestion/components/resultComparator.ts - COMPLETE FILE

import type { TestCase } from "@/having/userQuestion/types";

export interface TestCaseResult {
  testCase: TestCase;
  userOutput: string;
  actualTime: number;
  status: "passed" | "failed" | "tle";
}

export interface ComparisonResult {
  allPassed: boolean;
  results: TestCaseResult[];
  overallStatus: "ACCEPTED" | "WRONG_ANSWER" | "TLE";
  failedTestCase?: {
    input: string;
    userOutput: string;
    expectedOutput: string;
  };
  tleTestCase?: {
    input: string;
    userOutput: string;
    expectedOutput: string;
  };
  maxRuntime: number;
  totalMemory: number;
}

export class ResultComparator {
  static compareResults(
    executionOutput: string,
    testCases: TestCase[],
    memoryUsed: number
  ): ComparisonResult {
    const parsedResults = this.parseExecutionOutput(executionOutput);
    const results: TestCaseResult[] = [];
    
    let hasFailure = false;
    let hasTLE = false;
    let firstFailure: TestCaseResult | null = null;
    let firstTLE: TestCaseResult | null = null;
    let maxRuntime = 0;

    // ✅ Match by array index, not by test case ID
    for (let index = 0; index < testCases.length; index++) {
      const testCase = testCases[index];
      const parsed = parsedResults.get(index); // ✅ Use index instead of testCase.id
      
      if (!parsed) {
        const result: TestCaseResult = {
          testCase,
          userOutput: "No output",
          actualTime: 0,
          status: "failed",
        };
        results.push(result);
        hasFailure = true;
        if (!firstFailure) firstFailure = result;
        continue;
      }

      const { output: userOutput, time: actualTime } = parsed;
      
      maxRuntime = Math.max(maxRuntime, actualTime);

      if (actualTime > testCase.expectedTimeLimit) {
        const result: TestCaseResult = {
          testCase,
          userOutput,
          actualTime,
          status: "tle",
        };
        results.push(result);
        hasTLE = true;
        if (!firstTLE) firstTLE = result;
        continue;
      }

      const outputsMatch = this.compareOutputs(
        userOutput,
        testCase.expectedOutput
      );

      const result: TestCaseResult = {
        testCase,
        userOutput,
        actualTime,
        status: outputsMatch ? "passed" : "failed",
      };

      results.push(result);

      if (!outputsMatch) {
        hasFailure = true;
        if (!firstFailure) firstFailure = result;
      }
    }

    let overallStatus: "ACCEPTED" | "WRONG_ANSWER" | "TLE";
    if (hasFailure) {
      overallStatus = "WRONG_ANSWER";
    } else if (hasTLE) {
      overallStatus = "TLE";
    } else {
      overallStatus = "ACCEPTED";
    }

    const comparisonResult: ComparisonResult = {
      allPassed: !hasFailure && !hasTLE,
      results,
      overallStatus,
      maxRuntime,
      totalMemory: memoryUsed,
    };

    if (firstFailure) {
      comparisonResult.failedTestCase = {
        input: this.formatInput(firstFailure.testCase.input),
        userOutput: firstFailure.userOutput,
        expectedOutput: this.formatOutput(firstFailure.testCase.expectedOutput),
      };
    }

    if (firstTLE) {
      comparisonResult.tleTestCase = {
        input: this.formatInput(firstTLE.testCase.input),
        userOutput: firstTLE.userOutput,
        expectedOutput: this.formatOutput(firstTLE.testCase.expectedOutput),
      };
    }

    return comparisonResult;
  }

  private static parseExecutionOutput(
    stdout: string
  ): Map<number, { output: string; time: number }> {
    const results = new Map<number, { output: string; time: number }>();
    
    const lines = stdout.split('\n');
    let currentIndex = -1;
    let currentOutput = '';
    let currentTime = 0;
    
    for (const line of lines) {
      if (line.startsWith('TC_START:')) {
        currentIndex = parseInt(line.split(':')[1]);
      } else if (line.startsWith('OUTPUT:')) {
        currentOutput = line.substring(7); // Remove "OUTPUT:" prefix
      } else if (line.startsWith('TIME:')) {
        currentTime = parseInt(line.split(':')[1]);
      } else if (line.startsWith('TC_END:')) {
        if (currentIndex >= 0) {
          results.set(currentIndex, { 
            output: currentOutput, 
            time: currentTime 
          });
        }
        currentIndex = -1;
        currentOutput = '';
        currentTime = 0;
      }
    }
    
    return results;
  }

  private static compareOutputs(userOutput: string, expectedOutput: unknown): boolean {
    try {
      const normalizedUser = this.normalizeOutput(userOutput);
      const normalizedExpected = this.normalizeOutput(
        JSON.stringify(expectedOutput)
      );

      console.log("Comparing outputs:");
      console.log("User (normalized):", normalizedUser);
      console.log("Expected (normalized):", normalizedExpected);

      return normalizedUser === normalizedExpected;
    } catch (error) {
      console.error("Output comparison error:", error);
      return false;
    }
  }

  private static normalizeOutput(output: string): string {
    try {
      // Remove all whitespace
      const normalized = output.replace(/\s+/g, "");

      try {
        // Try to parse as JSON
        const parsed = JSON.parse(normalized);
        
        // If it's a 2D array (like [[1,2],[3,4]]), sort it
        if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
          // Sort each inner array
          const sorted = parsed.map((arr: number[]) => [...arr].sort((a, b) => a - b));
          // Sort the outer array
          sorted.sort((a: number[], b: number[]) => {
            for (let i = 0; i < Math.min(a.length, b.length); i++) {
              if (a[i] !== b[i]) return a[i] - b[i];
            }
            return a.length - b.length;
          });
          return JSON.stringify(sorted);
        }
        
        return JSON.stringify(parsed);
      } catch {
        // If it's not valid JSON, return normalized string
        return normalized;
      }
    } catch {
      return output;
    }
  }

  private static formatInput(input: Record<string, unknown>): string {
    return Object.entries(input)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key} = [${value.join(", ")}]`;
        }
        return `${key} = ${JSON.stringify(value)}`;
      })
      .join(", ");
  }

  private static formatOutput(output: unknown): string {
    if (Array.isArray(output)) {
      return JSON.stringify(output);
    }
    return String(output);
  }

  static createApproachData(
    comparisonResult: ComparisonResult,
    code: string,
    language: string
  ) {
    const baseData = {
      textContent: "Click edit to add your approach description and explanation...",
      codeContent: code,
      codeLanguage: language,
      status: comparisonResult.overallStatus,
    };

    if (comparisonResult.overallStatus === "ACCEPTED") {
      return {
        ...baseData,
        runtime: comparisonResult.maxRuntime,
        memory: comparisonResult.totalMemory,
      };
    }

    if (comparisonResult.overallStatus === "WRONG_ANSWER" && comparisonResult.failedTestCase) {
      return {
        ...baseData,
        wrongTestcase: comparisonResult.failedTestCase,
      };
    }

    if (comparisonResult.overallStatus === "TLE" && comparisonResult.tleTestCase) {
      return {
        ...baseData,
        runtime: comparisonResult.maxRuntime,
        memory: comparisonResult.totalMemory,
        tleTestcase: comparisonResult.tleTestCase,
      };
    }

    return baseData;
  }
}