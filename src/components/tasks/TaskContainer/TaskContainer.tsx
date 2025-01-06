import React from 'react';
import { useViewMode } from '@/context/ViewModeContext';
import ListView from '../ListView/ListView';
import HoneycombView from '../HoneycombView/HoneycombView';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface TaskContainerProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onTaskDelete: (taskId: string) => void;
}

const TaskContainer: React.FC<TaskContainerProps> = ({
  tasks,
  onTaskUpdate,
  onTaskAdd,
  onTaskDelete
}) => {
  const { viewMode } = useViewMode();

  // Common task handlers
  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    onTaskUpdate(taskId, {
      ...updates,
      // Add any common update logic here
    });
  };

  const handleTaskAdd = (task: Omit<Task, 'id' | 'createdAt'>) => {
    onTaskAdd({
      ...task,
      // Add any common creation logic here
    });
  };

  const handleTaskDelete = (taskId: string) => {
    // Add any confirmation or cleanup logic here
    const shouldDelete = window.confirm('Are you sure you want to delete this task?');
    if (shouldDelete) {
      onTaskDelete(taskId);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      {viewMode === 'list' ? (
        <ListView
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
        />
      ) : (
        <HoneycombView
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskAdd={handleTaskAdd}
          onTaskDelete={handleTaskDelete}
        />
      )}
    </div>
  );
};

export default TaskContainer;