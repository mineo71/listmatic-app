/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { RotateCcw, ZoomIn, ZoomOut, List, Share, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Hive, Honeycomb } from '@/types';
import { HoneycombCanvas } from '../honeycomb/canvas/HoneycombCanvas.tsx';
import SharingModal from '../honeycomb/SharingModal';
import MobileControlsMenu from '../honeycomb/MobileControlsMenu';
import { useAuth } from '@/context/AuthContext';

type ContextType = {
  hives: Hive[];
  onUpdateHoneycomb: (honeycomb: Honeycomb) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

export const HoneycombViewWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hives } = useOutletContext<ContextType>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isSidebarOpen, onToggleSidebar } = useOutletContext<ContextType>();
  const { user } = useAuth();

  // Add state for delayed menu button visibility
  const [showMenuButton, setShowMenuButton] = useState(!isSidebarOpen);

  // View state
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [showParticipantCursors, setShowParticipantCursors] = useState(true);

  // Handle sidebar state changes with delay for menu button
  useEffect(() => {
    if (isSidebarOpen) {
      // Hide menu button immediately when sidebar opens
      setShowMenuButton(false);
    } else {
      // Show menu button after sidebar closing animation completes (300ms)
      const timer = setTimeout(() => {
        setShowMenuButton(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isSidebarOpen]);

  // Calculate the center position based on container size and sidebar state
  const calculateCenterPosition = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      // When sidebar is open, shift center left by 320px
      x: isTaskSidebarOpen ? rect.width / 2 - 162 : rect.width / 2,
      y: rect.height / 2
    };
  }, [isTaskSidebarOpen]);

  // Initialize and update center position when container loads or sidebar state changes
  useEffect(() => {
    setOffset(calculateCenterPosition());
  }, [calculateCenterPosition]);

  // Also update center when container size changes
  useEffect(() => {
    const handleResize = () => {
      setOffset(calculateCenterPosition());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateCenterPosition]);

  // Progress update handler
  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
  };

  // Recursively find honeycomb in hives and their subhives
  const findHoneycomb = (hives: Hive[]): Honeycomb | undefined => {
    for (const hive of hives) {
      const found = hive.honeycombs.find(hc => hc.id === id);
      if (found) return found;

      for (const subHive of hive.subHives) {
        const foundInSub = subHive.honeycombs.find(hc => hc.id === id);
        if (foundInSub) return foundInSub;
      }
    }
    return undefined;
  };

  const honeycomb = findHoneycomb(hives);

  // Redirect to home if honeycomb not found
  if (!honeycomb) {
    navigate('/', { replace: true });
    return null;
  }

  // Handlers for view controls
  const handleReset = () => {
    setZoom(1);
    setOffset(calculateCenterPosition());
  };

  const handleZoomIn = () => {
    setZoom(z => Math.min(z + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoom(z => Math.max(z - 0.1, 0.9));
  };

  const toggleTaskSidebar = () => {
    setIsTaskSidebarOpen(!isTaskSidebarOpen);
  };

  const openSharingModal = () => {
    setIsSharingModalOpen(true);
  };

  const closeSharingModal = () => {
    setIsSharingModalOpen(false);
  };

  // Handle cursor visibility toggle from sharing modal
  const handleToggleCursors = (show: boolean) => {
    setShowParticipantCursors(show);
  };

  // Check if current user is the owner/host of this honeycomb
  const isHost = useMemo(() => {
    return true;
  }, [user, honeycomb]);

  return (
      <div className="flex flex-col h-full overflow-hidden relative">
        {/* Header with controls */}
        <div className="flex-shrink-0 px-6 py-[14px] border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div
                className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-8 transition-all duration-300 w-full`}
            >
              <div className='flex flex-row items-center gap-4'>
                {showMenuButton && onToggleSidebar && (
                <button
                    onClick={onToggleSidebar}
                    className="z-20 p-2 bg-white shadow-lg hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-xl opacity-0 animate-fade-in"
                    style={{
                      animation: 'fadeIn 0.1s ease-out forwards'
                    }}
                    title={t('actions.openSidebar')}
                >
                  <Menu size={20} className="text-gray-700" />
                </button>
              )}
                <h1 className="text-2xl font-bold text-gray-900">{honeycomb.name}</h1>
              </div>

              {/* Progress bar */}
              <div className="w-[90%] sm:w-64">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{t('wrapper.progress')}</span>
                  <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                      style={{width: `${progress}%`}}
                  />
                </div>
              </div>
            </div>

            <div className="hidden sm:flex gap-2">
              <button
                  onClick={handleReset}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title={t('actions.resetView')}
              >
                <RotateCcw size={20}/>
              </button>
              <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title={t('actions.zoomIn')}
              >
                <ZoomIn size={20}/>
              </button>
              <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title={t('actions.zoomOut')}
              >
                <ZoomOut size={20}/>
              </button>
              <button
                  onClick={toggleTaskSidebar}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title={isTaskSidebarOpen ? t('actions.closeSidebar') : t('actions.openSidebar')}
              >
                <List size={20}/>
              </button>
              <button
                  onClick={openSharingModal}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title={t('actions.share')}
              >
                <Share size={20}/>
              </button>
            </div>
          </div>
        </div>

        {/* Canvas area with transition for smooth sidebar toggling */}
        <div
            ref={containerRef}
            className="flex-grow h-0 relative transition-all duration-300"
        >
          <HoneycombCanvas
              key={honeycomb.id}
              honeycombId={honeycomb.id}
              zoom={zoom}
              setZoom={setZoom}
              offset={offset}
              setOffset={setOffset}
              isTaskSidebarOpen={isTaskSidebarOpen}
              setisTaskSidebarOpen={setIsTaskSidebarOpen}
              onProgressUpdate={handleProgressUpdate}
              showParticipantCursors={showParticipantCursors}
              onCursorMove={() => {}}
          />
        </div>
        
        <SharingModal 
          isOpen={isSharingModalOpen} 
          onClose={closeSharingModal}
          honeycombId={honeycomb.id}
          honeycombName={honeycomb.name}
          isHost={isHost}
          onToggleCursors={handleToggleCursors}
        />

        <MobileControlsMenu
            zoom={zoom}
            handleReset={handleReset}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            toggleTaskSidebar={toggleTaskSidebar}
            isTaskSidebarOpen={isTaskSidebarOpen}
            openSharingModal={openSharingModal}
        />

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
  );
};