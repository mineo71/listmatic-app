import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, ChevronRight, ChevronDown, Plus, Settings, User, LogOut, Menu, ChevronLeft, Star } from 'lucide-react';
import type { Hive } from '@/types';

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
  onLogout,
}: SidebarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedHives, setExpandedHives] = useState<Set<string>>(new Set());
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
      if (next.has(hiveId)) {
        next.delete(hiveId);
      } else {
        next.add(hiveId);
      }
      return next;
    });
  };

  const toggleFavorite = (hiveId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteHives(prev => {
      const next = new Set(prev);
      if (next.has(hiveId)) {
        next.delete(hiveId);
      } else {
        next.add(hiveId);
      }
      return next;
    });
  };

  const handleItemSelect = (id: string, type: 'hive' | 'honeycomb' | 'settings') => {
    if (type === 'honeycomb') {
      navigate(`/honeycomb/${id}`);
    } else if (type === 'settings') {
      navigate(`/${id}`);
    }
    onSelectItem(id, type);
  };

  return (
    <>
      {/* Collapsed Sidebar Button */}
      {!isOpen && (
        <button
          onClick={onToggleSidebar}
          className="fixed top-[13px] left-4 p-2 rounded-md bg-white shadow-md hover:bg-gray-50 z-50"
          aria-label={t('actions.openSidebar')}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}`}
      >
        {/* Header with Logo and Toggle */}
        <div className="flex items-center justify-between p-[14px] border-b border-gray-200">
          <h1 className="text-2xl font-bold text-amber-600">{t('appName')}</h1>
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label={t('actions.closeSidebar')}
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col h-[calc(100vh-64px)]">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <button
                onClick={onCreateHive}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <Plus size={16} />
                {t('actions.createHive')}
              </button>

              <div className="mt-6 space-y-1">
                {([...hives].sort((a, b) => {
                  // Sort by favorite status first
                  const aFavorite = favoriteHives.has(a.id);
                  const bFavorite = favoriteHives.has(b.id);
                  if (aFavorite !== bFavorite) {
                    return bFavorite ? 1 : -1;
                  }
                  return 0;
                })).map((hive) => (
                  <div key={hive.id} className="select-none">
                    <div
                      className={`flex items-center px-2 py-2 rounded-md cursor-pointer hover:bg-gray-100 group ${
                        selectedHiveId === hive.id ? 'bg-amber-50' : ''
                      }`}
                      onClick={() => handleItemSelect(hive.id, 'hive')}
                    >
                      <button
                        onClick={(e) => toggleHive(hive.id, e)}
                        className="p-1 hover:bg-gray-200 rounded-md mr-1"
                      >
                        {expandedHives.has(hive.id) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                      <span className="flex-1 truncate mr-2">{hive.name}</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => toggleFavorite(hive.id, e)}
                          className="p-1 hover:bg-gray-200 rounded-md"
                          aria-label={favoriteHives.has(hive.id) ? t('actions.unfavorite') : t('actions.favorite')}
                        >
                          <Star
                            size={16}
                            className={favoriteHives.has(hive.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu({
                              id: hive.id,
                              type: 'hive',
                              x: e.clientX,
                              y: e.clientY
                            });
                          }}
                          className="p-1 invisible group-hover:visible hover:bg-gray-200 rounded-md"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>

                    {expandedHives.has(hive.id) && (
                      <div className="ml-6 space-y-1">
                        <button
                          onClick={() => {
                            onCreateHoneycomb();
                            handleItemSelect(hive.id, 'hive');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                          <Plus size={14} />
                          {t('actions.createHoneycomb')}
                        </button>

                        {hive.honeycombs.map((honeycomb) => (
                          <div
                            key={honeycomb.id}
                            className={`group flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                              selectedHoneycombId === honeycomb.id ? 'bg-amber-50' : ''
                            }`}
                            onClick={() => handleItemSelect(honeycomb.id, 'honeycomb')}
                          >
                            <span className="flex-1 truncate">{honeycomb.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu({
                                  id: honeycomb.id,
                                  type: 'honeycomb',
                                  x: e.clientX,
                                  y: e.clientY
                                });
                              }}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-md"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <button
              onClick={() => handleItemSelect('settings', 'settings')}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Settings size={20} />
              {t('navigation.settings')}
            </button>
            <button
              onClick={() => handleItemSelect('profile', 'settings')}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <User size={20} />
              {t('navigation.profile')}
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut size={20} />
              {t('navigation.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-white rounded-md shadow-lg py-1 border border-gray-200"
            style={{
              top: contextMenu.y,
              left: Math.min(contextMenu.x, window.innerWidth - 128),
              width: '128px',
              zIndex: 51,
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
                  if (contextMenu.type === 'hive') {
                    onDeleteHive(contextMenu.id);
                  } else {
                    onDeleteHoneycomb(contextMenu.id);
                  }
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