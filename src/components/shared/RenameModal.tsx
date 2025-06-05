// src/components/shared/RenameModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newName: string) => Promise<void>;
  currentName: string;
  type: 'hive' | 'honeycomb';
  loading?: boolean;
}

export const RenameModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currentName, 
  type, 
  loading = false 
}: RenameModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (error) {
      console.error('Error renaming item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      setName('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting && !loading) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const maxLength = 100;
  const isDisabled = !name.trim() || name.trim() === currentName || isSubmitting || loading;

  return (
    <>
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]" 
        onClick={handleClose}
      />

      <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
        <div
          className="bg-white rounded-lg w-full max-w-md p-6 relative shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {type === 'hive' ? t('modals.renameHive') : t('modals.renameHoneycomb')}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting || loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'hive' ? t('rename.hiveName') : t('rename.honeycombName')}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, maxLength))}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                placeholder={type === 'hive' ? t('placeholders.newHiveName') : t('placeholders.newHoneycombName')}
                autoFocus
                disabled={isSubmitting || loading}
                maxLength={maxLength}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {t('rename.currentName')}: {currentName}
                </span>
                <span className="text-xs text-gray-500">
                  {name.length}/{maxLength}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md 
                         hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-colors"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={isDisabled}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md 
                         hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-colors flex items-center gap-2"
              >
                {(isSubmitting || loading) && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {isSubmitting || loading ? t('actions.renaming') : t('actions.rename')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};