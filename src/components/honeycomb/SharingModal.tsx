/* eslint-disable react-hooks/exhaustive-deps */
// src/components/honeycomb/SharingModal.tsx
import { useState, useEffect } from 'react'
import { Copy, Users, Eye, Edit, X, Crown, Clock, Share } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import QRCodeGenerator from 'qrcode'
import { EndSessionModal } from './EndSessionModal'
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
    isHost?: boolean;
    onToggleCursors?: (show: boolean) => void;
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
}: SharingModalProps) {
    const { t } = useTranslation();
    const [shareUrl, setShareUrl] = useState('');
    const [, setShareCode] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [permissions, setPermissions] = useState<PermissionLevel>('view');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('share');
    const [participantsLoading, setParticipantsLoading] = useState(false);
    // const [showQRCode, setShowQRCode] = useState(false);
    
    // End session modal state
    const [showEndSessionModal, setShowEndSessionModal] = useState(false);
    const [endingSession, setEndingSession] = useState(false);

    // Mobile-specific state
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

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
                setPermissions(existingSession.permissions || 'view');
                
                // Generate QR code for existing session
                if (existingSession.share_link) {
                    try {
                        const qrCode = await QRCodeGenerator.toDataURL(existingSession.share_link, {
                            width: 200,
                            margin: 1,
                            color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                            }
                        });
                        setQrCodeUrl(qrCode);
                    } catch (error) {
                        console.error('Error generating QR code:', error);
                    }
                }
            } else {
                // Create new session
                const { data: newSession } = await createSharingSession(honeycombId, permissions);
                if (newSession) {
                    setShareUrl(newSession.share_link);
                    setShareCode(newSession.share_code);
                    setSessionId(newSession.id);
                    
                    // Generate QR code for new session
                    try {
                        const qrCode = await QRCodeGenerator.toDataURL(newSession.share_link, {
                            width: 200,
                            margin: 1,
                            color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                            }
                        });
                        setQrCodeUrl(qrCode);
                    } catch (error) {
                        console.error('Error generating QR code:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading/creating session:', error);
            toast.error(t('sharing.errorCreatingSession'));
        } finally {
            setLoading(false);
        }
    };

    const loadParticipants = async () => {
        if (!sessionId) return;
        
        try {
            setParticipantsLoading(true);
            const { data } = await getSessionParticipants(sessionId);
            if (data) {
                setParticipants(data);
            }
        } catch (error) {
            console.error('Error loading participants:', error);
        } finally {
            setParticipantsLoading(false);
        }
    };

    const handlePermissionChange = async (newPermissions: PermissionLevel) => {
        if (!sessionId) return;
        
        try {
            await updateSessionPermissions(sessionId, newPermissions);
            setPermissions(newPermissions);
            toast.success(t('sharing.permissionsUpdated'));
        } catch (error) {
            console.error('Error updating permissions:', error);
            toast.error(t('sharing.errorUpdatingPermissions'));
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success(t('notifications.linkCopied'));
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            toast.error('Failed to copy link');
        }
    };

    const handleEndSession = async () => {
        if (!sessionId) return;
        
        try {
            setEndingSession(true);
            await endSharingSession(sessionId);
            toast.success(t('sharing.sessionEnded'));
            onClose();
        } catch (error) {
            console.error('Error ending session:', error);
            toast.error(t('sharing.errorEndingSession'));
        } finally {
            setEndingSession(false);
            setShowEndSessionModal(false);
        }
    };

    const activeParticipantsCount = participants.filter(p => p.is_online).length;

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className={`sharing-modal ${isMobile ? 'is-mobile mobile-full-height' : ''} bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}>
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Share className="text-amber-600" size={24} />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {t('sharing.title')}
                                </h2>
                                <p className="text-sm text-gray-500 truncate max-w-48">
                                    {honeycombName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex-shrink-0 flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('share')}
                            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'share'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Share size={16} />
                                {t('sharing.shareTab')}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('participants')}
                            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'participants'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Users size={16} />
                                {t('sharing.participantsTab')}
                                {activeParticipantsCount > 0 && (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                        {activeParticipantsCount}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                            </div>
                        ) : activeTab === 'share' ? (
                            <div className="space-y-6">
                                {/* QR Code */}
                                {qrCodeUrl && (
                                    <div className="flex justify-center">
                                        <img 
                                            src={qrCodeUrl} 
                                            alt={t('sharing.qrCodeAlt')}
                                            className={`rounded-lg border ${isMobile ? 'w-36 h-36' : 'w-48 h-48'}`}
                                        />
                                    </div>
                                )}

                                {/* Permissions - Updated to use buttons */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {t('sharing.permissions')}
                                    </label>
                                    
                                    {/* Permission Buttons */}
                                    <div className="flex gap-2">
                                        {/* View Only Button */}
                                        <button
                                            onClick={() => handlePermissionChange('view')}
                                            className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${
                                                permissions === 'view'
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-200'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                            }`}
                                            type="button"
                                        >
                                            <Eye size={20} />
                                            <div className="text-left">
                                                <p className="text-sm font-medium">{t('sharing.viewOnly')}</p>
                                                <p className="text-xs opacity-75 hidden sm:block">
                                                    {t('sharing.viewOnlyDesc')}
                                                </p>
                                            </div>
                                            {permissions === 'view' && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            )}
                                        </button>

                                        {/* Can Edit Button */}
                                        <button
                                            onClick={() => handlePermissionChange('edit')}
                                            className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${
                                                permissions === 'edit'
                                                    ? 'bg-green-50 border-green-200 text-green-700 shadow-sm ring-1 ring-green-200'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                            }`}
                                            type="button"
                                        >
                                            <Edit size={20} />
                                            <div className="text-left">
                                                <p className="text-sm font-medium">{t('sharing.canEdit')}</p>
                                                <p className="text-xs opacity-75 hidden sm:block">
                                                    {t('sharing.canEditDesc')}
                                                </p>
                                            </div>
                                            {permissions === 'edit' && (
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            )}
                                        </button>
                                    </div>

                                    {/* Mobile-friendly descriptions */}
                                    {/* <div className="block sm:hidden">
                                        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                            {permissions === 'view' ? t('sharing.viewOnlyDesc') : t('sharing.canEditDesc')}
                                        </div>
                                    </div> */}
                                </div>

                                {/* Share Link */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {t('sharing.shareLink')}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={shareUrl}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                                            aria-label={t('sharing.shareLink')}
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex-shrink-0"
                                            aria-label={t('actions.copyLink')}
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* End Session Button */}
                                {sessionId && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => setShowEndSessionModal(true)}
                                            className="w-full px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                                        >
                                            {t('sharing.endSession')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Participants Tab
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {t('sharing.activeParticipants')} ({activeParticipantsCount})
                                    </h3>
                                    {participantsLoading && (
                                        <div className="animate-spin w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                                    )}
                                </div>

                                {participants.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Users className="mx-auto text-gray-400 mb-4" size={48} />
                                        <p className="text-gray-500 mb-2">{t('sharing.noParticipants')}</p>
                                        <p className="text-sm text-gray-400">{t('sharing.shareToInvite')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {participants.map((participant) => (
                                            <div
                                                key={participant.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div 
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                                    style={{ backgroundColor: participant.color }}
                                                >
                                                    {participant.display_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900">
                                                            {participant.display_name}
                                                        </p>
                                                        {participant.permissions === 'edit' && (
                                                            <Crown size={14} className="text-amber-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            participant.is_online ? 'bg-green-500' : 'bg-gray-400'
                                                        }`}></div>
                                                        <span>
                                                            {participant.is_online ? 'Online' : 'Offline'}
                                                        </span>
                                                        <Clock size={12} />
                                                        <span>
                                                            {new Date(participant.last_seen_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* End Session Modal */}
            <EndSessionModal
                isOpen={showEndSessionModal}
                onClose={() => setShowEndSessionModal(false)}
                onConfirm={handleEndSession}
                honeycombName={honeycombName}
                activeParticipants={activeParticipantsCount}
                loading={endingSession}
            />
        </>
    );
}