/* eslint-disable react-hooks/exhaustive-deps */
// src/components/honeycomb/canvas/useHoneycombItemsDB.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { HoneycombItem, TaskIcon, TaskPriority } from "../types/HoneycombTypes"
import { axialToPixel } from "../utils/honeycombUtils"
import { 
  getHoneycombItems, 
  createHoneycombItem, 
  updateHoneycombItem, 
  deleteHoneycombItem, 
  bulkCreateHoneycombItems,
  clearHoneycombItems,
  type HoneycombItemDB 
} from '@/services/database'
import toast from 'react-hot-toast'

// Transform database item to canvas item
const transformDBToCanvas = (dbItem: HoneycombItemDB): HoneycombItem => ({
  id: dbItem.id,
  q: dbItem.q,
  r: dbItem.r,
  x: dbItem.x,
  y: dbItem.y,
  title: dbItem.title,
  description: dbItem.description,
  icon: dbItem.icon as TaskIcon,
  priority: dbItem.priority,
  completed: dbItem.completed,
  connections: dbItem.connections,
  color: dbItem.color,
  category: dbItem.category,
  isMain: dbItem.isMain,
  deadline: dbItem.deadline,
  createdAt: dbItem.createdAt,
  updatedAt: dbItem.updatedAt,
})

// Transform canvas item to database format
const transformCanvasToDBCreate = (
  canvasItem: Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'>
): Omit<HoneycombItemDB, 'id' | 'honeycombId' | 'createdAt' | 'updatedAt'> => ({
  title: canvasItem.title,
  description: canvasItem.description,
  icon: canvasItem.icon,
  priority: canvasItem.priority,
  color: canvasItem.color,
  completed: canvasItem.completed,
  isMain: canvasItem.isMain ?? false,
  q: canvasItem.q,
  r: canvasItem.r,
  x: canvasItem.x,
  y: canvasItem.y,
  connections: canvasItem.connections,
  deadline: canvasItem.deadline,
  category: canvasItem.category,
})

export const useHoneycombItemsDB = (honeycombId: string, onProgressUpdate: (progress: number) => void) => {
  const [items, setItems] = useState<HoneycombItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()

  // Load items from database
  const loadItems = useCallback(async () => {
    if (!honeycombId) return
    
    setLoading(true)
    try {
      const { data, error } = await getHoneycombItems(honeycombId)
      
      if (error) {
        console.error('Error loading honeycomb items:', error)
        toast.error(t('messages.loadError'))
        return
      }

      if (data && data.length > 0) {
        // Transform and set items from database
        const transformedItems = data.map(transformDBToCanvas)
        setItems(transformedItems)
      } else {
        // Create default main item if no items exist
        await createDefaultMainItem()
      }
    } catch (error) {
      console.error('Error loading honeycomb items:', error)
      toast.error(t('messages.loadError'))
    } finally {
      setLoading(false)
    }
  }, [honeycombId, t])

  // Create default main item
  const createDefaultMainItem = async () => {
    const mainPixel = axialToPixel(0, 0)
    const defaultItem: Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'> = {
      q: 0,
      r: 0,
      x: mainPixel.x,
      y: mainPixel.y,
      title: t("hexagon.main_goal"),
      description: "",
      icon: "Star" as TaskIcon,
      priority: "high" as TaskPriority,
      completed: false,
      connections: [],
      color: "#FDE68A",
      isMain: true,
    }

    try {
      const { data, error } = await createHoneycombItem(honeycombId, transformCanvasToDBCreate(defaultItem))
      
      if (error) {
        console.error('Error creating default main item:', error)
        return
      }

      if (data) {
        setItems([transformDBToCanvas(data)])
      }
    } catch (error) {
      console.error('Error creating default main item:', error)
    }
  }

  // Load items when honeycombId changes
  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Update progress when items change
  useEffect(() => {
    const totalItems = items.filter((item) => !item.isMain).length
    const completedItems = items.filter((item) => !item.isMain && item.completed).length
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
    onProgressUpdate(progress)
  }, [items, onProgressUpdate])

  // Create new item
  const createItem = async (newItem: Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true)
    try {
      const { data, error } = await createHoneycombItem(honeycombId, transformCanvasToDBCreate(newItem))
      
      if (error) {
        console.error('Error creating item:', error)
        toast.error(t('messages.createError'))
        return null
      }

      if (data) {
        const transformedItem = transformDBToCanvas(data)
        setItems(prev => [...prev, transformedItem])
        return transformedItem
      }
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error(t('messages.createError'))
    } finally {
      setSaving(false)
    }
    return null
  }

  // Update existing item
  const updateItem = async (id: string, updates: Partial<Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setSaving(true)
    try {
      const dbUpdates: Partial<Omit<HoneycombItemDB, 'id' | 'honeycombId' | 'createdAt' | 'updatedAt'>> = {}
      
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority
      if (updates.color !== undefined) dbUpdates.color = updates.color
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed
      if (updates.isMain !== undefined) dbUpdates.isMain = updates.isMain
      if (updates.q !== undefined) dbUpdates.q = updates.q
      if (updates.r !== undefined) dbUpdates.r = updates.r
      if (updates.x !== undefined) dbUpdates.x = updates.x
      if (updates.y !== undefined) dbUpdates.y = updates.y
      if (updates.connections !== undefined) dbUpdates.connections = updates.connections
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline
      if (updates.category !== undefined) dbUpdates.category = updates.category

      const { data, error } = await updateHoneycombItem(id, dbUpdates)
      
      if (error) {
        console.error('Error updating item:', error)
        toast.error(t('messages.updateError'))
        return false
      }

      if (data) {
        const transformedItem = transformDBToCanvas(data)
        setItems(prev => prev.map(item => item.id === id ? transformedItem : item))
        return true
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error(t('messages.updateError'))
    } finally {
      setSaving(false)
    }
    return false
  }

  // Delete item
  const deleteItem = async (id: string) => {
    setSaving(true)
    try {
      const { error } = await deleteHoneycombItem(id)
      
      if (error) {
        console.error('Error deleting item:', error)
        toast.error(t('messages.deleteError'))
        return false
      }

      setItems(prev => prev.filter(item => item.id !== id))
      return true
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error(t('messages.deleteError'))
    } finally {
      setSaving(false)
    }
    return false
  }

  // Bulk create items (for AI generation)
  const bulkCreateItems = async (newItems: Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    setSaving(true)
    try {
      // First, clear existing items
      await clearHoneycombItems(honeycombId)
      
      // Then create new items
      const dbItems = newItems.map(transformCanvasToDBCreate)
      const { data, error } = await bulkCreateHoneycombItems(honeycombId, dbItems)
      
      if (error) {
        console.error('Error bulk creating items:', error)
        toast.error(t('messages.createError'))
        return false
      }

      if (data) {
        const transformedItems = data.map(transformDBToCanvas)
        setItems(transformedItems)
        return true
      }
    } catch (error) {
      console.error('Error bulk creating items:', error)
      toast.error(t('messages.createError'))
    } finally {
      setSaving(false)
    }
    return false
  }

  // Update connections for an item
  const updateItemConnections = async (id: string, connections: string[]) => {
    return await updateItem(id, { connections })
  }

  // Mark item as complete/incomplete
  const toggleItemCompletion = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return false

    // If this is the main item, check if all others are completed
    if (item.isMain) {
      const otherItems = items.filter((i) => !i.isMain)
      const allOthersCompleted = otherItems.every((i) => i.completed)

      if (!allOthersCompleted && !item.completed) {
        toast.error(t("messages.completeOtherTasks"))
        return false
      }
    }

    const success = await updateItem(id, { completed: !item.completed })
    
    if (success && !item.completed) {
      toast.success(t("messages.taskCompleted"))
    }
    
    return success
  }

  return {
    items,
    loading,
    saving,
    createItem,
    updateItem,
    deleteItem,
    bulkCreateItems,
    updateItemConnections,
    toggleItemCompletion,
    refreshItems: loadItems,
  }
}