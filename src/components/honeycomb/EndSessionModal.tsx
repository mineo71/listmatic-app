import React from 'react';
import { AlertTriangle, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  honeycombName: string;
  activeParticipants: number;
  loading?: boolean;
}

export const EndSessionModal: React.FC<EndSessionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  honeycombName,
  activeParticipants,
  loading = false
}) => {
  const { t } = useTranslation();

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[110]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[111] p-4">
        <div 
          className="bg-white rounded-xl max-w-md w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('sharing.endSessionTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {honeycombName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700">
                {t('sharing.endSessionWarning')}
              </p>
              
              {activeParticipants > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Users size={16} />
                    <span className="text-sm font-medium">
                      {t('sharing.activeParticipantsWarning', { count: activeParticipants })}
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    {t('sharing.participantsWillLoseAccess')}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  {t('sharing.whatHappensNext')}
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• {t('sharing.shareLinkWillBeInvalidated')}</li>
                  <li>• {t('sharing.participantsWillBeDisconnected')}</li>
                  <li>• {t('sharing.newSessionCanBeCreated')}</li>
                  <li>• {t('sharing.dataWillRemainSafe')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white 
                border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none 
                focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('actions.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 
                rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-red-500 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center 
                justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('sharing.endingSession')}
                </>
              ) : (
                t('sharing.endSession')
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};