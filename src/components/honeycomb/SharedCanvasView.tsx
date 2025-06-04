/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/honeycomb/SharedCanvasView.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, Users, Plus, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { HoneycombCanvas } from './canvas/HoneycombCanvas';
import { 
  getSessionByCode, 
  joinSharingSession, 
  cloneHoneycombForUser,
  // setupSharingRealtimeSubscription,
  updateParticipantStatus,
  getSessionParticipants,
  cleanupOfflineParticipants
} from '@/services/sharing';
import { useAuth } from '@/context/AuthContext';
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
  const [isCloning, setIsCloning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Refs to track cleanup and mouse position
  const cleanupRef = useRef<(() => void) | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentParticipantRef = useRef<string | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const cursorUpdateThrottleRef = useRef<NodeJS.Timeout | null>(null);

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

    setConnectionStatus('disconnected');
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
      
      // Generate display name
      const displayName = user ? 
        `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email : 
        `Guest ${Math.floor(Math.random() * 1000)}`;
      
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
          displayName || 'Anonymous User',
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
            mousePositionRef.current,
            selectedItemId
          );
        }
      }, 15000); // Every 15 seconds

      setConnectionStatus('connected');
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

// Key changes for SharedCanvasView.tsx real-time setup

// Replace the setupRealtimeSubscriptions function with this:
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
          console.log('Sharing change:', payload);
          if (payload.new) {
            handleChangeReceived(payload.new);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Sharing subscription status:', status, err);
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED' || status === 'SUBSCRIBING') {
          setConnectionStatus('disconnected');
        } else {
          console.error('Subscription error:', status, err);
        }
      });

    // Store cleanup function
    cleanupRef.current = () => {
      console.log('Cleaning up sharing subscriptions');
      supabase.removeChannel(channel);
    };
    
  } catch (error) {
    console.error('Error setting up real-time subscriptions:', error);
    setConnectionStatus('disconnected');
    
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
    
    // Show notification for changes made by others
    if (change.participant_id !== currentParticipantRef.current) {
      const participant = participants.find(p => p.id === change.participant_id);
      const participantName = participant?.display_name || 'Someone';
      
      switch (change.change_type) {
        case 'create':
          if (change.item_id === 'bulk') {
            toast.success(`${participantName} generated new honeycomb structure`, {
              icon: '✨'
            });
          } else {
            toast.success(`${participantName} added a new hexagon`, {
              icon: '➕'
            });
          }
          break;
        case 'update':
          toast.success(`${participantName} updated a hexagon`, {
            icon: '✏️'
          });
          break;
        case 'delete':
          toast.success(`${participantName} removed a hexagon`, {
            icon: '🗑️'
          });
          break;
      }
    }
  }, [participants]);

  // Handle mouse movement for cursor tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
    
    // Throttle cursor position updates
    if (cursorUpdateThrottleRef.current) {
      clearTimeout(cursorUpdateThrottleRef.current);
    }
    
    cursorUpdateThrottleRef.current = setTimeout(() => {
      if (currentParticipantRef.current) {
        updateParticipantStatus(
          currentParticipantRef.current,
          true,
          mousePositionRef.current,
          selectedItemId || undefined
        );
      }
    }, 200); // Update cursor every 200ms when moving
  }, [selectedItemId]);

  // Setup mouse tracking
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // Update selection when selectedItemId changes
  useEffect(() => {
    if (currentParticipantRef.current && selectedItemId !== null) {
      updateParticipantStatus(
        currentParticipantRef.current,
        true,
        mousePositionRef.current,
        selectedItemId
      );
    }
  }, [selectedItemId]);

  const handleAddToFiles = async () => {
    if (!session || !user) {
      toast.error(t('sharing.mustBeLoggedIn'));
      return;
    }

    setIsCloning(true);
    try {
      const { data: newHoneycombId, error } = await cloneHoneycombForUser(session.id);
      
      if (error) {
        throw error;
      }

      toast.success(t('sharing.addedToFiles'));
      navigate(`/honeycomb/${newHoneycombId}`);
    } catch (error) {
      console.error('Error cloning honeycomb:', error);
      toast.error(t('sharing.errorAddingToFiles'));
    } finally {
      setIsCloning(false);
    }
  };

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
              
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : connectionStatus === 'reconnecting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi size={16} />
                    <span>Live</span>
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            {/* Add to Files */}
            {user && (
              <button
                onClick={handleAddToFiles}
                disabled={isCloning}
                className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {isCloning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                <span className="text-sm">{t('sharing.addToFiles')}</span>
              </button>
            )}
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

      {/* Canvas */}
      <div className="flex-1 relative">
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
        />
      </div>

      {/* Limitations Notice */}
      {!canEdit && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">{t('sharing.viewOnlyNotice')}</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• {t('sharing.noEditingAllowed')}</li>
            <li>• {t('sharing.noAIGeneration')}</li>
            <li>• {t('sharing.noSharingAllowed')}</li>
          </ul>
        </div>
      )}
    </div>
  );
};