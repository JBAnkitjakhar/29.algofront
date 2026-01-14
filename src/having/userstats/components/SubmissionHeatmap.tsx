// src/having/userstats/components/SubmissionHeatmap.tsx

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { YearStats, HeatmapData } from "@/having/userstats/types";

interface TooltipData {
  date: string;
  count: number;
  x: number;
  y: number;
}

interface SubmissionHeatmapProps {
  stats: YearStats;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

// ⭐ 8 levels of green from dark to bright
const LEVEL_COLORS = {
  0: "#161b22", // none (dark gray)
  1: "#006d32", // 1-2 submissions (dark green)
  2: "#26a641", // 3-4 submissions (medium green)
  3: "#39d353", // 5-7 submissions (bright green)
  4: "#4ade80", // 8-10 submissions (brighter green)
  5: "#86efac", // 11-15 submissions (very bright green)
  6: "#bbf7e0", // 16-20 submissions (brightest green)
  7: "#f5f7f6", // 21+ submissions (very light pastel green.)
} as const;

// 0: "#161b22", // none (dark gray)
//   1: "#0e4429", // 1-2 submissions (darkest green)
//   2: "#006d32", // 3-4 submissions (dark green)
//   3: "#26a641", // 5-7 submissions (medium green)
//   4: "#39d353", // 8-10 submissions (bright green)
//   5: "#4ade80", // 11-15 submissions (brighter green)
//   6: "#86efac", // 16-20 submissions (very bright green)
//   7: "#bbf7d0", // 21+ submissions (brightest green)

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SubmissionHeatmap({ stats, selectedYear, onYearChange }: SubmissionHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Group data by months
  interface MonthColumn {
    month: number;
    label: string;
    weeks: HeatmapData[][];
  }
  
  const monthColumns: MonthColumn[] = [];
  
  // Filter data for selected year
  const yearData = stats.heatmapData.filter(day => {
    if (!day.date) return false;
    const date = new Date(day.date);
    return date.getFullYear() === selectedYear;
  });
  
  yearData.forEach((day) => {
    const date = new Date(day.date);
    const month = date.getMonth();
    const dayOfWeek = date.getDay();
    
    if (monthColumns.length === 0 || monthColumns[monthColumns.length - 1].month !== month) {
      const newWeek: HeatmapData[] = [];
      for (let i = 0; i < dayOfWeek; i++) {
        newWeek.push({ date: "", count: 0, level: 0 });
      }
      newWeek.push(day);
      
      monthColumns.push({
        month,
        label: MONTHS[month],
        weeks: [newWeek],
      });
    } else {
      const currentMonth = monthColumns[monthColumns.length - 1];
      let currentWeek = currentMonth.weeks[currentMonth.weeks.length - 1];
      
      if (currentWeek.length === 7) {
        currentWeek = [];
        currentMonth.weeks.push(currentWeek);
      }
      
      currentWeek.push(day);
    }
  });
  
  monthColumns.forEach((monthCol) => {
    const lastWeek = monthCol.weeks[monthCol.weeks.length - 1];
    while (lastWeek.length < 7) {
      lastWeek.push({ date: "", count: 0, level: 0 });
    }
  });

  const handleMouseEnter = (day: HeatmapData, event: React.MouseEvent) => {
    if (!day.date) return;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      date: day.date,
      count: day.count,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear, currentYear - 1, currentYear - 2];
  const isCurrentYear = selectedYear === currentYear;

  return (
    <div className="bg-[#262626] rounded-lg border border-gray-700 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {stats.totalSubmissions} submissions in {selectedYear}
          </h2>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-2 text-xs sm:text-sm text-gray-400">
            <span>Total active days: <span className="font-semibold text-white">{stats.totalDays}</span></span>
            <span>Max streak: <span className="font-semibold text-white">{stats.maxStreak}</span></span>
            {isCurrentYear && stats.currentStreak > 0 && (
              <span className="text-green-400">
                Current streak: <span className="font-semibold">{stats.currentStreak}</span> 🔥
              </span>
            )}
          </div>
        </div>

        {/* Year selector */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full sm:w-auto gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors"
          >
            {selectedYear}
            <ChevronDown className="w-4 h-4" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-20 min-w-[100px]">
                <button
                  className="w-full px-4 py-2 text-sm text-left text-blue-400 hover:bg-gray-700"
                >
                  Current
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      onYearChange(year);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-700 ${
                      year === selectedYear ? 'text-blue-400 font-medium' : 'text-gray-300'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Heatmap - Responsive with custom styled scrollbar */}
      <div className="overflow-x-auto overflow-y-hidden pb-2 -mx-2 px-2 custom-scrollbar">
        <div className="inline-block min-w-full">
          {/* Grid with integrated month labels */}
          <div className="flex gap-1 min-w-max">
            {/* Day labels */}
            <div className="flex flex-col text-[11px] text-gray-400 w-10 text-right pr-2 pt-6 flex-shrink-0">
              {DAYS.map((day, idx) => (
                <div key={`day-${idx}`} className="h-[11px] flex items-center justify-end leading-none mb-[3px]">
                  {day}
                </div>
              ))}
            </div>

            {/* Months with their cells */}
            <div className="flex flex-shrink-0">
              {monthColumns.map((monthCol, monthIdx) => (
                <div key={`month-group-${monthIdx}`} className="flex flex-col mr-3">
                  {/* Month label centered above its columns */}
                  <div className="text-xs text-gray-400 font-medium h-6 flex items-center justify-center mb-1" 
                       style={{ width: `${monthCol.weeks.length * 14 - 3}px` }}>
                    {monthCol.label}
                  </div>
                  
                  {/* Week columns for this month */}
                  <div className="flex gap-[3px]">
                    {monthCol.weeks.map((week, weekIdx) => (
                      <div key={`week-${monthIdx}-${weekIdx}`} className="flex flex-col gap-[3px]">
                        {week.map((day, dayIdx) => (
                          <div
                            key={`${monthIdx}-${weekIdx}-${dayIdx}`}
                            className="w-[11px] h-[11px] rounded-[2px] cursor-pointer hover:ring-2 hover:ring-white/40 transition-all"
                            style={{
                              backgroundColor: day.date ? LEVEL_COLORS[day.level] : 'transparent',
                            }}
                            onMouseEnter={(e) => handleMouseEnter(day, e)}
                            onMouseLeave={handleMouseLeave}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend with 8 levels */}
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 flex-wrap">
            <span>Less</span>
            <div className="flex gap-[3px]">
              {([0, 1, 2, 3, 4, 5, 6, 7] as const).map((level) => (
                <div
                  key={level}
                  className="w-[11px] h-[11px] rounded-[2px]"
                  style={{ backgroundColor: LEVEL_COLORS[level] }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded shadow-lg border border-gray-700 pointer-events-none whitespace-nowrap"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold">
            {tooltip.count} {tooltip.count === 1 ? 'submission' : 'submissions'}
          </div>
          <div className="text-gray-400 mt-0.5">
            {formatTooltipDate(tooltip.date)}
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2d2d2d;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3d3d3d;
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #2d2d2d #1a1a1a;
        }
      `}</style>
    </div>
  );
}