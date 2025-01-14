import { TaskIcon } from '@/types';

export type { TaskIcon };

export interface Offset {
    x: number;
    y: number;
}

export interface HoneycombItem {
    id: string;
    x: number;
    y: number;
    title: string;
    description: string;
    icon: TaskIcon;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    connections: string[];
    color: string;
    isMain?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface HoneycombCanvasProps {
    zoom: number;
    setZoom: (zoom: number | ((prev: number) => number)) => void;
    offset: Offset;
    setOffset: (offset: Offset | ((prev: Offset) => Offset)) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    onProgressUpdate: (progress: number) => void;
}

