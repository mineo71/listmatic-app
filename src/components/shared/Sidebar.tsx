/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/shared/Sidebar.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Plus,
  Settings,
  User,
  Menu,
  ChevronLeft,
  Star,
  Loader2
} from 'lucide-react';
import type { Hive } from '@/types';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  hives: Hive[];
  selectedHiveId: string | null;
  selectedHoneycombId: string | undefined;
  onSelectItem: (id: string, type: 'hive' | 'honeycomb' | 'settings') => void;
  onCreateHive: () => void;
  onCreateHoneycomb: () => void;
  onDeleteHive: (id: string) => void;
  onDeleteHoneycomb: (id: string) => void;
  onRenameItem: (id: string, newName: string, type: 'hive' | 'honeycomb') => void;
  onLogout: () => void;
  loading?: boolean;
}

export const Sidebar = ({
  isOpen, 
  onToggleSidebar, 
  hives, 
  selectedHiveId, 
  selectedHoneycombId, 
  onSelectItem, 
  onCreateHive, 
  onCreateHoneycomb, 
  onDeleteHive, 
  onDeleteHoneycomb, 
  onRenameItem,
  loading = false
}: SidebarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [expandedHives, setExpandedHives] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('expandedHives');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [favoriteHives, setFavoriteHives] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    id: string;
    type: 'hive' | 'honeycomb';
    x: number;
    y: number;
  } | null>(null);

  const toggleHive = (hiveId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHives(prev => {
      const next = new Set(prev);
      if (next.has(hiveId)) next.delete(hiveId);
      else next.add(hiveId);
      localStorage.setItem('expandedHives', JSON.stringify([...next]));
      return next;
    });
  };

  const toggleFavorite = (hiveId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteHives(prev => {
      const next = new Set(prev);
      if (next.has(hiveId)) next.delete(hiveId);
      else next.add(hiveId);
      return next;
    });
  };

  // Close only on mobile when selecting an existing item
  const handleSelect = (id: string, type: 'hive' | 'honeycomb' | 'settings') => {
    onSelectItem(id, type);
    if (window.innerWidth < 640) onToggleSidebar();
  };

  return (
      <>
        {/* Hamburger on mobile */}
        {!isOpen && (
            <button
                onClick={onToggleSidebar}
                className="fixed top-3 left-4 p-2 rounded-md bg-white shadow-md hover:bg-gray-50 z-30"
                aria-label={t('actions.openSidebar')}
            >
              <Menu size={20} />
            </button>
        )}

        <aside
            className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200
          flex flex-col transition-transform duration-300 z-10 sm:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-full sm:w-64 sm:max-w-sm
        `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 pl-4">
            <div className="flex items-center gap-1">
              <img src="/LogoBeeTask.ico" alt="Combly" className="h-10 w-auto" />
              <button
                  onClick={() => {
                    onSelectItem('', 'honeycomb');
                    navigate('/');
                  }}
                  className="text-2xl font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                {t('appName')}
              </button>
            </div>
            <button
                onClick={onToggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label={t('actions.closeSidebar')}
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Create Hive */}
          <div className="p-4 border-b border-gray-200">
            <button
                onClick={onCreateHive}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
                       text-white bg-amber-600 rounded-md hover:bg-amber-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {t('actions.createHive')}
            </button>
          </div>

          {/* Hive List */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 size={24} className="animate-spin text-amber-600" />
                  <p className="text-sm text-gray-500">{t('messages.loading')}</p>
                </div>
              </div>
            ) : hives.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Plus size={32} className="mx-auto" />
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {t('messages.noHives')}
                </p>
                <button
                  onClick={onCreateHive}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  {t('actions.createHive')}
                </button>
              </div>
            ) : (
              [...hives]
                .sort((a, b) => {
                  const aFav = favoriteHives.has(a.id);
                  const bFav = favoriteHives.has(b.id);
                  return aFav === bFav ? 0 : aFav ? -1 : 1;
                })
                .map(hive => (
                    <div key={hive.id} className="select-none mb-1">
                      {/* Hive Row */}
                      <div
                          className={`group flex items-center px-2 py-2 rounded-md cursor-pointer
                              hover:bg-gray-100
                              ${selectedHiveId === hive.id ? 'bg-amber-50' : ''}`}
                          onClick={() => handleSelect(hive.id, 'hive')}
                      >
                        <button
                            onClick={e => toggleHive(hive.id, e)}
                            className="p-1 hover:bg-gray-200 rounded-md mr-1 transition-colors"
                        >
                          {expandedHives.has(hive.id)
                              ? <ChevronDown size={16}/>
                              : <ChevronRight size={16}/>}
                        </button>
                        <span className="flex-1 truncate mr-2">{hive.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                              onClick={e => toggleFavorite(hive.id, e)}
                              className={`p-1 rounded-md transition-colors
                                 ${favoriteHives.has(hive.id)
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100'}`}
                              aria-label={
                                favoriteHives.has(hive.id)
                                    ? t('actions.removeFavorite')
                                    : t('actions.addFavorite')
                              }
                          >
                            <Star
                                size={16}
                                className={favoriteHives.has(hive.id)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'}
                            />
                          </button>
                          <button
                              onClick={e => {
                                e.stopPropagation();
                                setContextMenu({
                                  id: hive.id,
                                  type: 'hive',
                                  x: e.clientX, y: e.clientY
                                });
                              }}
                              className="p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal size={16}/>
                          </button>
                        </div>
                      </div>

                      {/* Create Honeycomb */}
                      {expandedHives.has(hive.id) && (
                          <div className="ml-6 mb-2">
                            <button
                                onClick={() => {
                                  onCreateHoneycomb();
                                  onSelectItem(hive.id, 'hive');
                                }}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600
                                 hover:bg-gray-100 rounded-md transition-colors w-full disabled:opacity-50"
                            >
                              <Plus size={14}/>
                              {t('actions.createHoneycomb')}
                            </button>
                            {hive.honeycombs.map(hc => (
                                <div
                                    key={hc.id}
                                    className={`group flex items-center px-3 py-2 rounded-md cursor-pointer
                                    hover:bg-gray-100
                                    ${selectedHoneycombId === hc.id ? 'bg-amber-50' : ''}`}
                                    onClick={() => handleSelect(hc.id, 'honeycomb')}
                                >
                                  <span className="flex-1 truncate">{hc.name}</span>
                                  <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        setContextMenu({
                                          id: hc.id,
                                          type: 'honeycomb',
                                          x: e.clientX, y: e.clientY
                                        });
                                      }}
                                      className="p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <MoreHorizontal size={16}/>
                                  </button>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>
                ))
            )}
          </div>

          {/* **Pinned** Settings / Profile at bottom */}
          <div className="border-t border-gray-200 p-4">
            <button
                onClick={() => handleSelect('settings','settings')}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100
                       rounded-md transition-colors"
            >
              <Settings size={20}/> {t('navigation.settings')}
            </button>
            <button
                onClick={() => handleSelect('profile','settings')}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100
                       rounded-md transition-colors mt-2"
            >
              <User size={20}/> {t('navigation.profile')}
            </button>
          </div>
        </aside>

        {/* Context Menu */}
        {contextMenu && (
            <>
              {/* backdrop */}
              <div
                  className="fixed inset-0 z-40"
                  onClick={() => setContextMenu(null)}
              />
              <div
                  className="fixed bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50"
                  style={{
                    top: contextMenu.y,
                    left: Math.min(contextMenu.x, window.innerWidth - 128),
                    width: 128
                  }}
              >
                <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      const newName = prompt(t('prompts.enterNewName'));
                      if (newName?.trim()) {
                        onRenameItem(contextMenu.id, newName.trim(), contextMenu.type);
                      }
                      setContextMenu(null);
                    }}
                >
                  {t('actions.rename')}
                </button>
                <button
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      if (window.confirm(t('confirmations.delete'))) {
                        if (contextMenu.type === 'hive') onDeleteHive(contextMenu.id);
                        else onDeleteHoneycomb(contextMenu.id);
                      }
                      setContextMenu(null);
                    }}
                >
                  {t('actions.delete')}
                </button>
              </div>
            </>
        )}
      </>
  );
};