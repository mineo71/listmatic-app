import React from 'react';
import { CheckSquare, Square, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface ListViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
}

const ListView: React.FC<ListViewProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const { t } = useTranslation();
  const [menuOpenTaskId, setMenuOpenTaskId] = React.useState<string | null>(null);

  const toggleMenu = (taskId: string) => {
    setMenuOpenTaskId(menuOpenTaskId === taskId ? null : taskId);
  };

  return (
    <div className="p-4 space-y-2">
      {tasks.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {t('messages.noTasks')}
        </div>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center justify-between gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-amber-200 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => onTaskUpdate(task.id, { completed: !task.completed })}
                className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 rounded"
              >
                {task.completed ? (
                  <CheckSquare className="w-6 h-6 text-amber-500" />
                ) : (
                  <Square className="w-6 h-6 text-gray-400" />
                )}
              </button>
              
              <span className={task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                {task.title}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => toggleMenu(task.id)}
                className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-opacity"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>

              {menuOpenTaskId === task.id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpenTaskId(null)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                    <button
                      onClick={() => {
                        // Handle edit later
                        setMenuOpenTaskId(null);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {t('actions.edit')}
                    </button>
                    <button
                      onClick={() => {
                        onTaskDelete(task.id);
                        setMenuOpenTaskId(null);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('actions.delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ListView;