/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/honeycomb/canvas/useUnifiedHoneycombItems.ts
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { HoneycombItem, TaskIcon, TaskPriority } from "./HoneycombTypes"
import { axialToPixel } from "./honeycombUtils"
import { 
  getHoneycombItems, 
  createHoneycombItem, 
  updateHoneycombItem, 
  deleteHoneycombItem, 
  bulkCreateHoneycombItems,
  clearHoneycombItems,
  type HoneycombItemDB, 
  VALID_ICONS
} from '@/services/database'
import { logSharingChange } from '@/services/sharing'
import supabase from '@/utils/supabase'
import toast from 'react-hot-toast'

// Enhanced validation functions
const DEFAULT_COLOR = '#FDE68A';
const DEFAULT_ICON: TaskIcon = 'None';
const DEFAULT_PRIORITY: TaskPriority = 'medium';

const validateColor = (color: any): string => {
  if (!color || typeof color !== 'string') {
    return DEFAULT_COLOR;
  }
  
  const trimmedColor = color.trim();
  const hexRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
  
  if (hexRegex.test(trimmedColor)) {
    return trimmedColor.startsWith('#') ? trimmedColor : `#${trimmedColor}`;
  }
  
  return DEFAULT_COLOR;
};

const validateIcon = (icon: any): TaskIcon => {
  if (!icon || typeof icon !== 'string') {
    return DEFAULT_ICON;
  }
  
  if (VALID_ICONS.includes(icon as TaskIcon)) {
    return icon as TaskIcon;
  }
  
  return DEFAULT_ICON;
};

const validatePriority = (priority: any): TaskPriority => {
  if (!priority || typeof priority !== 'string') {
    return DEFAULT_PRIORITY;
  }
  
  if (['low', 'medium', 'high'].includes(priority)) {
    return priority as TaskPriority;
  }
  
  return DEFAULT_PRIORITY;
};

const validateTitle = (title: any): string => {
  if (!title || typeof title !== 'string') {
    return 'Untitled Task';
  }
  
  return title.trim() || 'Untitled Task';
};

const validateDescription = (description: any): string => {
  if (!description || typeof description !== 'string') {
    return '';
  }
  
  return description.trim();
};

const validateConnections = (connections: any): string[] => {
  if (!Array.isArray(connections)) {
    return [];
  }
  
  return connections.filter(conn => typeof conn === 'string' && conn.trim().length > 0);
};

const validateCoordinates = (q: any, r: any): { q: number; r: number } => {
  const validQ = typeof q === 'number' && !isNaN(q) ? Math.round(q) : 0;
  const validR = typeof r === 'number' && !isNaN(r) ? Math.round(r) : 0;
  
  return { q: validQ, r: validR };
};

const validatePosition = (x: any, y: any): { x: number; y: number } => {
  const validX = typeof x === 'number' && !isNaN(x) ? x : 0;
  const validY = typeof y === 'number' && !isNaN(y) ? y : 0;
  
  return { x: validX, y: validY };
};

const validateDeadline = (deadline: any): Date | undefined => {
  if (!deadline) {
    return undefined;
  }
  
  try {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      return undefined;
    }
    return date;
  } catch {
    return undefined;
  }
};

// Enhanced transform database item to canvas item with validation
const transformDBToCanvas = (dbItem: HoneycombItemDB): HoneycombItem => {
  const coordinates = validateCoordinates(dbItem.q, dbItem.r);
  const position = validatePosition(dbItem.x, dbItem.y);
  
  return {
    id: dbItem.id,
    q: coordinates.q,
    r: coordinates.r,
    x: position.x,
    y: position.y,
    title: validateTitle(dbItem.title),
    description: validateDescription(dbItem.description),
    icon: validateIcon(dbItem.icon),
    priority: validatePriority(dbItem.priority),
    completed: Boolean(dbItem.completed),
    connections: validateConnections(dbItem.connections),
    color: validateColor(dbItem.color),
    category: dbItem.category,
    isMain: Boolean(dbItem.isMain),
    deadline: validateDeadline(dbItem.deadline),
    createdAt: dbItem.createdAt,
    updatedAt: dbItem.updatedAt,
  };
};

// Enhanced transform canvas item to database format with validation
const transformCanvasToDBCreate = (
  canvasItem: Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'>
): Omit<HoneycombItemDB, 'id' | 'honeycombId' | 'createdAt' | 'updatedAt'> => {
  const coordinates = validateCoordinates(canvasItem.q, canvasItem.r);
  const position = validatePosition(canvasItem.x, canvasItem.y);
  
  return {
    title: validateTitle(canvasItem.title),
    description: validateDescription(canvasItem.description),
    icon: validateIcon(canvasItem.icon),
    priority: validatePriority(canvasItem.priority),
    color: validateColor(canvasItem.color),
    completed: Boolean(canvasItem.completed),
    isMain: Boolean(canvasItem.isMain ?? false),
    q: coordinates.q,
    r: coordinates.r,
    x: position.x,
    y: position.y,
    connections: validateConnections(canvasItem.connections),
    deadline: canvasItem.deadline,
    category: canvasItem.category,
  };
};

export const useUnifiedHoneycombItems = (
  honeycombId: string, 
  onProgressUpdate: (progress: number) => void,
  isSharedMode: boolean = false,
  canEdit: boolean = true,
  sessionId?: string,
  participantId?: string | null
) => {
  const [items, setItems] = useState<HoneycombItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()

  // Track subscription state
  const channelRef = useRef<any>(null)
  const isSubscribedRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
        try {
          // Transform and validate items from database
          const transformedItems = data.map(item => {
            try {
              return transformDBToCanvas(item);
            } catch (transformError) {
              console.warn('Error transforming item, using defaults:', transformError, item);
              // Create a safe fallback item
              return {
                id: item.id,
                q: 0,
                r: 0,
                x: 0,
                y: 0,
                title: validateTitle(item.title),
                description: validateDescription(item.description),
                icon: validateIcon(item.icon),
                priority: validatePriority(item.priority),
                completed: Boolean(item.completed),
                connections: validateConnections(item.connections),
                color: validateColor(item.color),
                category: item.category,
                isMain: Boolean(item.isMain),
                deadline: validateDeadline(item.deadline),
                createdAt: item.createdAt || new Date(),
                updatedAt: item.updatedAt || new Date(),
              };
            }
          });
          setItems(transformedItems);
        } catch (transformError) {
          console.error('Error transforming items:', transformError);
          toast.error('Some items could not be loaded properly');
          setItems([]);
        }
      } else {
        // Create default main item if no items exist
        if (canEdit && !isSharedMode) {
          await createDefaultMainItem();
        }
      }
    } catch (error) {
      console.error('Error loading honeycomb items:', error)
      toast.error(t('messages.loadError'))
    } finally {
      setLoading(false)
    }
  }, [honeycombId, t, canEdit, isSharedMode])

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
      color: DEFAULT_COLOR,
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

  // Setup subscription with retry logic
  const setupSubscription = useCallback(() => {
    if (!honeycombId || isSubscribedRef.current) {
      return
    }

    console.log('Setting up honeycomb subscription for:', honeycombId)

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Remove existing channel if any
    if (channelRef.current) {
      console.log('Removing existing channel')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      isSubscribedRef.current = false
    }

    // Create new channel
    const channel = supabase
      .channel(`honeycomb_${honeycombId}`, {
        config: {
          presence: { key: honeycombId },
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'honeycomb_items',
          filter: `honeycomb_id=eq.${honeycombId}`
        },
        (payload) => {
          console.log('Honeycomb item change:', payload.eventType, payload)
          
          try {
            if (payload.eventType === 'INSERT' && payload.new) {
              const newItem = transformDBToCanvas(payload.new as any)
              setItems(prev => {
                const exists = prev.some(item => item.id === newItem.id)
                if (exists) return prev
                return [...prev, newItem]
              })
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedItem = transformDBToCanvas(payload.new as any)
              setItems(prev => 
                prev.map(item => item.id === updatedItem.id ? updatedItem : item)
              )
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setItems(prev => 
                prev.filter(item => item.id !== payload.old.id)
              )
            }
          } catch (transformError) {
            console.error('Error transforming real-time update:', transformError, payload);
            // Reload items if transformation fails
            loadItems();
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status, err)
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to honeycomb items')
          isSubscribedRef.current = true
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('Subscription error, will retry in 3 seconds:', status)
          isSubscribedRef.current = false
          
          // Retry subscription after delay
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Retrying subscription...')
            setupSubscription()
          }, 3000)
        }
      })

    channelRef.current = channel
  }, [honeycombId, loadItems])

  // Effect to manage subscription lifecycle
  useEffect(() => {
    if (!honeycombId) return

    // Load items first
    loadItems()

    // Setup subscription after a small delay to ensure items are loaded
    const setupTimeout = setTimeout(() => {
      setupSubscription()
    }, 100)

    // Cleanup function
    return () => {
      clearTimeout(setupTimeout)
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (channelRef.current) {
        console.log('Cleaning up honeycomb subscription')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        isSubscribedRef.current = false
      }
    }
  }, [honeycombId, loadItems, setupSubscription])

  // Update progress when items change
  useEffect(() => {
    const totalItems = items.filter((item) => !item.isMain).length
    const completedItems = items.filter((item) => !item.isMain && item.completed).length
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
    onProgressUpdate(progress)
  }, [items, onProgressUpdate])

  // Create new item with validation
  const createItem = async (newItem: Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!canEdit) {
      toast.error(t('sharing.noEditingAllowed'))
      return null
    }

    setSaving(true)
    try {
      // Validate the item before sending to database
      const validatedItem = {
        ...newItem,
        title: validateTitle(newItem.title),
        description: validateDescription(newItem.description),
        icon: validateIcon(newItem.icon),
        priority: validatePriority(newItem.priority),
        color: validateColor(newItem.color),
        connections: validateConnections(newItem.connections),
      };

      const { data, error } = await createHoneycombItem(honeycombId, transformCanvasToDBCreate(validatedItem))
      
      if (error) {
        console.error('Error creating item:', error)
        toast.error(t('messages.createError'))
        return null
      }

      if (data) {
        const transformedItem = transformDBToCanvas(data)
        
        // Log sharing change if in shared mode
        if (isSharedMode && sessionId && participantId) {
          await logSharingChange(
            sessionId,
            participantId,
            'create',
            transformedItem.id,
            { item: transformedItem }
          )
        }
        
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

  // Update existing item with validation
  const updateItem = async (id: string, updates: Partial<Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!canEdit) {
      toast.error(t('sharing.noEditingAllowed'))
      return false
    }

    setSaving(true)
    try {
      const dbUpdates: Partial<Omit<HoneycombItemDB, 'id' | 'honeycombId' | 'createdAt' | 'updatedAt'>> = {}
      
      // Validate each update field
      if (updates.title !== undefined) dbUpdates.title = validateTitle(updates.title)
      if (updates.description !== undefined) dbUpdates.description = validateDescription(updates.description)
      if (updates.icon !== undefined) dbUpdates.icon = validateIcon(updates.icon)
      if (updates.priority !== undefined) dbUpdates.priority = validatePriority(updates.priority)
      if (updates.color !== undefined) dbUpdates.color = validateColor(updates.color)
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed
      if (updates.isMain !== undefined) dbUpdates.isMain = updates.isMain
      if (updates.q !== undefined) dbUpdates.q = updates.q
      if (updates.r !== undefined) dbUpdates.r = updates.r
      if (updates.x !== undefined) dbUpdates.x = updates.x
      if (updates.y !== undefined) dbUpdates.y = updates.y
      if (updates.connections !== undefined) dbUpdates.connections = validateConnections(updates.connections)
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline
      if (updates.category !== undefined) dbUpdates.category = updates.category

      const { data, error } = await updateHoneycombItem(id, dbUpdates)
      
      if (error) {
        console.error('Error updating item:', error)
        toast.error(t('messages.updateError'))
        return false
      }

      if (data) {
        // Log sharing change if in shared mode
        if (isSharedMode && sessionId && participantId) {
          await logSharingChange(
            sessionId,
            participantId,
            'update',
            id,
            { updates, item: transformDBToCanvas(data) }
          )
        }
        
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
    if (!canEdit) {
      toast.error(t('sharing.noEditingAllowed'))
      return false
    }

    setSaving(true)
    try {
      const { error } = await deleteHoneycombItem(id)
      
      if (error) {
        console.error('Error deleting item:', error)
        toast.error(t('messages.deleteError'))
        return false
      }

      // Log sharing change if in shared mode
      if (isSharedMode && sessionId && participantId) {
        await logSharingChange(
          sessionId,
          participantId,
          'delete',
          id,
          { itemId: id }
        )
      }

      return true
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error(t('messages.deleteError'))
    } finally {
      setSaving(false)
    }
    return false
  }

  // Bulk create items (for AI generation) with enhanced validation
  const bulkCreateItems = async (newItems: Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (!canEdit) {
      toast.error(t('sharing.noEditingAllowed'))
      return false
    }

    setSaving(true)
    try {
      await clearHoneycombItems(honeycombId)
      
      // Validate all items before creating
      const validatedItems = newItems.map(item => ({
        ...item,
        title: validateTitle(item.title),
        description: validateDescription(item.description),
        icon: validateIcon(item.icon),
        priority: validatePriority(item.priority),
        color: validateColor(item.color),
        connections: validateConnections(item.connections),
        completed: false,
      }));
      
      const dbItems = validatedItems.map(transformCanvasToDBCreate)
      const { data, error } = await bulkCreateHoneycombItems(honeycombId, dbItems)
      
      if (error) {
        console.error('Error bulk creating items:', error)
        toast.error(t('messages.createError'))
        return false
      }

      if (data) {
        // Log sharing change if in shared mode
        if (isSharedMode && sessionId && participantId) {
          await logSharingChange(
            sessionId,
            participantId,
            'create',
            'bulk',
            { items: data.map(transformDBToCanvas), count: data.length }
          )
        }
        
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
    return await updateItem(id, { connections: validateConnections(connections) })
  }

  // Mark item as complete/incomplete
  const toggleItemCompletion = async (id: string) => {
    if (!canEdit) {
      toast.error(t('sharing.noEditingAllowed'))
      return false
    }

    const item = items.find(i => i.id === id)
    if (!item) return false

    if (item.isMain) {
      // const otherItems = items.filter((i) => !i.isMain)
      // const allOthersCompleted = otherItems.every((i) => i.completed)

      // if (!allOthersCompleted && !item.completed) {
      //   toast.error(t("messages.completeOtherTasks"))
      //   return false
      // }
    }

    const success = await updateItem(id, { completed: !item.completed })
    
    // if (success && !item.completed) {
    //   toast.success(t("messages.taskCompleted"))
    // }
    
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