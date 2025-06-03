/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/honeycomb/SharingModal.tsx
import React, { useState, useEffect, useRef } from 'react'
import { Copy, Users, ChevronDown, Download, Upload, Eye, Edit, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import { createSharingSession, getActiveSession, updateSessionPermissions, endSharingSession } from '@/services/sharing'
import { getHoneycombItems } from '@/services/database'

interface SharingModalProps {
    isOpen: boolean;
    onClose: () => void;
    honeycombId: string;
    honeycombName: string;
    onExportJson: () => void;
    onImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

type PermissionLevel = 'view' | 'edit';

export default function SharingModal({ 
    isOpen, 
    onClose, 
    honeycombId, 
    honeycombName,
    onImportJson
}: SharingModalProps) {
    const { t } = useTranslation();
    const [shareUrl, setShareUrl] = useState('');
    const [shareCode, setShareCode] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [permissions, setPermissions] = useState<PermissionLevel>('view');
    const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [participants] = useState<any[]>([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && honeycombId) {
            loadOrCreateSession();
        }
    }, [isOpen, honeycombId]);

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

    // Enhanced export function that exports honeycomb data
    const handleExportJson = async () => {
        try {
            setLoading(true);
            
            // Get honeycomb items from database
            const { data: items, error } = await getHoneycombItems(honeycombId);
            
            if (error) {
                throw error;
            }

            // Transform items to export format
            const exportData = {
                honeycomb: {
                    id: honeycombId,
                    name: honeycombName,
                    exportedAt: new Date().toISOString(),
                },
                items: items || [],
                version: '1.0'
            };

            // Create and download JSON file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
            const exportFileDefaultName = `${honeycombName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_honeycomb.json`;
            
            const linkElement = document.createElement("a");
            linkElement.setAttribute("href", dataUri);
            linkElement.setAttribute("download", exportFileDefaultName);
            linkElement.click();
            
            toast.success('Honeycomb exported successfully!');
        } catch (error) {
            console.error('Error exporting honeycomb:', error);
            toast.error('Failed to export honeycomb');
        } finally {
            setLoading(false);
        }
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        onImportJson(event);
        // Reset the input value so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                        </div>
                    ) : (
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

                                {/* Permissions Dropdown */}
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
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
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
                                    )}
                                </div>
                            </div>

                            {/* Export/Import Section */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">{t('sharing.exportImport')}</h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleExportJson}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <Download size={16} />
                                        <span className="text-sm">{t('sharing.exportJson')}</span>
                                    </button>
                                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                                        <Upload size={16} />
                                        <span className="text-sm">{t('sharing.importJson')}</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".json"
                                            onChange={handleFileImport}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Active Participants */}
                            {participants.length > 0 && (
                                <div className="border-t border-gray-200 pt-6">
                                    <button
                                        onClick={() => setShowParticipants(!showParticipants)}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3"
                                    >
                                        <Users size={16} />
                                        <span>{t('sharing.activeParticipants')} ({participants.length})</span>
                                        <ChevronDown size={16} className={`transition-transform ${showParticipants ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {showParticipants && (
                                        <div className="space-y-2">
                                            {participants.map(participant => (
                                                <div key={participant.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${participant.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                        <span className="text-sm">{participant.display_name}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {participant.permissions === 'view' ? t('sharing.viewing') : t('sharing.editing')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Share Code */}
                            <div className="text-center text-sm text-gray-500">
                                {t('sharing.shareCode')}: <span className="font-mono font-bold">{shareCode}</span>
                            </div>
                        </div>
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