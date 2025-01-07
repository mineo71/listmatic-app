// src/types/index.ts
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface HoneycombItem {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  connections: string[];
}

export interface Honeycomb {
  id: string;
  name: string;
  tasks: Task[];
  canvasItems?: HoneycombItem[]; // Add support for canvas items
  createdAt: Date;
  updatedAt: Date;
}

export interface Hive {
  id: string;
  name: string;
  honeycombs: Honeycomb[];
  subHives: Hive[];
  createdAt: Date;
  updatedAt: Date;
}

// For sidebar tree view
export type TreeItem = {
  id: string;
  name: string;
  type: 'hive' | 'honeycomb';
  children?: TreeItem[];
  parentId?: string;
};