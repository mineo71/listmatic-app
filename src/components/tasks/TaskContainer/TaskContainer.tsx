import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useHoneycomb } from '@/context/HoneycombContext';
import { TaskHeader } from '../shared/TaskHeader';
import HoneycombView from '../HoneycombView/HoneycombView';
import TaskForm from '../shared/TaskForm';
import type { Task } from '@/types/task';

const TaskContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    tasks, 
    selectedHoneycombName,
    onTaskAdd, 
    onTaskUpdate, 
    onTaskDelete, 
    setSelectedHoneycomb 
  } = useHoneycomb();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [pendingTask, setPendingTask] = useState<{title: string} | null>(null);

  useEffect(() => {
    if (id) {
      setSelectedHoneycomb(id, selectedHoneycombName);
    }
  }, [id, setSelectedHoneycomb, selectedHoneycombName]);

  const handleAddTask = () => {
    setShowTaskForm(true);
  };

  const handleTaskFormSubmit = (title: string) => {
    setPendingTask({ title });
    setShowTaskForm(false);
    setIsAddingTask(true);
  };

  const handlePlaceTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    onTaskAdd(task);
    setIsAddingTask(false);
    setPendingTask(null);
  };

  return (
    <div className="flex flex-col h-full">
      <TaskHeader 
        onAddTask={handleAddTask}
        honeycombName={selectedHoneycombName || 'Select a Honeycomb'}
      />
      <div className="flex-1 overflow-hidden">
        <HoneycombView
          tasks={tasks}
          onTaskAdd={handlePlaceTask}
          onTaskUpdate={onTaskUpdate}
          onTaskDelete={onTaskDelete}
          isAddingTask={isAddingTask}
          onAddingTaskComplete={() => setIsAddingTask(false)}
          pendingTask={pendingTask}
        />
      </div>

      {showTaskForm && (
        <TaskForm
          onSubmit={handleTaskFormSubmit}
          onClose={() => setShowTaskForm(false)}
          isEditing={false}
        />
      )}
    </div>
  );
};

export default TaskContainer;