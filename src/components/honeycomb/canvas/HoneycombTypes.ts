import type { TaskIcon as ImportedTaskIcon } from "@/types"

export type TaskIcon = ImportedTaskIcon
export type TaskPriority = "low" | "medium" | "high"

export interface HoneycombItem {
    id: string
    q: number
    r: number
    x: number
    y: number
    title: string
    description: string
    icon: TaskIcon
    priority: TaskPriority
    completed: boolean
    connections: string[]
    color: string
    category?: string
    isMain?: boolean
    deadline?: Date
    createdAt: Date
    updatedAt: Date
}

export interface HoneycombCanvasProps {
    honeycombId: string
    zoom: number
    setZoom: (zoom: number | ((prev: number) => number)) => void
    offset: { x: number; y: number }
    setOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void
    isTaskSidebarOpen: boolean
    setisTaskSidebarOpen: (open: boolean) => void
    onProgressUpdate: (progress: number) => void
    // Sharing mode properties
    isSharedMode?: boolean
    canEdit?: boolean
    sessionId?: string
    participantId?: string | null
    participants?: Array<{
        id: string
        display_name: string
        is_online: boolean
        cursor_position?: { x: number; y: number }
        selected_item_id?: string
        color: string
    }>
    // New callback for item selection
    onItemSelection?: (itemId: string | null) => void
}