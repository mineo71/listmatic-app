// src/types/task.ts

export interface Point {
    x: number;
    y: number;
  }
  
  export interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
  }
  
  export interface HexagonProps {
    task: Task;
    size: number;
    position: Point;
    isSelected?: boolean;
    isPreview?: boolean;
    onClick?: () => void;
    onSelect?: () => void;
    onComplete?: () => void;
  }
  
  export interface HoneycombViewProps {
    tasks: Task[];
    onTaskAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
    onTaskDelete: (taskId: string) => void;
  }