import React from 'react';
import { X, MoreHorizontal, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{
    id: string;
    title: string;
    x: number;
    y: number;
    isCompleted?: boolean;
  }>;
  onItemClick: (id: string) => void;
  onEditClick: (id: string) => void;
  selectedItemId: string | null;
}

const TaskSidebar = ({
  isOpen,
  onClose,
  items,
  onItemClick,
  onEditClick,
  selectedItemId
}: TaskSidebarProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-[149px] bottom-0 w-80 h-full bg-white/90 backdrop-blur-sm border-l border-gray-200 transition-all duration-300 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('Tasks List')}</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-2 overflow-y-auto h-full">
        {items.map((item) => (
          <div
            key={item.id}
            className={`group flex items-center p-3 rounded-md cursor-pointer transition-all ${
              selectedItemId !== null && selectedItemId === item.id
                ? 'bg-amber-50'
                : 'hover:bg-gray-50'
            } ${
              item.isCompleted ? 'opacity-70' : ''
            }`}
            onClick={() => onItemClick(item.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                {item.isCompleted && (
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                )}
                <span className={`truncate ${item.isCompleted ? 'line-through text-gray-500' : ''}`}>
                  {item.title}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Position: ({Math.round(item.x)}, {Math.round(item.y)})
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(item.id);
              }}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-md transition-opacity"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskSidebar;