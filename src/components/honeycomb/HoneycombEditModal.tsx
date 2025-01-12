import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2 } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; color: string }) => void;
  onDelete?: () => void;
  initialData?: {
    title: string;
    color?: string;
  };
  isCreating?: boolean;
}

const COLORS = [
  '#FDE68A', // amber-200
  '#FCA5A5', // red-300
  '#A7F3D0', // emerald-200
  '#BFDBFE', // blue-200
  '#DDD6FE', // violet-200
  '#FBCFE8', // pink-200
];

export const HoneycombEditModal = ({
                                     isOpen,
                                     onClose,
                                     onSubmit,
                                     onDelete,
                                     initialData = { title: '', color: COLORS[0] },
                                     isCreating = false,
                                   }: EditModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialData.title);
  const [selectedColor, setSelectedColor] = useState(initialData.color ?? COLORS[0]);

  // Update state when initialData changes
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData.title);
      setSelectedColor(initialData.color ?? COLORS[0]);
    }
  }, [initialData, isOpen]);

  // Prevent scrolling when modal is open
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        color: selectedColor,
      });
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
      <>
        {/* Modal Backdrop */}
        <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={handleOverlayClick}
        />

        {/* Modal Container */}
        <div className="fixed inset-0 flex items-center justify-center z-[101]" onClick={handleOverlayClick}>
          {/* Modal Content */}
          <div
              className="bg-white rounded-lg w-full max-w-md p-6 relative shadow-xl"
              onClick={e => e.stopPropagation()}
          >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {isCreating ? t('modals.createHexagon') : t('modals.editHexagon')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('hexagon.title')}
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                    autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('hexagon.color')}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                      <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                              selectedColor === color
                                  ? 'border-amber-500 scale-110 shadow-md'
                                  : 'border-transparent hover:scale-105 hover:shadow-sm'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                      />
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                {!isCreating && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md
                           hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2
                           focus:ring-red-500 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} />
                      {t('actions.delete')}
                    </button>
                )}

                <div className={`flex gap-2 ${!isCreating && onDelete ? '' : 'ml-auto'}`}>
                  <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md
                           hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                           focus:ring-amber-500 transition-colors"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                      type="submit"
                      disabled={!title.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md
                           hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                           focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                  >
                    {isCreating ? t('actions.create') : t('actions.save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </>
  );
};

