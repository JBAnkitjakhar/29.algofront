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
  
  const { data: document, isLoading: isLoadingDoc } = useDocument(docId);
  const { data: readStats, isLoading: isLoadingStats } = useReadStats();
  const toggleReadMutation = useToggleReadStatus();
  const topicName = searchParams.get('topicName');

  const isRead = readStats ? readStats.readDocs.hasOwnProperty(docId) : false;

  // Header visibility state
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (contentRef.current && document?.content) {
      const codeBlocks = contentRef.current.querySelectorAll('pre code');
      
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
    }
  }, [document?.content]);

  // Handle scroll for header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY) {
        // Scrolling up
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px
        setShowHeader(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
        {/* Header with auto-hide on scroll */}
        <div 
          className={`bg-[#262626] shadow-sm border-b border-gray-700 sticky top-0 z-10 transition-transform duration-300 ${
            showHeader ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/interview-prep/${topicId}`)}
                  className="flex items-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-1" />
                  Back
                </button>
                
                {topicName && (
                  <div className="text-sm text-gray-400">
                    <span className="font-medium">{topicName}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleToggleRead}
                disabled={toggleReadMutation.isPending}
                className={`flex items-center px-3 py-1.5 rounded-md font-medium text-xs transition-all ${
                  isRead
                    ? 'bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/40'
                    : 'bg-green-900/30 text-green-400 border border-green-800/50 hover:bg-green-900/40'
                } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
              >
                {toggleReadMutation.isPending ? (
                  <Loader2Icon className="w-3 h-3 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircleSolidIcon className="w-3 h-3 mr-1.5" />
                )}
                {isRead ? 'Mark as Unread' : 'Mark as Read'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                dangerouslySetInnerHTML={{ __html: document.content || '' }}
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