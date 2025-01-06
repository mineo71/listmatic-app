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
  subHives: Hive[];
  createdAt: Date;
  updatedAt: Date;
}