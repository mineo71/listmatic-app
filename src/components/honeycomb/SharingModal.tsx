/* eslint-disable react-hooks/exhaustive-deps */
// src/components/honeycomb/SharingModal.tsx
import { useState, useEffect } from 'react'
import { Copy, Users, ChevronDown, Eye, Edit, X, Crown, Clock, Share, QrCode } from 'lucide-react'
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
    const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('share');
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    
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

    useEffect(() => {
        if (isOpen && sessionId) {
            loadParticipants();
            
            const interval = setInterval(() => {
                loadParticipants();
            }, 5000);
            
            return () => clearInterval(interval);
        }
    }, [isOpen, sessionId]);

    const loadOrCreateSession = async () => {
        setLoading(true);
        try {
            const { data: existingSession } = await getActiveSession(honeycombId);
            
            if (existingSession) {
                setShareUrl(existingSession.share_link);
                setShareCode(existingSession.share_code);
                setSessionId(existingSession.id);
                setPermissions(existingSession.permissions as PermissionLevel);
                generateQRCode(existingSession.share_link);
            } else {
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
            const qrDataUrl = await QRCodeGenerator.toDataURL(url, {
                width: isMobile ? 180 : 200,
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

    const handleEndSessionClick = () => {
        setShowEndSessionModal(true);
    };

    const handleConfirmEndSession = async () => {
        if (!sessionId) return;
        
        setEndingSession(true);
        try {
            const { error } = await endSharingSession(sessionId);
            
            if (error) {
                throw error;
            }
            
            toast.success(t('sharing.sessionEnded'));
            setShowEndSessionModal(false);
            onClose();
        } catch (error) {
            console.error('Error ending session:', error);
            toast.error(t('sharing.errorEndingSession'));
        } finally {
            setEndingSession(false);
        }
    };

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

    const activeParticipantsCount = participants.filter(p => p.is_online).length;

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-[100] !important" onClick={onClose} />
            
            {/* Modal Container */}
            <div className="fixed inset-0 z-[100] !important flex items-center justify-center p-2 sm:p-4">
                {/* Modal Content */}
                <div className={`bg-white rounded-lg w-full max-h-[95vh] flex flex-col shadow-xl ${
                    isMobile ? 'max-w-full h-full' : 'max-w-2xl'
                }`}>
                    {/* Header */}
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="min-w-0 flex-1 mr-4">
                                <h2 className="text-lg sm:text-xl font-semibold truncate">{t('sharing.title')}</h2>
                                <p className="text-sm text-gray-500 mt-1 truncate">{honeycombName}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            >
                                <X size={20} className="sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('share')}
                                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                    activeTab === 'share'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Share size={14} className="sm:w-4 sm:h-4" />
                                <span>{t('sharing.shareTab')}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('participants')}
                                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                    activeTab === 'participants'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Users size={14} className="sm:w-4 sm:h-4" />
                                <span>{t('sharing.participantsTab')}</span>
                                <span className="ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                                    {activeParticipantsCount}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                            </div>
                        ) : (
                            <>
                                {/* Share Tab Content */}
                                {activeTab === 'share' && (
                                    <div className="space-y-6">
                                        {/* Mobile: QR Code Toggle Button */}
                                        {isMobile && (
                                            <button
                                                onClick={() => setShowQRCode(!showQRCode)}
                                                className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <QrCode size={20} />
                                                <span>{showQRCode ? t('sharing.hideQRCode') : t('sharing.showQRCode')}</span>
                                                <ChevronDown size={16} className={`transition-transform ${showQRCode ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}

                                        {/* QR Code */}
                                        {(!isMobile || showQRCode) && (
                                            <div className="flex justify-center">
                                                {qrCodeUrl ? (
                                                    <img
                                                        src={qrCodeUrl}
                                                        alt={t('sharing.qrCodeAlt')}
                                                        className={`rounded-lg shadow-lg ${isMobile ? 'w-36 h-36' : 'w-48 h-48'}`}
                                                    />
                                                ) : (
                                                    <div className={`bg-gray-100 rounded-lg animate-pulse ${isMobile ? 'w-36 h-36' : 'w-48 h-48'}`}></div>
                                                )}
                                            </div>
                                        )}

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

                                        {/* Permissions */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {t('sharing.permissions')}
                                            </label>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowPermissionDropdown(!showPermissionDropdown)}
                                                    className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {permissions === 'view' ? (
                                                            <Eye size={16} className="text-gray-500" />
                                                        ) : (
                                                            <Edit size={16} className="text-gray-500" />
                                                        )}
                                                        <span className="text-sm">
                                                            {permissions === 'view' ? t('sharing.viewOnly') : t('sharing.canEdit')}
                                                        </span>
                                                    </div>
                                                    <ChevronDown size={16} className={`transition-transform ${showPermissionDropdown ? 'rotate-180' : ''}`} />
                                                </button>

                                                {showPermissionDropdown && (
                                                    <>
                                                        <div 
                                                            className="fixed inset-0 z-10" 
                                                            onClick={() => setShowPermissionDropdown(false)}
                                                        />
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

                                {/* Participants Tab Content */}
                                {activeTab === 'participants' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {t('sharing.activeParticipants')} ({activeParticipantsCount})
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
                                            <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto">
                                                {participants.map(participant => (
                                                    <div 
                                                        key={participant.id} 
                                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                                            participant.is_online 
                                                                ? 'bg-green-50 border-green-200' 
                                                                : 'bg-gray-50 border-gray-200 opacity-60'
                                                        }`}
                                                    >
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
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                                    {participant.display_name}
                                                                </span>
                                                                {participant.user_id && (
                                                                    <Crown size={12} className="text-amber-500 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500">
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
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-3 flex-shrink-0">
                        <button
                            onClick={handleEndSessionClick}
                            className="text-sm text-red-600 hover:text-red-700 transition-colors order-2 sm:order-1"
                            disabled={loading || endingSession}
                        >
                            {t('sharing.endSession')}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors order-1 sm:order-2"
                        >
                            {t('actions.done')}
                        </button>
                    </div>
                </div>
            </div>

            {/* End Session Confirmation Modal */}
            <EndSessionModal
                isOpen={showEndSessionModal}
                onClose={() => setShowEndSessionModal(false)}
                onConfirm={handleConfirmEndSession}
                honeycombName={honeycombName}
                activeParticipants={activeParticipantsCount}
                loading={endingSession}
            />
        </>
    );
}