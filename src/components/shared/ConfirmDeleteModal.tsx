// src/components/shared/ConfirmDeleteModal.tsx
import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  message
}: ConfirmDeleteModalProps) => {
  const { t } = useTranslation();

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]" 
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
        <div
          className="bg-white rounded-lg w-full max-w-md p-6 relative shadow-xl"
          onClick={e => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-700">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md 
                       hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-gray-500 transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md 
                       hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-red-500 transition-colors"
            >
              {t('actions.delete')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};