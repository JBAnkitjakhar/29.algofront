// src/app/interview-prep/page.tsx

'use client';

import { usePublicTopics } from '@/having/courses/hooks';  
import Link from 'next/link';
import {
  BookOpenIcon
} from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserLayout from '@/components/layout/UserLayout';
import Image from 'next/image';
import { Loader2Icon } from 'lucide-react';

function Content() {
  const { data: topicsData, isLoading } = usePublicTopics();
  
  const topics = topicsData?.data || [];

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Simple Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">All Topics</h1>
            <p className="mt-1 text-sm text-gray-400">
              Choose a topic to start learning
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2Icon className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : topics.length === 0 ? (
            <div className="bg-[#262626] border border-gray-700 rounded-lg shadow-lg px-6 py-16 text-center">
              <BookOpenIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No topics available</h3>
              <p className="text-sm text-gray-400">
                Check back later for interview preparation materials.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/interview-prep/${topic.id}`}
                  className="group bg-[#262626] rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-blue-500/50 overflow-hidden hover:scale-105"
                >
                  <div className="p-6">
                    {/* Icon/Image */}
                    <div className="mb-4 flex items-center justify-center">
                      {topic.iconUrl ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg group-hover:bg-blue-500/30 transition-all"></div>
                          <Image
                            src={topic.iconUrl}
                            alt={topic.name}
                            className="relative h-16 w-16 rounded-full ring-2 ring-gray-700 group-hover:ring-blue-500 transition-all"
                            width={64}
                            height={64}
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg group-hover:bg-blue-500/30 transition-all"></div>
                          <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-700 group-hover:ring-blue-500 transition-all">
                            <BookOpenIcon className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-bold text-white text-center group-hover:text-blue-400 transition-colors line-clamp-2">
                      {topic.name}
                    </h3>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

export default function InterviewPrepPage() {
  return (
    <ProtectedRoute>
      <Content />
    </ProtectedRoute>
  );
}