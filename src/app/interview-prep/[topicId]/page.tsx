// src/app/interview-prep/[topicId]/page.tsx

'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  PlayCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserLayout from '@/components/layout/UserLayout';
import { dateUtils } from '@/lib/utils/common';
import Image from 'next/image';
import { Loader2Icon } from 'lucide-react';
import { useDocumentsByTopic, useReadStats } from '@/having/courses';
import { useMemo, useState } from 'react';

type ViewMode = 'documents' | 'videos';

function TopicContent() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  
  const { data: docsData, isLoading } = useDocumentsByTopic(topicId);
  const { data: readStats, isLoading: isLoadingStats } = useReadStats();
  
  const topic = docsData?.topic;
  const videoLinks = topic?.videoLinks || [];
  
  // View mode toggle
  const [viewMode, setViewMode] = useState<ViewMode>('documents');
  
  // Video player state
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);
  
  const documents = useMemo(() => docsData?.docs || [], [docsData?.docs]);

  const readCountInTopic = useMemo(() => {
    if (!readStats || !documents.length) return 0;
    
    return documents.filter(doc => 
      readStats.readDocs.hasOwnProperty(doc.id)
    ).length;
  }, [readStats, documents]);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getEmbedUrl = (url: string): string | null => {
    const videoId = extractVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
  };

  if (isLoading || isLoadingStats) {
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
        <div className="bg-[#262626] border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.push('/interview-prep')}
              className="flex items-center text-gray-400 hover:text-white transition-colors mb-3 text-sm cursor-pointer"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Back to Topics
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 justify-center">
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
                
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {topic.name}
                  </h1>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                    </span>
                    {videoLinks.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center">
                          <VideoCameraIcon className="h-4 w-4 mr-1" />
                          {videoLinks.length} {videoLinks.length === 1 ? 'video' : 'videos'}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center text-green-400">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      {readCountInTopic} read
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Buttons */}
              {videoLinks.length > 0 && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setViewMode('documents')}
                    className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      viewMode === 'documents'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-gray-700'
                    }`}
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    Docs ({documents.length})
                  </button>
                  <button
                    onClick={() => setViewMode('videos')}
                    className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      viewMode === 'videos'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-gray-700'
                    }`}
                  >
                    <VideoCameraIcon className="w-5 h-5" />
                    Videos ({videoLinks.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {viewMode === 'videos' ? (
            /* Videos List - Exact copy from Admin */
            <div className="bg-[#262626] border border-gray-700 shadow-lg overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-white">
                  Video Links ({videoLinks.length})
                </h3>
              </div>

              {videoLinks.length === 0 ? (
                <div className="text-center py-12">
                  <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-white">
                    No video links
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Add YouTube video links to provide additional learning resources.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  {videoLinks.map((link, index) => {
                    const videoId = extractVideoId(link);
                    const thumbnailUrl = videoId
                      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                      : null;
                    const embedUrl = getEmbedUrl(link);
                    const isPlaying = playingVideoIndex === index;

                    return (
                      <div
                        key={index}
                        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-purple-500/50 transition-colors"
                      >
                        <div className="relative aspect-video bg-gray-900">
                          {isPlaying && embedUrl ? (
                            /* Video Player */
                            <>
                              <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={`Video ${index + 1}`}
                              />
                              {/* Close button overlay */}
                              <button
                                onClick={() => setPlayingVideoIndex(null)}
                                className="absolute top-2 right-2 bg-purple-600 bg-opacity-70 hover:bg-opacity-90 p-2 rounded-full text-white transition-all z-10 cursor-pointer"
                                title="Stop video"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            /* Thumbnail */
                            <>
                              {thumbnailUrl ? (
                                <Image
                                  src={thumbnailUrl}
                                  alt={`Video ${index + 1}`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <VideoCameraIcon className="w-16 h-16 text-gray-600" />
                                </div>
                              )}
                              <div className="absolute top-2 left-2 bg-yellow-200 bg-opacity-70 px-2 py-1 rounded text-xs text-black font-mono">
                                #{index + 1}
                              </div>
                            </>
                          )}
                        </div>
                        {!isPlaying && (
                          <div className="p-3">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => setPlayingVideoIndex(index)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                              >
                                <PlayCircleIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">Play</span>
                              </button>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <span className="text-sm font-medium">On YouTube</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Documents View */
            <div>
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-6 w-6 text-blue-400 mr-2" />
                <h2 className="text-xl font-bold text-white">
                  Documents ({documents.length})
                </h2>
              </div>

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
                    .map((doc, index) => {
                      const isRead = readStats ? readStats.readDocs.hasOwnProperty(doc.id) : false;
                      const readAt = isRead && readStats ? readStats.readDocs[doc.id] : null;
                      
                      return (
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
                                <div className="flex-shrink-0">
                                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ring-2 transition-all ${
                                    isRead 
                                      ? 'bg-green-500/20 ring-green-500' 
                                      : 'bg-gradient-to-br from-blue-500 to-purple-600 ring-gray-700 group-hover:ring-blue-500'
                                  }`}>
                                    {isRead ? (
                                      <CheckCircleIcon className="h-6 w-6 text-green-400" />
                                    ) : (
                                      <span className="text-base font-bold text-white">
                                        {index + 1}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="ml-4 flex-1">
                                  <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    {doc.title}
                                  </h3>
                                  <div className="mt-1 flex items-center space-x-3 text-xs text-gray-400">
                                    {isRead && readAt ? (
                                      <>
                                        <span className="text-green-400">
                                          Read on {dateUtils.formatDate(readAt)}
                                        </span>
                                        <span>•</span>
                                      </>
                                    ) : null}
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
                              
                              <ChevronRightIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all ml-4" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              )}
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