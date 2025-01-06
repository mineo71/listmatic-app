// src/components/tasks/shared/TaskHeader.tsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TaskForm from './TaskForm';

interface TaskHeaderProps {
  onAddTask: (title: string) => void;  // Change type to accept title parameter
  honeycombName: string;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({ onAddTask, honeycombName }) => {
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {honeycombName}
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <Plus size={16} />
            {t('actions.addTask')}
          </button>
        </div>
      </div>
      
      {showModal && (
        <TaskForm
          onSubmit={(title) => {
            onAddTask(title);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};