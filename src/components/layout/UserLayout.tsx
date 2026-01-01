// src/components/layout/UserLayout.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChevronLeft,
  ChevronRight,
  Home,
  Code,
  FolderOpen,
  LogOut,
  User,
  Menu,
  X,
  Maximize,
  Minimize,
  GraduationCap
} from 'lucide-react';
import { roleUtils } from '@/lib/utils/auth';
import { stringUtils } from '@/lib/utils/common';

interface UserLayoutProps {
  children: React.ReactNode;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  description: string;
}

// Extended document interface for fullscreen APIs
interface ExtendedDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

// Extended HTMLElement interface for fullscreen APIs
interface ExtendedHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'me',
    label: 'Me',
    icon: Home,
    href: '/me',
    description: 'Overview and stats'
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: FolderOpen,
    href: '/categories',
    description: 'Topic categories'
  },
  {
    id: 'compiler',
    label: 'Compiler',
    icon: Code,
    href: '/compiler',
    description: 'Code editor'
  },
  {
    id: 'interview-prep',
    label: 'Interview Prep',
    icon: GraduationCap,
    href: '/interview-prep',
    description: 'Courses'
  },
];

export default function UserLayout({ children }: UserLayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        setIsCollapsed(true);
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fullscreen detection and management
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as ExtendedDocument;
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Fullscreen toggle function
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const docEl = document.documentElement as ExtendedHTMLElement;
        
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } else {
        const doc = document as ExtendedDocument;
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Load saved sidebar state
  useEffect(() => {
    if (!isMobile && !isInitialized) {
      const savedCollapsed = localStorage.getItem('userSidebarCollapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(JSON.parse(savedCollapsed));
      }
      setIsInitialized(true);
    }
  }, [isMobile, isInitialized]);

  // Save sidebar state
  const toggleSidebar = () => {
    const newCollapsedState = isMobile ? !isMobileOpen : !isCollapsed;
    
    if (isMobile) {
      setIsMobileOpen(newCollapsedState);
    } else {
      setIsCollapsed(newCollapsedState);
      localStorage.setItem('userSidebarCollapsed', JSON.stringify(newCollapsedState));
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [pathname, isMobile]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const isActiveRoute = (href: string): boolean => {
    if (href === '/me') {
      return pathname === '/me';
    }
    return pathname.startsWith(href);
  };

  const sidebarWidth = isCollapsed ? 'w-12' : 'w-64';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#1A1A1A] overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? `fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
              isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            } w-64`
          : `relative transition-all duration-300 ease-in-out ${sidebarWidth}`
        }
        bg-[#262626] border-r border-gray-700 flex flex-col shadow-2xl
      `}>
        {/* Sidebar Header */}
        <div className={`${isCollapsed && !isMobile ? 'flex flex-col items-center space-y-2 px-1' : 'flex items-center justify-between px-4'} py-4 border-b border-gray-700`}>
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center space-x-2 group">
              <div className="relative">
                <Image 
                  src="/logo.jpg" 
                  alt="AlgoArena Logo" 
                  width={32}
                  height={32}
                  className="rounded-lg object-cover shadow-md group-hover:shadow-lg transition-shadow duration-300"
                />
              </div>
              <h1 className="text-xl font-bold text-white">
                AlgoArena
              </h1>
            </div>
          )}
          
          {isCollapsed && !isMobile && (
            <div className="flex items-center justify-center w-full mb-2">
              <div className="relative group">
                <Image 
                  src="/logo.jpg" 
                  alt="AlgoArena Logo" 
                  width={32}
                  height={32}
                  className="rounded-lg object-cover shadow-md group-hover:shadow-lg transition-shadow duration-300"
                />
              </div>
            </div>
          )}
          
          <div className={`${isCollapsed && !isMobile ? 'flex flex-col space-y-1 w-full' : 'flex items-center space-x-1'}`}>
            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 ${
                isCollapsed && !isMobile ? 'w-full flex justify-center' : ''
              }`}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize size={16} className="text-gray-400" />
              ) : (
                <Maximize size={16} className="text-gray-400" />
              )}
            </button>

            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className={`p-1.5 hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 ${
                isCollapsed && !isMobile ? 'w-full flex justify-center' : ''
              }`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isMobile ? (
                isMobileOpen ? <X size={16} className="text-gray-300" /> : <Menu size={16} className="text-gray-300" />
              ) : (
                isCollapsed ? <ChevronRight size={16} className="text-gray-300" /> : <ChevronLeft size={16} className="text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-2 overflow-y-auto ${isCollapsed && !isMobile ? 'px-1' : 'px-4'}`}>
          {sidebarItems.map((item, idx) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.href);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`
                  w-full flex items-center rounded-xl text-left transition-all duration-200 group
                  ${isCollapsed && !isMobile 
                    ? 'px-1 py-2.5 justify-center' 
                    : 'px-3 py-3'
                  }
                  ${active 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg border border-blue-500/30' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:scale-[1.02]'
                  }
                  animate-fadeIn
                `}
                style={{ animationDelay: `${idx * 50}ms` }}
                title={isCollapsed ? item.label : ''}
              >
                <Icon 
                  size={18} 
                  className={`flex-shrink-0 ${active ? 'text-blue-400' : ''} transition-transform group-hover:scale-110`} 
                />
                
                {(!isCollapsed || isMobile) && (
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin Link */}
        {isAdmin() && (
          <div className={`py-2 ${isCollapsed && !isMobile ? 'px-1' : 'px-4'}`}>
            <button
              onClick={() => handleNavigation('/admin')}
              className={`
                w-full flex items-center rounded-xl text-orange-400 hover:bg-orange-900/20 transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-orange-500/30
                ${isCollapsed && !isMobile 
                  ? 'px-1 py-2 justify-center' 
                  : 'px-3 py-2'
                }
              `}
              title={isCollapsed ? 'Admin' : ''}
            >
              <User size={16} className="flex-shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="ml-3 font-medium">Admin Page</span>
              )}
            </button>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className={`border-t border-gray-700 py-4 ${isCollapsed && !isMobile ? 'px-1' : 'px-4'}`}>
          <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'space-x-3'} mb-3`}>
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={isCollapsed && !isMobile ? 28 : 40}
                height={isCollapsed && !isMobile ? 28 : 40}
                className="rounded-full flex-shrink-0 ring-2 ring-blue-500/30"
              />
            ) : (
              <div className={`${isCollapsed && !isMobile ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 shadow-lg`}>
                {stringUtils.getInitials(user.name)}
              </div>
            )}
            
            {(!isCollapsed || isMobile) && (
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white truncate">
                  {user.name}
                </div>
                <div className="text-sm text-gray-400 truncate">
                  {roleUtils.formatRole(user.role)}
                </div>
              </div>
            )}
          </div>
          
          {(!isCollapsed || isMobile) && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-all duration-200 hover:scale-[1.02] border border-red-500/30"
            >
              <LogOut size={16} className="mr-2" />
              <span className="font-medium">Logout</span>
            </button>
          )}
          
          {isCollapsed && !isMobile && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-1.5 text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110 border border-transparent hover:border-red-500/30"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Button */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 bg-[#262626] border border-gray-700 rounded-lg shadow-lg md:hidden hover:scale-110 transition-transform duration-200"
        >
          <Menu size={20} className="text-gray-300" />
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}