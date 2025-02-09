import type { TaskIcon as ImportedTaskIcon } from "@/types"

export type TaskIcon = ImportedTaskIcon

export interface HoneycombItem {
    id: string
    q: number
    r: number
    x: number
    y: number
    title: string
    description: string
    icon: TaskIcon
    priority: "low" | "medium" | "high"
    completed: boolean
    connections: string[]
    color: string
    isMain?: boolean
    createdAt: Date
    updatedAt: Date
}

export interface HoneycombCanvasProps {
    zoom: number
    setZoom: (zoom: number | ((prev: number) => number)) => void
    offset: { x: number; y: number }
    setOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void
    isSidebarOpen: boolean
    setIsSidebarOpen: (open: boolean) => void
    onProgressUpdate: (progress: number) => void
}

