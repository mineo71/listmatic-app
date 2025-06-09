// src/components/shared/EmptyState.tsx
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { Menu } from 'lucide-react';

type ContextType = {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

export const EmptyState = () => {
  const { t } = useTranslation();
  const { isSidebarOpen, onToggleSidebar } = useOutletContext<ContextType>();

  return (
    <div className="flex flex-col h-full relative">
      {/* Menu button - show when sidebar is closed */}
      {!isSidebarOpen && onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:bg-gray-50"
          aria-label={t('actions.openSidebar')}
        >
          <Menu size={20} className="text-gray-700" />
        </button>
      )}
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('messages.selectHoneycomb')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('messages.selectHiveDescription')}
          </p>
        </div>
      </div>
    </div>
  );
};