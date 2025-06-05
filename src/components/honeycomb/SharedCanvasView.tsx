/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/honeycomb/SharedCanvasView.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, Users, AlertCircle, RotateCcw, ZoomIn, ZoomOut, List } from 'lucide-react';
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
  const [showParticipants, setShowParticipants] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  
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
  
  // NEW: Ref for canvas container to properly position cursors
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

  const cleanup = () => {
    // Clear real-time subscriptions
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Clear status interval
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }

    // Clear cursor throttle
    if (cursorUpdateThrottleRef.current) {
      clearTimeout(cursorUpdateThrottleRef.current);
      cursorUpdateThrottleRef.current = null;
    }

    // Update participant status to offline
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
      
      // UPDATED: Generate display name with cool animal names for guests
      const displayName = user ? 
        `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email : 
        generateGuestName(t); // NEW: Use the animal name generator
      
      // Check for existing participant
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
          displayName || generateGuestName(t), // NEW: Use animal name as fallback
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
      
      // Load participants
      loadParticipants(sessionData.id);
      
      // Setup real-time subscriptions
      setupRealtimeSubscriptions(sessionData.id);

      // Update online status periodically
      statusIntervalRef.current = setInterval(() => {
        if (currentParticipantRef.current) {
          updateParticipantStatus(
            currentParticipantRef.current, 
            true,
            currentCursorPosition.current,
            selectedItemId
          );
        }
      }, 15000); // Every 15 seconds

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

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = (sessionId: string) => {
    console.log('Setting up realtime subscriptions for session:', sessionId);
    
    // Clean up any existing subscription
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    try {
      // Create a single channel for sharing events
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
        });

      // Store cleanup function
      cleanupRef.current = () => {
        console.log('Cleaning up sharing subscriptions');
        supabase.removeChannel(channel);
      };
      
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      
      // Retry after delay
      setTimeout(() => {
        if (session) {
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
    // Toast notifications removed as requested
  }, [participants]);

  // Handle cursor movement from canvas
  const handleCursorMove = useCallback((position: { x: number; y: number }) => {
    currentCursorPosition.current = position;
    
    // Throttle cursor position updates
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
    }, 200); // Update cursor every 200ms when moving
  }, [selectedItemId]);

  // Update selection when selectedItemId changes
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

  // Custom item selection handler that updates selection state
  const handleItemSelection = useCallback((itemId: string | null) => {
    setSelectedItemId(itemId);
  }, []);

  // Canvas control handlers
  const handleReset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 400, y: 300 }); // Reset to default center position
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - 0.1, 0.5));
  }, []);

  const toggleTaskSidebar = useCallback(() => {
    setIsTaskSidebarOpen(!isTaskSidebarOpen);
  }, [isTaskSidebarOpen]);

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {session.honeycombs?.name || 'Shared Canvas'}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                <AlertCircle size={16} />
                <span>{t('sharing.sharedView')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Canvas Controls */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
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

            {/* Participants */}
            <div className="relative">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <Users size={16} />
                <span className="text-sm">{participants.filter(p => p.is_online).length}</span>
              </button>
              
              {showParticipants && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowParticipants(false)} 
                  />
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        {t('sharing.activeParticipants')} ({participants.filter(p => p.is_online).length})
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {participants.filter(p => p.is_online).map(p => (
                          <div key={p.id} className="flex items-center gap-2 py-1">
                            <div 
                              className="w-3 h-3 rounded-full border border-white" 
                              style={{ backgroundColor: p.color }}
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              {p.display_name}
                              {p.id === currentParticipantRef.current && (
                                <span className="text-xs text-gray-500 ml-1">(You)</span>
                              )}
                            </span>
                            {p.selected_item_id && (
                              <div className="w-2 h-2 rounded-full bg-blue-500" title="Viewing item" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Copy Link */}
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Copy size={16} />
              <span className="text-sm">{t('sharing.copyLink')}</span>
            </button>
          </div>
        </div>

        {/* Permissions Banner */}
        <div className="px-4 sm:px-6 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {canEdit ? (
              <span>{t('sharing.youCanEdit')}</span>
            ) : (
              <span>{t('sharing.viewOnlyMode')}</span>
            )}
          </p>
        </div>
      </header>

      {/* Canvas - NEW: Added ref for proper cursor positioning */}
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
        
        {/* FIXED: Participant Cursors - now properly constrained to canvas area */}
        {participants.filter(p => p.is_online && p.cursor_position && p.id !== participantId).map(participant => {
          // Additional null check to satisfy TypeScript
          if (!participant.cursor_position || !canvasContainerRef.current) return null;
          
          // Get canvas container bounds
          const canvasRect = canvasContainerRef.current.getBoundingClientRect();
          
          // Convert world coordinates to screen coordinates relative to canvas
          const screenX = participant.cursor_position.x * zoom + offset.x;
          const screenY = participant.cursor_position.y * zoom + offset.y;
          
          // Check if cursor is within canvas bounds
          const isWithinCanvas = screenX >= 0 && 
                                screenX <= canvasRect.width && 
                                screenY >= 0 && 
                                screenY <= canvasRect.height;
          
          // Only render cursor if it's within the canvas area
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
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: participant.color }}
              />
              <div 
                className="mt-1 px-2 py-1 rounded text-xs text-white shadow-lg whitespace-nowrap"
                style={{ backgroundColor: participant.color }}
              >
                {participant.display_name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};