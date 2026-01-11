// src/having/userQuestion/components/codeAssembler.ts

import type { TestCase } from "@/having/userQuestion/types";

interface AssembledCode {
  fullCode: string;
  language: string;
}

export class CodeAssembler {
  static assemble(
    language: string,
    userCode: string,
    testCases: TestCase[]
  ): AssembledCode {
    const normalizedLang = language.toLowerCase();

    switch (normalizedLang) {
      case "java":
        return {
          fullCode: this.assembleJava(userCode, testCases),
          language: "java",
        };
      case "cpp":
      case "c++":
        return {
          fullCode: this.assembleCpp(userCode, testCases),
          language: "cpp",
        };
      case "python":
        return {
          fullCode: this.assemblePython(userCode, testCases),
          language: "python",
        };
      case "javascript":
      case "js":
        return {
          fullCode: this.assembleJavaScript(userCode, testCases),
          language: "javascript",
        };
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private static assembleJava(userCode: string, testCases: TestCase[]): string {
    const processedUserCode = userCode.trim().startsWith("class")
      ? `static ${userCode.trim()}`
      : userCode.trim();

    const testCaseArray = this.generateJavaTestCaseArray(testCases);
    const testLoop = this.generateJavaTestLoop();

    return `
import java.util.*;
import java.util.stream.*;

public class Main {
    ${processedUserCode}
    
    public static void main(String[] args) {
        Solution solution = new Solution();
        ${testCaseArray}
        ${testLoop}
    }
}`.trim();
  }

  private static generateJavaTestCaseArray(testCases: TestCase[]): string {
    const firstTest = testCases[0];
    const inputKeys = Object.keys(firstTest.input);
    
    if (inputKeys.includes("nums")) {
      const arrays = testCases
        .map((tc) => {
          const nums = tc.input.nums as number[];
          return `{${nums.join(", ")}}`;
        })
        .join(",\n            ");
      return `int[][] testCases = {\n            ${arrays}\n        };`;
    }

    return `// Test cases would go here`;
  }

  private static generateJavaTestLoop(): string {
    return `
        for (int tc = 0; tc < testCases.length; tc++) {
            System.out.println("TC_START:" + tc);
            
            long startTime = System.nanoTime();
            
            int[] nums = testCases[tc];
            List<List<Integer>> result = solution.threeSum(nums);
            
            result.sort((a, b) -> {
                for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
                    if (!a.get(i).equals(b.get(i))) {
                        return a.get(i) - b.get(i);
                    }
                }
                return a.size() - b.size();
            });
            
            long endTime = System.nanoTime();
            long timeMs = (endTime - startTime) / 1_000_000;
            
            System.out.print("OUTPUT:");
            System.out.print("[");
            for (int i = 0; i < result.size(); i++) {
                System.out.print("[");
                List<Integer> triplet = result.get(i);
                for (int j = 0; j < triplet.size(); j++) {
                    System.out.print(triplet.get(j));
                    if (j < triplet.size() - 1) System.out.print(",");
                }
                System.out.print("]");
                if (i < result.size() - 1) System.out.print(",");
            }
            System.out.println("]");
            
            System.out.println("TIME:" + timeMs);
            System.out.println("TC_END:" + tc);
        }`;
  }

  private static assembleCpp(userCode: string, testCases: TestCase[]): string {
    const testCaseArray = this.generateCppTestCaseArray(testCases);

    return `
#include <iostream>
#include <vector>
#include <algorithm>
#include <chrono>
using namespace std;

${userCode}

void printResult(const vector<vector<int>>& result) {
    cout << "[";
    for (size_t i = 0; i < result.size(); i++) {
        cout << "[";
        for (size_t j = 0; j < result[i].size(); j++) {
            cout << result[i][j];
            if (j < result[i].size() - 1) cout << ",";
        }
        cout << "]";
        if (i < result.size() - 1) cout << ",";
    }
    cout << "]" << endl;
}

int main() {
    Solution solution;
    
    ${testCaseArray}
    
    for (int tc = 0; tc < testCases.size(); tc++) {
        cout << "TC_START:" << tc << endl;
        
        auto startTime = chrono::high_resolution_clock::now();
        
        vector<int> nums = testCases[tc];
        vector<vector<int>> result = solution.threeSum(nums);
        
        auto endTime = chrono::high_resolution_clock::now();
        auto duration = chrono::duration_cast<chrono::milliseconds>(endTime - startTime);
        
        cout << "OUTPUT:";
        printResult(result);
        
        cout << "TIME:" << duration.count() << endl;
        cout << "TC_END:" << tc << endl;
    }
    
    return 0;
}`.trim();
  }

  private static generateCppTestCaseArray(testCases: TestCase[]): string {
    const arrays = testCases
      .map((tc) => {
        const nums = tc.input.nums as number[];
        return `{${nums.join(", ")}}`;
      })
      .join(",\n        ");
    return `vector<vector<int>> testCases = {\n        ${arrays}\n    };`;
  }

  private static assemblePython(
    userCode: string,
    testCases: TestCase[]
  ): string {
    const testCaseArray = this.generatePythonTestCaseArray(testCases);

    return `
import time

${userCode}

if __name__ == "__main__":
    solution = Solution()
    
    ${testCaseArray}
    
    for tc_index, nums in enumerate(test_cases):
        print(f"TC_START:{tc_index}")
        
        start_time = time.time()
        result = solution.threeSum(nums)
        end_time = time.time()
        
        time_ms = int((end_time - start_time) * 1000)
        
        print(f"OUTPUT:{result}")
        print(f"TIME:{time_ms}")
        print(f"TC_END:{tc_index}")
`.trim();
  }

  private static generatePythonTestCaseArray(testCases: TestCase[]): string {
    const arrays = testCases
      .map((tc) => {
        const nums = tc.input.nums as number[];
        return `[${nums.join(", ")}]`;
      })
      .join(",\n        ");
    return `test_cases = [\n        ${arrays}\n    ]`;
  }

  private static assembleJavaScript(
    userCode: string,
    testCases: TestCase[]
  ): string {
    const testCaseArray = this.generateJsTestCaseArray(testCases);

    return `
${userCode}

const testCases = ${testCaseArray};

for (let tc = 0; tc < testCases.length; tc++) {
    console.log(\`TC_START:\${tc}\`);
    
    const startTime = Date.now();
    
    const solution = new Solution();
    const nums = testCases[tc];
    const result = solution.threeSum(nums);
    
    const endTime = Date.now();
    const timeMs = endTime - startTime;
    
    console.log(\`OUTPUT:\${JSON.stringify(result)}\`);
    console.log(\`TIME:\${timeMs}\`);
    console.log(\`TC_END:\${tc}\`);
}
`.trim();
  }

  private static generateJsTestCaseArray(testCases: TestCase[]): string {
    const arrays = testCases.map((tc) => tc.input.nums as number[]);
    return JSON.stringify(arrays, null, 2);
  }

  static parseExecutionOutput(stdout: string): Map<number, { output: string; time: number }> {
    const results = new Map<number, { output: string; time: number }>();
    
    const lines = stdout.split('\n');
    let currentIndex = -1;
    let currentOutput = '';
    let currentTime = 0;
    
    for (const line of lines) {
      if (line.startsWith('TC_START:')) {
        currentIndex = parseInt(line.split(':')[1]);
      } else if (line.startsWith('OUTPUT:')) {
        currentOutput = line.substring(7);
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
}