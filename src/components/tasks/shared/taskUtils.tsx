// src/components/tasks/shared/taskUtils.ts

interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
  }
  
  export const createTask = (title: string): Omit<Task, 'id' | 'createdAt'> => {
    return {
      title: title.trim(),
      completed: false,
    };
  };
  
  export const sortTasks = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      // Put completed tasks at the bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Sort by creation date, newest first
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  };
  
  export const filterTasks = (
    tasks: Task[],
    filters: { completed?: boolean; searchTerm?: string }
  ): Task[] => {
    return tasks.filter(task => {
      if (filters.completed !== undefined && task.completed !== filters.completed) {
        return false;
      }
      if (filters.searchTerm && !task.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  };