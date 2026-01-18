// src/app/admin/courses/[topicId]/page.tsx

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  useDocumentsByTopic,
  useDeleteDocument,
  useAdminTopics,
  useMoveDocument,
  useUpdateTopicVideos,
} from "@/having/courses/hooks";
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  EyeIcon,
  ArrowsRightLeftIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { dateUtils } from "@/lib/utils/common";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import type { Document } from "@/having/courses";
import Image from "next/image";

type ViewMode = "documents" | "videos";

export default function AdminTopicDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;

  const { data: docsData, isLoading: isLoadingDocs } =
    useDocumentsByTopic(topicId);
  const { data: allTopicsData } = useAdminTopics();
  const deleteDocumentMutation = useDeleteDocument();
  const moveDocumentMutation = useMoveDocument();
  const updateVideosMutation = useUpdateTopicVideos();

  const documents = docsData?.docs || [];
  const allTopics = allTopicsData?.data || [];
  const topic = docsData?.topic;
  const videoLinks = topic?.videoLinks || [];

  const [viewMode, setViewMode] = useState<ViewMode>("documents");
  const [movingDoc, setMovingDoc] = useState<Document | null>(null);
  const [selectedTargetTopic, setSelectedTargetTopic] = useState("");

  // Video management state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideos, setEditingVideos] = useState<string[]>([]);
  const [newVideoLink, setNewVideoLink] = useState("");

  const handleDeleteDocument = async (docId: string) => {
    if (
      window.confirm(
        "Are you sure? This will delete the document and all its images permanently!",
      )
    ) {
      await deleteDocumentMutation.mutateAsync({ docId, topicId });
    }
  };

  const handleMoveDocument = async () => {
    if (!movingDoc || !selectedTargetTopic) return;

    if (selectedTargetTopic === topicId) {
      toast.error("Document is already in this topic");
      return;
    }

    try {
      await moveDocumentMutation.mutateAsync({
        docId: movingDoc.id,
        newTopicId: selectedTargetTopic,
        oldTopicId: topicId,
      });
      setMovingDoc(null);
      setSelectedTargetTopic("");
    } catch (error) {
      console.error("Failed to move document:", error);
    }
  };

  // Video management handlers
  const openVideoModal = () => {
    setEditingVideos([...videoLinks]);
    setNewVideoLink("");
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setEditingVideos([]);
    setNewVideoLink("");
  };

  const handleAddVideoLink = () => {
    if (!newVideoLink.trim()) {
      toast.error("Please enter a video link");
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/).+$/;
    if (!youtubeRegex.test(newVideoLink.trim())) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    if (editingVideos.length >= 50) {
      toast.error("Maximum 50 video links allowed per topic");
      return;
    }

    setEditingVideos([...editingVideos, newVideoLink.trim()]);
    setNewVideoLink("");
  };

  const handleRemoveVideoLink = (index: number) => {
    setEditingVideos(editingVideos.filter((_, i) => i !== index));
  };

  const handleSaveVideos = async () => {
    try {
      await updateVideosMutation.mutateAsync({
        topicId,
        videoLinks: editingVideos,
      });
      closeVideoModal();
    } catch (error) {
      console.error("Failed to update videos:", error);
    }
  };

  const handleDeleteVideo = async (index: number) => {
    if (window.confirm("Are you sure you want to delete this video link?")) {
      const updatedLinks = videoLinks.filter((_, i) => i !== index);
      try {
        await updateVideosMutation.mutateAsync({
          topicId,
          videoLinks: updatedLinks,
        });
      } catch (error) {
        console.error("Failed to delete video:", error);
      }
    }
  };

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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoadingDocs) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2Icon className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!topic) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <p className="text-red-300">Topic not found</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.push("/admin/courses")}
              className="flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-1" />
              Back to Topics
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-white">{topic.name}</h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    topic.isPublic
                      ? "bg-green-900/30 text-green-400 border-green-500/30"
                      : "bg-gray-700 text-gray-300 border-gray-600"
                  }`}
                >
                  {topic.isPublic ? "Public" : "Private"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-400">{topic.description}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-400">
                <span>Created by: {topic.createdByName}</span>
                <span>•</span>
                <span>
                  Updated: {dateUtils.formatRelativeTime(topic.updatedAt)}
                </span>
              </div>
            </div>
            {viewMode === "documents" ? (
              <Link
                href={`/admin/courses/${topicId}/new`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Create Document
              </Link>
            ) : (
              <button
                onClick={openVideoModal}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
              >
                <PlusIcon className="w-5 h-5" />
                Manage Videos
              </button>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode("documents")}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === "documents"
                ? "bg-blue-600 text-white"
                : "bg-[#262626] text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            <DocumentTextIcon className="w-5 h-5" />
            Documents ({documents.length})
          </button>
          <button
            onClick={() => setViewMode("videos")}
            className={` cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === "videos"
                ? "bg-purple-600 text-white"
                : "bg-[#262626] text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            <VideoCameraIcon className="w-5 h-5" />
            Videos ({videoLinks.length})
          </button>
        </div>

        {/* Move Document Modal */}
        {movingDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-700 w-96 shadow-lg rounded-md bg-[#262626]">
              <h3 className="text-lg font-bold text-white mb-4">
                Move Document
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-300 mb-2">
                    Moving:{" "}
                    <span className="font-medium">{movingDoc.title}</span>
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    From: <span className="font-medium">{topic.name}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Move to Topic:
                  </label>
                  <select
                    value={selectedTargetTopic}
                    onChange={(e) => setSelectedTargetTopic(e.target.value)}
                    className="mt-1 block w-full border-gray-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  >
                    <option value="">Select a topic...</option>
                    {allTopics
                      .filter((t) => t.id !== topicId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.isPublic ? "(Public)" : "(Private)"}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setMovingDoc(null);
                    setSelectedTargetTopic("");
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveDocument}
                  disabled={
                    !selectedTargetTopic || moveDocumentMutation.isPending
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {moveDocumentMutation.isPending ? (
                    <Loader2Icon className="w-5 h-5 animate-spin" />
                  ) : (
                    "Move Document"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Management Modal */}
        {isVideoModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border border-gray-700 w-full max-w-2xl shadow-lg rounded-md bg-[#262626]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">
                  Manage Video Links ({editingVideos.length}/50)
                </h3>
                <button
                  onClick={closeVideoModal}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Add new video */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add YouTube Video Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVideoLink}
                    onChange={(e) => setNewVideoLink(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddVideoLink();
                      }
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 border-gray-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                  />
                  <button
                    onClick={handleAddVideoLink}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Supports: youtube.com/watch?v=..., youtu.be/...,
                  youtube.com/embed/...
                </p>
              </div>

              {/* Video list */}
              <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
                {editingVideos.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <VideoCameraIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No video links added yet</p>
                  </div>
                ) : (
                  editingVideos.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <span className="text-gray-400 text-sm font-mono w-8">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{link}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveVideoLink(index)}
                        className="p-1.5 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeVideoModal}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVideos}
                  disabled={updateVideosMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {updateVideosMutation.isPending ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {viewMode === "documents" ? (
          /* Documents List */
          <div className="bg-[#262626] border border-gray-700 shadow-lg overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-700">
              <h3 className="text-lg leading-6 font-medium text-white">
                Documents ({documents.length})
              </h3>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-white">
                  No documents
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Get started by creating a new document for this topic.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/admin/courses/${topicId}/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    New Document
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="px-4 py-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-white truncate">
                              {doc.title}
                            </h4>
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-400">
                              <span>Order: {doc.displayOrder}</span>
                              <span>Size: {formatSize(doc.totalSize)}</span>
                              {doc.imageUrls.length > 0 && (
                                <span>{doc.imageUrls.length} images</span>
                              )}
                              <span>By: {doc.createdByName}</span>
                              <span>
                                Updated:{" "}
                                {dateUtils.formatRelativeTime(doc.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          href={`/interview-prep/${topicId}/${doc.id}`}
                          target="_blank"
                          className="inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:bg-gray-700 focus:outline-none transition-colors"
                          title="Preview"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setMovingDoc(doc);
                            setSelectedTargetTopic("");
                          }}
                          className="inline-flex items-center p-1.5 border border-transparent rounded-full text-purple-400 hover:bg-purple-900/20 focus:outline-none transition-colors"
                          title="Move to another topic"
                        >
                          <ArrowsRightLeftIcon className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/admin/courses/${topicId}/${doc.id}`}
                          className="inline-flex items-center p-1.5 border border-transparent rounded-full text-blue-400 hover:bg-blue-900/20 focus:outline-none transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={deleteDocumentMutation.isPending}
                          className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-400 hover:bg-red-900/20 focus:outline-none disabled:opacity-50 transition-colors"
                          title="Delete"
                        >
                          {deleteDocumentMutation.isPending ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          /* Videos List */
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
                  Add YouTube video links to provide additional learning
                  resources.
                </p>
                <div className="mt-6">
                  <button
                    onClick={openVideoModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Video Links
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {videoLinks.map((link, index) => {
                  const videoId = extractVideoId(link);
                  const thumbnailUrl = videoId
                    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                    : null;

                  return (
                    <div
                      key={index}
                      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-purple-500/50 transition-colors"
                    >
                      <div className="relative aspect-video bg-gray-900">
                        {thumbnailUrl ? (
                          <Image
                            src={thumbnailUrl}
                            alt={`Video ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                            unoptimized // ✅ Required for external YouTube thumbnails
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <VideoCameraIcon className="w-16 h-16 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-yellow-300 bg-opacity-70 px-2 py-1 rounded text-xs text-black font-mono">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-300 truncate flex-1">
                            {link}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300"
                              title="Open video"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteVideo(index)}
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
