// src/app/interview-prep/[topicId]/[docId]/page.tsx

'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserLayout from '@/components/layout/UserLayout';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import csharp from 'highlight.js/lib/languages/csharp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import kotlin from 'highlight.js/lib/languages/kotlin';
import swift from 'highlight.js/lib/languages/swift';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import { useDocument, useReadStats, useToggleReadStatus } from '@/having/courses';
import '@/having/courses/components/styles/CourseEditorHighlighting.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c++', cpp);
hljs.registerLanguage('c', c);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('kt', kotlin);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);

function DocumentContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = params.topicId as string;
  const docId = params.docId as string;
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  const { data: document, isLoading: isLoadingDoc } = useDocument(docId);
  const { data: readStats, isLoading: isLoadingStats } = useReadStats();
  const toggleReadMutation = useToggleReadStatus();
  const topicName = searchParams.get('topicName');

  const [highlightedContent, setHighlightedContent] = useState<string>('');

  const isRead = readStats ? readStats.readDocs.hasOwnProperty(docId) : false;

  // Header visibility state
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHoveringHeader, setIsHoveringHeader] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Apply syntax highlighting to content
  useEffect(() => {
    if (!document?.content) {
      setHighlightedContent('');
      return;
    }

    // Parse the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(document.content, 'text/html');
    const codeBlocks = doc.querySelectorAll('pre code');
    
    codeBlocks.forEach((block) => {
      const codeElement = block as HTMLElement;
      
      let language = 'plaintext';
      const classes = codeElement.className.split(' ');
      for (const cls of classes) {
        if (cls.startsWith('language-')) {
          language = cls.replace('language-', '');
          break;
        }
      }
      
      try {
        if (hljs.getLanguage(language)) {
          const result = hljs.highlight(codeElement.textContent || '', { 
            language: language,
            ignoreIllegals: true 
          });
          codeElement.innerHTML = result.value;
          codeElement.classList.add('hljs');
        } else {
          const result = hljs.highlightAuto(codeElement.textContent || '');
          codeElement.innerHTML = result.value;
          codeElement.classList.add('hljs');
        }
      } catch (error) {
        console.error('Failed to highlight code block:', error);
      }
    });
    
    // Set the highlighted content
    setHighlightedContent(doc.body.innerHTML);
  }, [document?.content]);

  // Detect sidebar state changes
  useEffect(() => {
    const checkSidebarState = () => {
      // Check if we're on desktop (lg breakpoint is 1024px)
      const isDesktop = window.innerWidth >= 1024;
      
      if (isDesktop) {
        // On desktop, check localStorage for sidebar state
        const savedCollapsed = localStorage.getItem('userSidebarCollapsed');
        const isOpen = savedCollapsed ? !JSON.parse(savedCollapsed) : true;
        setIsSidebarOpen(isOpen);
      } else {
        // On mobile, sidebar is always considered "closed" for positioning
        setIsSidebarOpen(false);
      }
    };

    // Check initially
    checkSidebarState();

    // Listen for localStorage changes (when sidebar is toggled)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userSidebarCollapsed') {
        checkSidebarState();
      }
    };

    // Listen for resize
    window.addEventListener('resize', checkSidebarState);
    window.addEventListener('storage', handleStorageChange);

    // Poll for changes since localStorage events don't fire in same tab
    const interval = setInterval(checkSidebarState, 100);

    return () => {
      window.removeEventListener('resize', checkSidebarState);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Handle scroll for header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Clear any existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      if (currentScrollY < lastScrollY) {
        // Scrolling up - show header
        setShowHeader(true);
        
        // If not hovering, set timeout to hide after 2 seconds
        if (!isHoveringHeader) {
          hideTimeoutRef.current = setTimeout(() => {
            if (!isHoveringHeader) {
              setShowHeader(false);
            }
          }, 2000);
        }
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px - hide header immediately if not hovering
        if (!isHoveringHeader) {
          setShowHeader(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [lastScrollY, isHoveringHeader]);

  // Handle mouse enter/leave on header
  const handleMouseEnter = () => {
    setIsHoveringHeader(true);
    setShowHeader(true);
    
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHoveringHeader(false);
    
    // Set timeout to hide after 2 seconds when mouse leaves
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringHeader) {
        setShowHeader(false);
      }
    }, 2000);
  };

  const handleToggleRead = () => {
    toggleReadMutation.mutate(docId);
  };

  if (isLoadingDoc || isLoadingStats) {
    return (
      <UserLayout>
        <div className="min-h-screen flex justify-center items-center bg-[#1A1A1A]">
          <Loader2Icon className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </UserLayout>
    );
  }

  if (!document) {
    return (
      <UserLayout>
        <div className="min-h-screen bg-[#1A1A1A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <p className="text-red-300">Document not found</p>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#1A1A1A]">
        {/* Left Corner - Back button and Topic name */}
        <div 
          ref={headerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`fixed top-4 left-4 z-40 transition-all duration-300 ${
            showHeader ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          } ${isSidebarOpen ? 'lg:left-[268px]' : 'lg:left-[56px]'}`}
        >
          <div className="bg-[#262626]/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/interview-prep/${topicId}`)}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Back</span>
              </button>
              
              {topicName && (
                <>
                  <div className="w-px h-5 bg-gray-700" />
                  <div className="text-sm text-gray-300 font-medium">
                    {topicName}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Corner - Mark as Read/Unread Button */}
        <div 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`fixed top-4 right-4 z-40 transition-all duration-300 ${
            showHeader ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="bg-[#262626]/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
            <button
              onClick={handleToggleRead}
              disabled={toggleReadMutation.isPending}
              className={`flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                isRead
                  ? 'bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/40'
                  : 'bg-green-900/30 text-green-400 border border-green-800/50 hover:bg-green-900/40'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {toggleReadMutation.isPending ? (
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircleSolidIcon className="w-4 h-4 mr-2" />
              )}
              {isRead ? 'Mark as Unread' : 'Mark as Read'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <article className="bg-[#262626] rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="px-8 py-6 border-b border-gray-700 bg-[#262626]">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h1 className="text-3xl font-bold text-white">
                  {document.title}
                </h1>
              </div>
            </div>

            {/* White background only for content */}
            <div className="px-8 py-6 bg-white">
              <div 
                ref={contentRef}
                className="ProseMirror prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />
            </div>
          </article>
        </div>
      </div>
    </UserLayout>
  );
}

export default function DocumentViewPage() {
  return (
    <ProtectedRoute>
      <DocumentContent />
    </ProtectedRoute>
  );
}