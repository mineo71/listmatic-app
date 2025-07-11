import { useState, useMemo } from 'react';
import { X, MoreHorizontal, CheckCircle, Search, Clock, Filter, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { HoneycombItem } from '@/types';
import { ICONS_MAP } from '@/utils/icons';

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: HoneycombItem[];
  onItemClick: (id: string) => void;
  onEditClick: (id: string) => void;
  onCompleteTask: (id: string) => void;
  selectedItemId: string | null;
}

type SortOption = 'deadline' | 'title' | 'color';
type GroupOption = 'none' | 'color' | 'completion' | 'deadline' | 'priority';

const TaskSidebar = ({
  isOpen,
  onClose,
  items,
  onItemClick,
  onEditClick,
  onCompleteTask,
  selectedItemId
}: TaskSidebarProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('deadline');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort tasks
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item => item.title.toLowerCase().includes(query)
      );
    }

    // Sort items
    result.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.getTime() - b.deadline.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'color':
          return (a.color || '').localeCompare(b.color || '');
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchQuery, sortBy]);

  // Group items
  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return { [t('placeholders.AllTasks')]: filteredAndSortedItems };
    }

    return filteredAndSortedItems.reduce((groups: Record<string, HoneycombItem[]>, item) => {
      let groupKey = '';

      switch (groupBy) {
        case 'color':
          groupKey = item.color || t('placeholders.NoColor');
          break;
        case 'completion':
          groupKey = item.completed ? t('placeholders.Completed') : t('placeholders.pending');
          break;
        case 'priority':
          groupKey = t(`priority.${item.priority || 'medium'}`);
          break;
        case 'deadline':
          if (!item.deadline) {
            groupKey = t('placeholders.NoDeadline');
          } else {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            if (item.deadline < today) {
              groupKey = t('placeholders.Overdue');
            } else if (item.deadline < tomorrow) {
              groupKey = t('placeholders.Today');
            } else if (item.deadline < nextWeek) {
              groupKey = t('placeholders.ThisWeek');
            } else {
              groupKey = t('placeholders.Later');
            }
          }
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  }, [filteredAndSortedItems, groupBy, t]);

  const formatDeadline = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date < today) {
      return t('placeholders.Overdue');
    } else if (date.toDateString() === today.toDateString()) {
      return t('placeholders.Today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('placeholders.Tomorrow');
    }
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case t('priority.high'):
        return 'bg-red-500';
      case t('priority.medium'):
        return 'bg-yellow-500';
      case t('priority.low'):
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!isOpen) return null;

  const renderGroupHeader = (group: string) => {
    if (groupBy === 'color') {
      return (
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: group === t('placeholders.NoColor') ? '#E5E7EB' : group }}
          />
          <span>{group === t('placeholders.NoColor') ? t('placeholders.NoColor') : ''}</span>
        </div>
      );
    } else if (groupBy === 'priority') {
      return (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(group)}`} />
          <span>{group}</span>
        </div>
      );
    }
    return group;
  };

  return (
      <div
        className={`fixed top-[101px] sm:top-[65px] bottom-0 right-0 transition-all duration-300 overflow-hidden flex flex-col z-30 sm:z-30
          bg-white/90 backdrop-blur-sm border-l border-gray-200
          sm:w-80 w-full ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ pointerEvents: isOpen ? 'all' : 'none' }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('placeholders.TasksList')}</h2>
          <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16}/>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('placeholders.search')}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Filter size={16}/>
              {t('placeholders.Filters')}
            </button>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-gray-400"/>
              <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="deadline">{t('placeholders.Deadline')}</option>
                <option value="title">{t('placeholders.Title')}</option>
              </select>
            </div>
          </div>

          {/* Extended Filters */}
          {showFilters && (
              <div className="pt-2 space-y-2">
                <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupOption)}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="none">{t('placeholders.NoGrouping')}</option>
                  <option value="color">{t('placeholders.GroupColor')}</option>
                  <option value="completion">{t('placeholders.GroupStatus')}</option>
                  <option value="deadline">{t('placeholders.GroupDeadline')}</option>
                  <option value="priority">{t('placeholders.GroupPriority')}</option>
                </select>
              </div>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-2">
          {Object.entries(groupedItems).map(([group, groupItems]) => (
              <div key={group} className="mb-4">
                {groupBy !== 'none' && (
                    <h3 className="px-3 py-2 text-sm font-medium text-gray-500">
                      {renderGroupHeader(group)}
                    </h3>
                )}
                <div className="space-y-1">
                  {groupItems.map((item) => {
                    const IconComponent = item.icon && item.icon !== 'None'
                        ? ICONS_MAP[item.icon as keyof typeof ICONS_MAP]
                        : null;

                    return (
                        <div
                            key={item.id}
                            className={`group flex items-center p-3 rounded-md cursor-pointer transition-all ${
                                selectedItemId === item.id
                                    ? 'bg-amber-50'
                                    : 'hover:bg-gray-50'
                            } ${
                                item.completed ? 'opacity-70' : ''
                            }`}
                            onClick={() => onItemClick(item.id)}
                        >
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteTask(item.id);
                              }}
                              className="mr-3 p-1 hover:bg-gray-200 rounded-md transition-colors"
                          >
                            <CheckCircle
                                size={16}
                                className={item.completed ? "text-green-700" : "text-gray-300"}
                                fill={item.completed ? "#22C55E" : "none"}
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {IconComponent && (
                                  <IconComponent size={16} className="text-gray-600 flex-shrink-0"/>
                              )}
                              <span className={`truncate ${item.completed ? 'line-through text-gray-500' : ''}`}>
                          {item.title}
                        </span>
                            </div>
                            {item.deadline && (
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <Clock size={12} className="mr-1"/>
                                  {formatDeadline(item.deadline)}
                                </div>
                            )}
                          </div>
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditClick(item.id);
                              }}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-md transition-opacity"
                          >
                            <MoreHorizontal size={16}/>
                          </button>
                        </div>
                    );
                  })}
                </div>
              </div>
          ))}
        </div>
      </div>
  );
};

export default TaskSidebar;