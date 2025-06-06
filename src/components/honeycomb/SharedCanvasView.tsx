/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/honeycomb/SharedCanvasView.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Copy, 
  Users, 
  AlertCircle, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  List, 
  ChevronDown,
  Share,
  Crown,
  Wifi,
  WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HoneycombCanvas } from './canvas/HoneycombCanvas';
import { 
  getSessionByCode, 
  joinSharingSession,
  updateParticipantStatus,
  getSessionParticipants,
  cleanupOfflineParticipants
} from '@/services/sharing';
import { useAuth } from '@/context/AuthContext';
import { generateGuestName } from '@/utils/guestNames';
import supabase from '@/utils/supabase';

interface Participant {
  id: string;
  display_name: string;
  is_online: boolean;
  cursor_position?: { x: number; y: number };
  selected_item_id?: string;
  color: string;
}

export const SharedCanvasView = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  
  // Mobile UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Refs to track cleanup and status updates
  const cleanupRef = useRef<(() => void) | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentParticipantRef = useRef<string | null>(null);
  const cursorUpdateThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const currentCursorPosition = useRef({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Load session data
  useEffect(() => {
    if (!shareCode) {
      navigate('/');
      return;
    }

    loadSession();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [shareCode]);

  // Handle escape key and prevent body scroll when mobile menu is open
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setShowParticipants(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const cleanup = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }

    if (cursorUpdateThrottleRef.current) {
      clearTimeout(cursorUpdateThrottleRef.current);
      cursorUpdateThrottleRef.current = null;
    }

    if (currentParticipantRef.current) {
      updateParticipantStatus(currentParticipantRef.current, false);
      currentParticipantRef.current = null;
    }
  };

  const loadSession = async () => {
    try {
      const { data: sessionData, error } = await getSessionByCode(shareCode!);
      
      if (error || !sessionData) {
        toast.error(t('sharing.invalidShareLink'));
        navigate('/');
        return;
      }

      setSession(sessionData);
      
      const displayName = user ? 
        `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email : 
        generateGuestName(t);
      
      const { data: existingParticipants } = await getSessionParticipants(sessionData.id);
      let existingParticipant = null;
      
      if (user) {
        existingParticipant = existingParticipants?.find(p => p.user_id === user.id);
      } else {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        existingParticipant = existingParticipants?.find(p => 
          !p.user_id && 
          p.display_name === displayName && 
          new Date(p.joined_at) > fiveMinutesAgo
        );
      }

      let participant;
      if (existingParticipant) {
        await updateParticipantStatus(existingParticipant.id, true);
        participant = existingParticipant;
      } else {
        const { data: newParticipant, error: joinError } = await joinSharingSession(
          sessionData.id,
          displayName || generateGuestName(t),
          user?.id
        );
        
        if (joinError || !newParticipant) {
          toast.error(t('sharing.errorJoiningSession'));
          navigate('/');
          return;
        }
        participant = newParticipant;
      }

      setParticipantId(participant.id);
      currentParticipantRef.current = participant.id;
      setCanEdit(sessionData.permissions === 'edit' || participant.permissions === 'edit');
      
      loadParticipants(sessionData.id);
      setupRealtimeSubscriptions(sessionData.id);

      statusIntervalRef.current = setInterval(() => {
        if (currentParticipantRef.current) {
          updateParticipantStatus(
            currentParticipantRef.current, 
            true,
            currentCursorPosition.current,
            selectedItemId
          );
        }
      }, 15000);

    } catch (error) {
      console.error('Error loading session:', error);
      toast.error(t('sharing.errorLoadingSession'));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (sessionId: string) => {
    await cleanupOfflineParticipants(sessionId);
    
    const { data, error } = await getSessionParticipants(sessionId);
    
    if (!error && data) {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      const participantsWithColors = data.map((p, index) => ({
        ...p,
        color: colors[index % colors.length]
      }));
      setParticipants(participantsWithColors);
    }
  };

  const setupRealtimeSubscriptions = (sessionId: string) => {
    console.log('Setting up realtime subscriptions for session:', sessionId);
    
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    try {
      const channel = supabase
        .channel(`sharing_${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sharing_participants',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('Participant change:', payload);
            if (payload.new) {
              handleParticipantChange(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sharing_changes',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('Change received:', payload);
            if (payload.new) {
              handleChangeReceived(payload.new);
            }
          }
        )
        .subscribe((status, err) => {
          console.log('Sharing subscription status:', status, err);
          
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('disconnected');
            
            setTimeout(() => {
              setConnectionStatus('reconnecting');
              setupRealtimeSubscriptions(sessionId);
            }, 2000);
          }
        });

      cleanupRef.current = () => {
        console.log('Cleaning up sharing subscriptions');
        supabase.removeChannel(channel);
      };
      
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setConnectionStatus('disconnected');
      
      setTimeout(() => {
        if (session) {
          setConnectionStatus('reconnecting');
          setupRealtimeSubscriptions(sessionId);
        }
      }, 5000);
    }
  };

  const handleParticipantChange = useCallback((participant: any) => {
    setParticipants(prev => {
      const existing = prev.find(p => p.id === participant.id);
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      
      if (existing) {
        return prev.map(p => 
          p.id === participant.id 
            ? { ...p, ...participant }
            : p
        );
      } else {
        return [...prev, { 
          ...participant, 
          color: colors[prev.length % colors.length] 
        }];
      }
    });
  }, []);

  const handleChangeReceived = useCallback((change: any) => {
    console.log('Real-time change received:', change);
  }, [participants]);

  const handleCursorMove = useCallback((position: { x: number; y: number }) => {
    currentCursorPosition.current = position;
    
    if (cursorUpdateThrottleRef.current) {
      clearTimeout(cursorUpdateThrottleRef.current);
    }
    
    cursorUpdateThrottleRef.current = setTimeout(() => {
      if (currentParticipantRef.current) {
        updateParticipantStatus(
          currentParticipantRef.current,
          true,
          currentCursorPosition.current,
          selectedItemId || undefined
        );
      }
    }, 200);
  }, [selectedItemId]);

  useEffect(() => {
    if (currentParticipantRef.current && selectedItemId !== null) {
      updateParticipantStatus(
        currentParticipantRef.current,
        true,
        currentCursorPosition.current,
        selectedItemId
      );
    }
  }, [selectedItemId]);

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/share/${shareCode}`;
    navigator.clipboard.writeText(shareLink)
      .then(() => toast.success(t('notifications.linkCopied')))
      .catch(() => toast.error(t('errors.failedToCopyLink')));
  };

  const handleProgressUpdate = (progress: number) => {
    console.log('Progress:', progress);
  };

  const handleItemSelection = useCallback((itemId: string | null) => {
    setSelectedItemId(itemId);
  }, []);

  // Canvas control handlers
  const handleReset = useCallback(() => {
    setZoom(1);
    if( window.innerWidth < 768){
      setOffset({ x: 180, y: 400 });
    }else{
      setOffset({ x: 800, y: 500 });
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - 0.1, 0.5));
  }, []);

  const toggleTaskSidebar = useCallback(() => {
    setIsTaskSidebarOpen(!isTaskSidebarOpen);
    // Close mobile menu when opening sidebar on mobile
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  }, [isTaskSidebarOpen]);

  const toggleParticipants = () => {
    setShowParticipants(!showParticipants);
    // Close mobile menu when opening participants on mobile
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          <p className="text-gray-600">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const activeParticipantsCount = participants.filter(p => p.is_online).length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-30">
        {/* Main Header */}
        <div className="px-3 sm:px-6 py-3 flex items-center justify-between">
          {/* Left side - Title and status */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {session.honeycombs?.name || 'Shared Canvas'}
            </h1>
            
            {/* Connection Status - Mobile optimized */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs sm:text-sm ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'reconnecting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {connectionStatus === 'connected' ? (
                  <Wifi size={12} className="sm:w-4 sm:h-4" />
                ) : (
                  <WifiOff size={12} className="sm:w-4 sm:h-4" />
                )}
                <span className="hidden sm:inline">
                  {connectionStatus === 'connected' ? t('sharing.connected') :
                   connectionStatus === 'reconnecting' ? t('sharing.reconnecting') :
                   t('sharing.disconnected')}
                </span>
              </div>
              
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs sm:text-sm">
                <AlertCircle size={12} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t('sharing.sharedView')}</span>
              </div>
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center gap-2">
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={handleReset}
                className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                title={t('actions.resetView')}
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                title={t('actions.zoomOut')}
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs text-gray-600 px-2 min-w-[45px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                title={t('actions.zoomIn')}
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={toggleTaskSidebar}
                className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                title={isTaskSidebarOpen ? t('actions.closeSidebar') : t('actions.openSidebar')}
              >
                <List size={16} />
              </button>
            </div>

            {/* Participants Button */}
            <button
              onClick={toggleParticipants}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Users size={14} className="sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{activeParticipantsCount}</span>
              <ChevronDown size={12} className={`sm:w-3 sm:h-3 transition-transform ${showParticipants ? 'rotate-180' : ''}`} />
            </button>

            {/* Copy Link Button */}
            <button
              onClick={copyShareLink}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Copy size={16} />
              <span className="text-sm">{t('sharing.copyLink')}</span>
            </button>
          </div>
        </div>

        {/* Permissions Banner */}
        <div className="px-3 sm:px-6 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">
            {canEdit ? (
              <span>{t('sharing.youCanEdit')}</span>
            ) : (
              <span>{t('sharing.viewOnlyMode')}</span>
            )}
          </p>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute top-full right-0 w-full sm:w-64 bg-white border-b border-gray-200 shadow-lg z-50">
              <div className="p-4 space-y-3">
                {/* Share Options */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">{t('sharing.shareOptions')}</h3>
                  <button
                    onClick={() => { copyShareLink(); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-2 w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Share size={16} />
                    <span className="text-sm">{t('sharing.copyLink')}</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Participants Dropdown */}
        {showParticipants && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowParticipants(false)} />
            <div className="absolute top-full right-0 w-full sm:w-80 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {t('sharing.activeParticipants')} ({activeParticipantsCount})
                </h3>
                
                {participants.length === 0 ? (
                  <div className="text-center py-6">
                    <Users size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">{t('sharing.noParticipants')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participants.filter(p => p.is_online).map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="relative flex-shrink-0">
                          <div 
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                            style={{ backgroundColor: p.color }}
                          >
                            <span className="text-xs font-medium text-white">
                              {p.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {p.display_name}
                            </span>
                            {p.id === currentParticipantRef.current && (
                              <span className="text-xs text-gray-500">(You)</span>
                            )}
                            {(p as any).user_id && (
                              <Crown size={12} className="text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {(p as any).permissions || 'view'}
                          </div>
                        </div>
                        
                        {p.selected_item_id && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" title="Viewing item" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Canvas */}
      <div ref={canvasContainerRef} className="flex-1 relative overflow-hidden">
        <HoneycombCanvas
          honeycombId={session.honeycomb_id}
          zoom={zoom}
          setZoom={setZoom}
          offset={offset}
          setOffset={setOffset}
          isTaskSidebarOpen={isTaskSidebarOpen}
          setisTaskSidebarOpen={setIsTaskSidebarOpen}
          onProgressUpdate={handleProgressUpdate}
          isSharedMode={true}
          canEdit={canEdit}
          sessionId={session.id}
          participantId={participantId}
          participants={participants.filter(p => p.is_online)}
          onItemSelection={handleItemSelection}
          showParticipantCursors={true}
          onCursorMove={handleCursorMove}
        />
        
        {/* Participant Cursors */}
        {participants.filter(p => p.is_online && p.cursor_position && p.id !== participantId).map(participant => {
          if (!participant.cursor_position || !canvasContainerRef.current) return null;
          
          const canvasRect = canvasContainerRef.current.getBoundingClientRect();
          const screenX = participant.cursor_position.x * zoom + offset.x;
          const screenY = participant.cursor_position.y * zoom + offset.y;
          
          const isWithinCanvas = screenX >= 0 && 
                                screenX <= canvasRect.width && 
                                screenY >= 0 && 
                                screenY <= canvasRect.height;
          
          if (!isWithinCanvas) return null;
          
          return (
            <div
              key={participant.id}
              className="absolute pointer-events-none z-50 transition-all duration-200"
              style={{
                left: screenX,
                top: screenY,
                transform: 'translate(-2px, -2px)',
              }}
            >
              <div 
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: participant.color }}
              />
              <div 
                className="mt-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs text-white shadow-lg whitespace-nowrap max-w-24 sm:max-w-none truncate"
                style={{ backgroundColor: participant.color }}
              >
                {participant.display_name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Bottom Controls - Only show when not in task sidebar */}
      {!isTaskSidebarOpen && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={toggleTaskSidebar}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};