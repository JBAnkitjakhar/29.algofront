// src/app/interview-prep/[topicId]/page.tsx

'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserLayout from '@/components/layout/UserLayout';
import { dateUtils } from '@/lib/utils/common';
import Image from 'next/image';
import { Loader2Icon } from 'lucide-react';
import { useDocumentsByTopic } from '@/having/courses';

function TopicContent() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  
  const { data: docsData, isLoading } = useDocumentsByTopic(topicId);
  
  const topic = docsData?.topic;
  const documents = docsData?.docs || [];

  if (isLoading) {
    return (
      <UserLayout>
        <div className="min-h-screen flex justify-center items-center bg-[#1A1A1A]">
          <Loader2Icon className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </UserLayout>
    );
  }

  if (!topic) {
    return (
      <UserLayout>
        <div className="min-h-screen bg-[#1A1A1A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <p className="text-red-300">Topic not found</p>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#1A1A1A]">
        {/* Compact Header */}
        <div className="bg-[#262626] border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Back Button */}
            <button
              onClick={() => router.push('/interview-prep')}
              className="flex items-center text-gray-400 hover:text-white transition-colors mb-3 text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Back to Topics
            </button>
            
            {/* Topic Info - Centered */}
            <div className="flex items-center justify-center">
              {/* Icon */}
              {topic.iconUrl ? (
                <Image
                  src={topic.iconUrl}
                  alt={topic.name}
                  className="h-12 w-12 rounded-full mr-4 ring-2 ring-gray-700"
                  width={48}
                  height={48}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4 ring-2 ring-gray-700">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
              )}
              
              {/* Title and Description */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">
                  {topic.name}
                </h1>
                <p className="mt-1 text-sm text-gray-400 flex items-center justify-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {documents.length === 0 ? (
            <div className="bg-[#262626] border border-gray-700 rounded-lg shadow-lg px-6 py-16 text-center">
              <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No documents yet</h3>
              <p className="text-sm text-gray-400">
                Documents will be added soon for this topic.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((doc, index) => (
                  <Link
                    key={doc.id}
                    href={{
                      pathname: `/interview-prep/${topicId}/${doc.id}`,
                      query: { topicName: topic.name }
                    }}
                    className="block group bg-[#262626] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-700 hover:border-blue-500/50 hover:scale-[1.01]"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          {/* Number Badge */}
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-700 group-hover:ring-blue-500 transition-all">
                              <span className="text-base font-bold text-white">
                                {index + 1}
                              </span>
                            </div>
                          </div>
                          
                          {/* Document Info */}
                          <div className="ml-4 flex-1">
                            <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {doc.title}
                            </h3>
                            <div className="mt-1 flex items-center space-x-3 text-xs text-gray-400">
                              <span>Updated {dateUtils.formatRelativeTime(doc.updatedAt)}</span>
                              {doc.imageUrls && doc.imageUrls.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{doc.imageUrls.length} images</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <ChevronRightIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all ml-4" />
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

export default function TopicDocumentsPage() {
  return (
    <ProtectedRoute>
      <TopicContent />
    </ProtectedRoute>
  );
}