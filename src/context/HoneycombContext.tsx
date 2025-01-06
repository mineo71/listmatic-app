// src/context/HoneycombContext.tsx
import React, { createContext, useContext, useState } from 'react';
import type { Task } from '@/types';

interface HoneycombContextType {
  tasks: Task[];
  selectedHoneycombId: string | null;
  selectedHoneycombName: string | null;
  onTaskAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  setSelectedHoneycomb: (id: string | null, name: string | null) => void;
}

const HoneycombContext = createContext<HoneycombContextType | null>(null);

export const HoneycombProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedHoneycombId, setSelectedHoneycombId] = useState<string | null>(null);
  const [selectedHoneycombName, setSelectedHoneycombName] = useState<string | null>(null);

  const handleTaskAdd = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const setSelectedHoneycomb = (id: string | null, name: string | null) => {
    setSelectedHoneycombId(id);
    setSelectedHoneycombName(name);
  };

  const value = {
    tasks,
    selectedHoneycombId,
    selectedHoneycombName,
    onTaskAdd: handleTaskAdd,
    onTaskUpdate: handleTaskUpdate,
    onTaskDelete: handleTaskDelete,
    setSelectedHoneycomb
  };

  return (
    <HoneycombContext.Provider value={value}>
      {children}
    </HoneycombContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useHoneycomb = () => {
  const context = useContext(HoneycombContext);
  if (!context) {
    throw new Error('useHoneycomb must be used within a HoneycombProvider');
  }
  return context;
};