/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/honeycomb/SharingModal.tsx
import { useState, useEffect } from 'react'
import { Copy, Users, ChevronDown, Eye, Edit, X, Crown, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import { 
  createSharingSession, 
  getActiveSession, 
  updateSessionPermissions, 
  endSharingSession,
  getSessionParticipants
} from '@/services/sharing'

interface SharingModalProps {
    isOpen: boolean;
    onClose: () => void;
    honeycombId: string;
    honeycombName: string;
    isHost?: boolean; // NEW: To identify if current user is the host
    onToggleCursors?: (show: boolean) => void; // NEW: Callback to control cursor visibility
}

interface Participant {
  id: string;
  display_name: string;
  is_online: boolean;
  cursor_position?: { x: number; y: number };
  selected_item_id?: string;
  color: string;
  permissions: 'view' | 'edit' | 'comment';
  joined_at: Date;
  last_seen_at: Date;
  user_id?: string;
}

type PermissionLevel = 'view' | 'edit';
type TabType = 'share' | 'participants';

export default function SharingModal({ 
    isOpen, 
    onClose, 
    honeycombId, 
    honeycombName,
    // isHost = true,
    // onToggleCursors,
}: SharingModalProps) {
    const { t } = useTranslation();
    const [shareUrl, setShareUrl] = useState('');
    const [, setShareCode] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [permissions, setPermissions] = useState<PermissionLevel>('view');
    const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('share'); // NEW: Tab state
    // const [showCursor , setShowCursors] = useState(true);
    const [participantsLoading, setParticipantsLoading] = useState(false); // NEW: Participants loading state

    useEffect(() => {
        if (isOpen && honeycombId) {
            loadOrCreateSession();
        }
    }, [isOpen, honeycombId]);

    // Load participants immediately when modal opens and refresh periodically
    useEffect(() => {
        if (isOpen && sessionId) {
            loadParticipants();
            
            // Set up interval to refresh participants every 5 seconds
            const interval = setInterval(() => {
                loadParticipants();
            }, 5000);
            
            return () => clearInterval(interval);
        }
    }, [isOpen, sessionId]);

    const loadOrCreateSession = async () => {
        setLoading(true);
        try {
            // Check if there's an active session
            const { data: existingSession } = await getActiveSession(honeycombId);
            
            if (existingSession) {
                setShareUrl(existingSession.share_link);
                setShareCode(existingSession.share_code);
                setSessionId(existingSession.id);
                setPermissions(existingSession.permissions as PermissionLevel);
                generateQRCode(existingSession.share_link);
            } else {
                // Create new session
                const { data: newSession, error } = await createSharingSession(honeycombId, permissions);
                
                if (error) {
                    throw error;
                }
                
                if (newSession) {
                    setShareUrl(newSession.share_link);
                    setShareCode(newSession.share_code);
                    setSessionId(newSession.id);
                    generateQRCode(newSession.share_link);
                }
            }
        } catch (error) {
            console.error('Error creating sharing session:', error);
            toast.error(t('sharing.errorCreatingSession'));
        } finally {
            setLoading(false);
        }
    };

    // NEW: Load participants function
    const loadParticipants = async () => {
        if (!sessionId) return;
        
        setParticipantsLoading(true);
        try {
            const { data, error } = await getSessionParticipants(sessionId);
            
            if (error) {
                throw error;
            }
            
            if (data) {
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                const participantsWithColors = data.map((p, index) => ({
                    ...p,
                    color: colors[index % colors.length],
                    joined_at: new Date(p.joined_at),
                    last_seen_at: new Date(p.last_seen_at),
                }));
                setParticipants(participantsWithColors);
            }
        } catch (error) {
            console.error('Error loading participants:', error);
            toast.error(t('sharing.errorLoadingParticipants'));
        } finally {
            setParticipantsLoading(false);
        }
    };

    const generateQRCode = async (url: string) => {
        try {
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl)
            .then(() => toast.success(t('notifications.linkCopied')))
            .catch(err => {
                console.error(t('errors.copyError'), err);
                toast.error(t('errors.failedToCopyLink'));
            });
    };

    const handlePermissionChange = async (newPermission: PermissionLevel) => {
        if (!sessionId) return;
        
        setLoading(true);
        try {
            const { error } = await updateSessionPermissions(sessionId, newPermission);
            
            if (error) {
                throw error;
            }
            
            setPermissions(newPermission);
            setShowPermissionDropdown(false);
            toast.success(t('sharing.permissionsUpdated'));
        } catch (error) {
            console.error('Error updating permissions:', error);
            toast.error(t('sharing.errorUpdatingPermissions'));
        } finally {
            setLoading(false);
        }
    };

    const handleEndSession = async () => {
        if (!sessionId) return;
        
        if (window.confirm(t('sharing.confirmEndSession'))) {
            setLoading(true);
            try {
                const { error } = await endSharingSession(sessionId);
                
                if (error) {
                    throw error;
                }
                
                toast.success(t('sharing.sessionEnded'));
                onClose();
            } catch (error) {
                console.error('Error ending session:', error);
                toast.error(t('sharing.errorEndingSession'));
            } finally {
                setLoading(false);
            }
        }
    };

    // NEW: Format time ago helper
    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header with Tabs */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold">{t('sharing.title')}</h2>
                            <p className="text-sm text-gray-500 mt-1">{honeycombName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* NEW: Tab Navigation */}
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('share')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'share'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Eye size={16} />
                            {t('sharing.shareTab')}
                        </button>
                        <button
                            onClick={() => setActiveTab('participants')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'participants'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Users size={16} />
                            {t('sharing.participantsTab')} ({participants.filter(p => p.is_online).length})
                        </button>
                    </div>
                </div>

                {/* Content - FIXED: Removed overflow-hidden and added proper overflow handling */}
                <div className={`flex-1 p-6 ${activeTab === 'participants' ? 'overflow-y-auto' : ''}`}>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Share Tab Content */}
                            {activeTab === 'share' && (
                                <div className="space-y-6">
                                    {/* QR Code */}
                                    <div className="flex justify-center">
                                        {qrCodeUrl ? (
                                            <img
                                                src={qrCodeUrl}
                                                alt={t('sharing.qrCodeAlt')}
                                                className="w-48 h-48 rounded-lg shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-48 h-48 bg-gray-100 rounded-lg animate-pulse"></div>
                                        )}
                                    </div>

                                    {/* Share Link with Permissions */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={shareUrl}
                                                readOnly
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                                aria-label={t('sharing.shareLink')}
                                            />
                                            <button
                                                onClick={copyToClipboard}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
                                                aria-label={t('actions.copyLink')}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* FIXED: Permissions Dropdown with proper overflow handling */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowPermissionDropdown(!showPermissionDropdown)}
                                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 w-full"
                                            >
                                                <span className="flex-1 text-left text-sm">
                                                    {t('sharing.peopleWith')} {' '}
                                                    <span className="font-medium">
                                                        {permissions === 'view' ? t('sharing.viewAccess') : t('sharing.editAccess')}
                                                    </span>
                                                </span>
                                                <ChevronDown size={16} className={`transition-transform ${showPermissionDropdown ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showPermissionDropdown && (
                                                <>
                                                    {/* Backdrop to close dropdown */}
                                                    <div 
                                                        className="fixed inset-0 z-10" 
                                                        onClick={() => setShowPermissionDropdown(false)}
                                                    />
                                                    {/* Dropdown with higher z-index and proper positioning */}
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                                                        <button
                                                            onClick={() => handlePermissionChange('view')}
                                                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-left"
                                                        >
                                                            <Eye size={16} className="text-gray-500" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">{t('sharing.viewOnly')}</p>
                                                                <p className="text-xs text-gray-500">{t('sharing.viewOnlyDesc')}</p>
                                                            </div>
                                                            {permissions === 'view' && (
                                                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handlePermissionChange('edit')}
                                                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-left"
                                                        >
                                                            <Edit size={16} className="text-gray-500" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">{t('sharing.canEdit')}</p>
                                                                <p className="text-xs text-gray-500">{t('sharing.canEditDesc')}</p>
                                                            </div>
                                                            {permissions === 'edit' && (
                                                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                            )}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* NEW: Participants Tab Content */}
                            {activeTab === 'participants' && (
                                <div className="space-y-4">
                                    {/* Participants List */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {t('sharing.activeParticipants')} ({participants.filter(p => p.is_online).length})
                                            </h3>
                                            {participantsLoading && (
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin" />
                                            )}
                                        </div>
                                        
                                        {participants.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Users size={32} className="mx-auto text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500">{t('sharing.noParticipants')}</p>
                                                <p className="text-xs text-gray-400 mt-1">{t('sharing.shareToInvite')}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {participants.map(participant => (
                                                    <div 
                                                        key={participant.id} 
                                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                                            participant.is_online 
                                                                ? 'bg-green-50 border-green-200' 
                                                                : 'bg-gray-50 border-gray-200 opacity-60'
                                                        }`}
                                                    >
                                                        {/* Status indicator */}
                                                        <div className="relative flex-shrink-0">
                                                            <div 
                                                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                                                                style={{ backgroundColor: participant.color }}
                                                            >
                                                                <span className="text-xs font-medium text-white">
                                                                    {participant.display_name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                                                participant.is_online ? 'bg-green-500' : 'bg-gray-400'
                                                            }`} />
                                                        </div>
                                                        
                                                        {/* Participant info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                                    {participant.display_name}
                                                                </span>
                                                                {participant.user_id && (
                                                                    <Crown size={12} className="text-amber-500 flex-shrink-0" aria-label="Registered user" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                <span className={`capitalize ${
                                                                    participant.permissions === 'edit' ? 'text-amber-600' : 
                                                                    participant.permissions === 'view' ? 'text-blue-600' : 'text-gray-600'
                                                                }`}>
                                                                    {participant.permissions}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {participant.is_online ? 'Online' : formatTimeAgo(participant.last_seen_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                    <button
                        onClick={handleEndSession}
                        className="text-sm text-red-600 hover:text-red-700"
                        disabled={loading}
                    >
                        {t('sharing.endSession')}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                    >
                        {t('actions.done')}
                    </button>
                </div>
            </div>
        </div>
    );
}