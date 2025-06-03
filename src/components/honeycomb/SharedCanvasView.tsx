/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/honeycomb/SharedCanvasView.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, Users, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { HoneycombCanvas } from './canvas/HoneycombCanvas';
import { 
  getSessionByCode, 
  joinSharingSession, 
  cloneHoneycombForUser,
  setupSharingRealtimeSubscription,
  updateParticipantStatus,
  getSessionParticipants,
  cleanupOfflineParticipants
} from '@/services/sharing';
import { useAuth } from '@/context/AuthContext';

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
  
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);

  // Refs to track cleanup
  const cleanupRef = useRef<(() => void) | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentParticipantRef = useRef<string | null>(null);

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
      
      // Generate display name
      const displayName = user ? 
        `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email : 
        `Guest ${Math.floor(Math.random() * 1000)}`;
      
      // Check if this user is already a participant to avoid duplicates
      const { data: existingParticipants } = await getSessionParticipants(sessionData.id);
      let existingParticipant = null;
      
      if (user) {
        // For authenticated users, check by user_id
        existingParticipant = existingParticipants?.find(p => p.user_id === user.id);
      } else {
        // For anonymous users, check by display_name and recent join time (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        existingParticipant = existingParticipants?.find(p => 
          !p.user_id && 
          p.display_name === displayName && 
          new Date(p.joined_at) > fiveMinutesAgo
        );
      }

      let participant;
      if (existingParticipant) {
        // Update existing participant to online
        await updateParticipantStatus(existingParticipant.id, true);
        participant = existingParticipant;
        console.log('Using existing participant:', participant.id);
      } else {
        // Join as new participant
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
        console.log('Created new participant:', participant.id);
      }

      setParticipantId(participant.id);
      currentParticipantRef.current = participant.id;
      setCanEdit(sessionData.permissions === 'edit' || participant.permissions === 'edit');
      
      // Load participants
      loadParticipants(sessionData.id);
      
      // Setup real-time subscriptions (only once)
      if (!cleanupRef.current) {
        cleanupRef.current = setupSharingRealtimeSubscription(
          sessionData.id,
          handleParticipantChange,
          handleChangeReceived
        );
      }

      // Update online status periodically
      if (!statusIntervalRef.current) {
        statusIntervalRef.current = setInterval(() => {
          if (currentParticipantRef.current) {
            updateParticipantStatus(currentParticipantRef.current, true);
          }
        }, 30000); // Every 30 seconds
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error(t('sharing.errorLoadingSession'));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (sessionId: string) => {
    // Clean up old offline participants first
    await cleanupOfflineParticipants(sessionId);
    
    const { data, error } = await getSessionParticipants(sessionId);
    
    if (!error && data) {
      // Assign colors to participants
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      const participantsWithColors = data.map((p, index) => ({
        ...p,
        color: colors[index % colors.length]
      }));
      setParticipants(participantsWithColors);
    }
  };

  const handleParticipantChange = (participant: any) => {
    setParticipants(prev => {
      const existing = prev.find(p => p.id === participant.id);
      if (existing) {
        return prev.map(p => p.id === participant.id ? { ...p, ...participant } : p);
      } else {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        return [...prev, { ...participant, color: colors[prev.length % colors.length] }];
      }
    });
  };

  const handleChangeReceived = (change: any) => {
    // This would be handled by the canvas component
    // to update the honeycomb items in real-time
    console.log('Change received:', change);
  };

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
    // Progress updates in shared mode
    console.log('Progress:', progress);
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {session.honeycombs?.name || 'Shared Canvas'}
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
              <AlertCircle size={16} />
              <span>{t('sharing.sharedView')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Participants */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="relative flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Users size={16} />
              <span className="text-sm">{participants.length}</span>
              {showParticipants && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">{t('sharing.activeParticipants')}</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {participants.map(p => (
                        <div key={p.id} className="flex items-center gap-2 py-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="text-sm text-gray-700">{p.display_name}</span>
                          <div className={`ml-auto w-2 h-2 rounded-full ${p.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </button>

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
          participants={participants}
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