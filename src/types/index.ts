// src/types/index.ts

// Available icons from lucide-react that can be used for tasks
export interface Task {
  id: string;
  title: string;
  description: string;
  icon: TaskIcon;
  priority: TaskPriority;
  completed: boolean;
  deadline?: Date;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskIcon = 
  | 'AlertCircle'
  | 'Archive'
  | 'Bell'
  | 'Bookmark'
  | 'Briefcase'
  | 'CheckCircle'
  | 'Code'
  | 'FileText'
  | 'Flag'
  | 'Heart'
  | 'Home'
  | 'Mail'
  | 'MessageCircle'
  | 'Settings'
  | 'Star'
  | 'Tag'
  | 'Target'
  | 'Timer'
  | 'Trophy'
  | 'Truck'
  | 'Tv'
  | 'Upload'
  | 'User'
  | 'Users'
  | 'Video'
  | 'Wallet'
  | 'Watch'
  | 'Zap'
  | 'Bug'
  | 'Building'
  | 'Camera'
  | 'Car'
  | 'BarChart'
  | 'PieChart'
  | 'Cloud'
  | 'Coffee';

// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  icon: TaskIcon;
  priority: TaskPriority;
  completed: boolean;
  deadline?: Date;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HoneycombItem {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  icon: TaskIcon;
  priority: TaskPriority;
  deadline?: Date;
  color: string;
  connections: string[];
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Honeycomb {
  id: string;
  name: string;
  description: string;
  icon: TaskIcon;
  tasks: Task[];
  canvasItems?: HoneycombItem[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hive {
  id: string;
  name: string;
  description: string;
  icon: TaskIcon;
  color: string;
  honeycombs: Honeycomb[];
  subHives: Hive[];
  createdAt: Date;
  updatedAt: Date;
}

// For sidebar tree view
export type TreeItem = {
  id: string;
  name: string;
  description: string;
  icon: TaskIcon;
  color: string;
  type: 'hive' | 'honeycomb';
  children?: TreeItem[];
  parentId?: string;
};