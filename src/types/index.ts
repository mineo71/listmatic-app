export interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
  }
  
  export interface Honeycomb {
    id: string;
    name: string;
    tasks: Task[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Hive {
    id: string;
    name: string;
    honeycombs: Honeycomb[];
    subHives: Hive[];  // For nested folders
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