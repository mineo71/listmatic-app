/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/database.ts - Enhanced with validation
import supabase from '@/utils/supabase';
import type { Hive, Honeycomb, TaskIcon, TaskPriority } from '@/types';

// =============================================
// VALIDATION UTILITIES
// =============================================

// Default values for validation
const DEFAULT_COLOR = '#FDE68A';
const DEFAULT_ICON: TaskIcon = 'None';
const DEFAULT_PRIORITY: TaskPriority = 'medium';

// Available icons for validation
const VALID_ICONS: TaskIcon[] = [
  'None', 'AlertCircle', 'Archive', 'Bell', 'Bookmark', 'Briefcase', 'CheckCircle',
  'Code', 'FileText', 'Flag', 'Heart', 'Home', 'Mail', 'MessageCircle', 'Settings',
  'Star', 'Tag', 'Target', 'Timer', 'Trophy', 'Truck', 'Tv', 'Upload', 'User', 'Users',
  'Video', 'Wallet', 'Watch', 'Zap', 'Bug', 'Building', 'Camera', 'Car', 'BarChart',
  'PieChart', 'Cloud', 'Coffee', 'Database', 'Terminal', 'Gitlab', 'Webhook', 'FileCode',
  'Boxes', 'LayoutGrid', 'Component', 'Braces', 'FolderGit', 'Plus',
  // Education
  'GraduationCap', 'BookOpen', 'PenTool', 'Book', 'Pencil',
  // Health & Wellness
  'Activity', 'Apple', 'Dumbbell',
  // Travel & Transport
  'Map', 'Compass', 'Plane', 'Train', 'Bus', 'Globe', 'Mountain', 'Hotel',
  // Food & Shopping
  'ShoppingCart', 'ShoppingBag', 'Package', 'Gift', 'CreditCard', 'DollarSign', 'Store', 'Pizza',
  // Time & Planning
  'Calendar', 'Clock', 'CalendarDays', 'CalendarClock',
  // Work & Productivity
  'Laptop', 'Printer', 'Phone', 'Headphones', 'Monitor', 'Smartphone', 'Tablet',
  'ClipboardList', 'FilePlus', 'FileCheck', 'FileX',
  // Home & Lifestyle
  'Hammer', 'Wrench', 'Lightbulb', 'Bed', 'Bath',
  // Communication & Social
  'MessageSquare', 'Share', 'Send', 'Reply', 'AtSign', 'Hash',
  // Weather & Environment
  'Sun', 'Moon', 'CloudRain', 'CloudSnow', 'Wind', 'Thermometer', 'Umbrella',
  // Development & Design
  'Figma', 'GitBranch', 'GitMerge', 'GitPullRequest', 'Codesandbox', 'Codepen',
  // Security
  'Lock', 'Unlock', 'Shield', 'ShieldAlert', 'ShieldCheck', 'Key', 'KeyRound', 'Fingerprint'
];

// Validation functions
 const validateColor = (color: any): string => {
  if (!color || typeof color !== 'string') {
    return DEFAULT_COLOR;
  }
  
  const trimmedColor = color.trim();
  
  // Check if it's a valid hex color
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
  
  // Check if the icon is in our valid list
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

 const validateConnections = (connections: any): string[] => {
  if (!Array.isArray(connections)) {
    return [];
  }
  
  return connections.filter(conn => typeof conn === 'string' && conn.trim().length > 0);
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

 const validateBoolean = (value: any): boolean => {
  return Boolean(value);
};

// =============================================
// USER PROFILE SERVICES
// =============================================

export const updateUserLanguage = async (language: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ language })
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating language:', error);
    return { data: null, error };
  }
};

export const updateUserProfile = async (updates: {
  first_name?: string;
  last_name?: string;
  timezone?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
};

export const getUserProfile = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { data: null, error };
  }
};

// =============================================
// AI REQUEST SERVICES
// =============================================

export interface AIRequest {
  id: string;
  prompt: string;
  categories: { name: string; color: string }[];
  honeycombId?: string;
  honeycombName?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export const getDailyAIRequestCount = async () => {
  try {
    const { data, error } = await supabase.rpc('get_daily_ai_request_count');
    
    if (error) throw error;
    return { data: data || 0, error: null };
  } catch (error) {
    console.error('Error getting daily AI request count:', error);
    return { data: 0, error };
  }
};

export const getRecentAIRequests = async (limit = 5) => {
  try {
    const { data, error } = await supabase.rpc('get_recent_ai_requests', { 
      limit_count: limit 
    });
    
    if (error) throw error;
    
    const transformedRequests: AIRequest[] = (data || []).map((request: any) => ({
      id: request.id,
      prompt: request.prompt,
      categories: request.categories || [],
      honeycombId: request.honeycomb_id,
      honeycombName: request.honeycomb_name,
      status: request.status,
      createdAt: new Date(request.created_at),
    }));
    
    return { data: transformedRequests, error: null };
  } catch (error) {
    console.error('Error getting recent AI requests:', error);
    return { data: [], error };
  }
};

export const createAIRequest = async (requestData: {
  prompt: string;
  categories: { name: string; color: string }[];
  generatedItems: any[];
  honeycombId?: string;
  status?: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
}) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('ai_requests')
      .insert([{
        user_id: user.data.user.id,
        prompt: requestData.prompt,
        categories: requestData.categories,
        generated_items: requestData.generatedItems,
        honeycomb_id: requestData.honeycombId,
        status: requestData.status || 'completed',
        error_message: requestData.errorMessage,
      }])
      .select()
      .single();

    if (error) throw error;
    
    const transformedRequest: AIRequest = {
      id: data.id,
      prompt: data.prompt,
      categories: data.categories || [],
      honeycombId: data.honeycomb_id,
      status: data.status,
      createdAt: new Date(data.created_at),
    };

    return { data: transformedRequest, error: null };
  } catch (error) {
    console.error('Error creating AI request:', error);
    return { data: null, error };
  }
};

export const canMakeAIRequest = async () => {
  try {
    const { data: count, error } = await getDailyAIRequestCount();
    
    if (error) throw error;
    
    const dailyLimit = 3;
    const canMake = count < dailyLimit;
    const remaining = Math.max(0, dailyLimit - count);
    
    return { 
      data: { 
        canMake, 
        remaining, 
        used: count, 
        limit: dailyLimit 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error checking AI request limit:', error);
    return { 
      data: { 
        canMake: false, 
        remaining: 0, 
        used: 0, 
        limit: 3 
      }, 
      error 
    };
  }
};

// =============================================
// HONEYCOMB ITEMS SERVICES WITH VALIDATION
// =============================================

export interface HoneycombItemDB {
  id: string;
  honeycombId: string;
  title: string;
  description: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  completed: boolean;
  isMain: boolean;
  q: number;
  r: number;
  x: number;
  y: number;
  connections: string[];
  deadline?: Date;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced transform function with validation
const transformDBItemSafe = (item: any): HoneycombItemDB => {
  const coordinates = validateCoordinates(item.q, item.r);
  const position = validatePosition(item.x, item.y);
  
  return {
    id: item.id || '',
    honeycombId: item.honeycomb_id || '',
    title: validateTitle(item.title),
    description: validateDescription(item.description),
    icon: validateIcon(item.icon),
    priority: validatePriority(item.priority),
    color: validateColor(item.color),
    completed: validateBoolean(item.completed),
    isMain: validateBoolean(item.is_main || item.isMain),
    q: coordinates.q,
    r: coordinates.r,
    x: position.x,
    y: position.y,
    connections: validateConnections(item.connections),
    deadline: validateDeadline(item.deadline),
    category: item.category || undefined,
    createdAt: item.created_at ? new Date(item.created_at) : new Date(),
    updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
  };
};

export const getHoneycombItems = async (honeycombId: string) => {
  try {
    const { data, error } = await supabase
      .from('honeycomb_items')
      .select('*')
      .eq('honeycomb_id', honeycombId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Transform and validate all items
    const transformedItems: HoneycombItemDB[] = (data || []).map(item => {
      try {
        return transformDBItemSafe(item);
      } catch (transformError) {
        console.warn('Error transforming item, using safe defaults:', transformError, item);
        // Return a safe fallback item
        return {
          id: item.id || '',
          honeycombId: honeycombId,
          title: 'Corrupted Item',
          description: 'This item had invalid data and was restored with defaults',
          icon: DEFAULT_ICON,
          priority: DEFAULT_PRIORITY,
          color: DEFAULT_COLOR,
          completed: false,
          isMain: false,
          q: 0,
          r: 0,
          x: 0,
          y: 0,
          connections: [],
          deadline: undefined,
          category: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    });

    return { data: transformedItems, error: null };
  } catch (error) {
    console.error('Error getting honeycomb items:', error);
    return { data: [], error };
  }
};

export const createHoneycombItem = async (
  honeycombId: string,
  item: Omit<HoneycombItemDB, 'id' | 'honeycombId' | 'createdAt' | 'updatedAt'>
) => {
  try {
    // Validate all input data before insertion
    const coordinates = validateCoordinates(item.q, item.r);
    const position = validatePosition(item.x, item.y);
    
    const validatedItem = {
      honeycomb_id: honeycombId,
      title: validateTitle(item.title),
      description: validateDescription(item.description),
      icon: validateIcon(item.icon),
      priority: validatePriority(item.priority),
      color: validateColor(item.color),
      completed: validateBoolean(item.completed),
      is_main: validateBoolean(item.isMain),
      q: coordinates.q,
      r: coordinates.r,
      x: position.x,
      y: position.y,
      connections: validateConnections(item.connections),
      deadline: item.deadline?.toISOString(),
      category: item.category,
    };

    const { data, error } = await supabase
      .from('honeycomb_items')
      .insert([validatedItem])
      .select()
      .single();

    if (error) throw error;

    const transformedItem = transformDBItemSafe(data);
    return { data: transformedItem, error: null };
  } catch (error) {
    console.error('Error creating honeycomb item:', error);
    return { data: null, error };
  }
};

export const updateHoneycombItem = async (
  id: string,
  updates: Partial<Omit<HoneycombItemDB, 'id' | 'honeycombId' | 'createdAt' | 'updatedAt'>>
) => {
  try {
    const updateData: any = {};
    
    // Validate each field before updating
    if (updates.title !== undefined) updateData.title = validateTitle(updates.title);
    if (updates.description !== undefined) updateData.description = validateDescription(updates.description);
    if (updates.icon !== undefined) updateData.icon = validateIcon(updates.icon);
    if (updates.priority !== undefined) updateData.priority = validatePriority(updates.priority);
    if (updates.color !== undefined) updateData.color = validateColor(updates.color);
    if (updates.completed !== undefined) updateData.completed = validateBoolean(updates.completed);
    if (updates.isMain !== undefined) updateData.is_main = validateBoolean(updates.isMain);
    if (updates.q !== undefined) updateData.q = validateCoordinates(updates.q, 0).q;
    if (updates.r !== undefined) updateData.r = validateCoordinates(0, updates.r).r;
    if (updates.x !== undefined) updateData.x = validatePosition(updates.x, 0).x;
    if (updates.y !== undefined) updateData.y = validatePosition(0, updates.y).y;
    if (updates.connections !== undefined) updateData.connections = validateConnections(updates.connections);
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline?.toISOString();
    if (updates.category !== undefined) updateData.category = updates.category;

    const { data, error } = await supabase
      .from('honeycomb_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const transformedItem = transformDBItemSafe(data);
    return { data: transformedItem, error: null };
  } catch (error) {
    console.error('Error updating honeycomb item:', error);
    return { data: null, error };
  }
};

export const deleteHoneycombItem = async (id: string) => {
  try {
    const { error } = await supabase
      .from('honeycomb_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting honeycomb item:', error);
    return { error };
  }
};

export const bulkCreateHoneycombItems = async (
  honeycombId: string,
  items: Omit<HoneycombItemDB, 'id' | 'honeycombId' | 'createdAt' | 'updatedAt'>[]
) => {
  try {
    // Validate all items before insertion
    const insertData = items.map(item => {
      const coordinates = validateCoordinates(item.q, item.r);
      const position = validatePosition(item.x, item.y);
      
      return {
        honeycomb_id: honeycombId,
        title: validateTitle(item.title),
        description: validateDescription(item.description),
        icon: validateIcon(item.icon),
        priority: validatePriority(item.priority),
        color: validateColor(item.color),
        completed: validateBoolean(item.completed),
        is_main: validateBoolean(item.isMain),
        q: coordinates.q,
        r: coordinates.r,
        x: position.x,
        y: position.y,
        connections: validateConnections(item.connections),
        deadline: item.deadline?.toISOString(),
        category: item.category,
      };
    });

    const { data, error } = await supabase
      .from('honeycomb_items')
      .insert(insertData)
      .select();

    if (error) throw error;

    const transformedItems: HoneycombItemDB[] = (data || []).map(item => transformDBItemSafe(item));
    return { data: transformedItems, error: null };
  } catch (error) {
    console.error('Error bulk creating honeycomb items:', error);
    return { data: [], error };
  }
};

export const clearHoneycombItems = async (honeycombId: string) => {
  try {
    const { error } = await supabase
      .from('honeycomb_items')
      .delete()
      .eq('honeycomb_id', honeycombId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error clearing honeycomb items:', error);
    return { error };
  }
};

// =============================================
// HIVE SERVICES (WITH VALIDATION)
// =============================================

const transformHiveSafe = (hive: any): Hive => {
  return {
    id: hive.id,
    name: validateTitle(hive.name),
    description: validateDescription(hive.description),
    icon: validateIcon(hive.icon),
    color: validateColor(hive.color),
    honeycombs: [],
    subHives: [],
    createdAt: new Date(hive.created_at),
    updatedAt: new Date(hive.updated_at),
  };
};

export const createHive = async (hive: Omit<Hive, 'id' | 'createdAt' | 'updatedAt' | 'honeycombs' | 'subHives'>) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const validatedHive = {
      name: validateTitle(hive.name),
      description: validateDescription(hive.description),
      icon: validateIcon(hive.icon),
      color: validateColor(hive.color),
      owner_id: user.data.user.id,
      parent_hive_id: null,
    };

    const { data, error } = await supabase
      .from('hives')
      .insert([validatedHive])
      .select()
      .single();

    if (error) throw error;
    
    const transformedHive = transformHiveSafe(data);
    return { data: transformedHive, error: null };
  } catch (error) {
    console.error('Error creating hive:', error);
    return { data: null, error };
  }
};

export const updateHive = async (id: string, updates: Partial<Omit<Hive, 'id' | 'createdAt' | 'updatedAt' | 'honeycombs' | 'subHives'>>) => {
  try {
    const validatedUpdates: any = {};
    
    if (updates.name !== undefined) validatedUpdates.name = validateTitle(updates.name);
    if (updates.description !== undefined) validatedUpdates.description = validateDescription(updates.description);
    if (updates.icon !== undefined) validatedUpdates.icon = validateIcon(updates.icon);
    if (updates.color !== undefined) validatedUpdates.color = validateColor(updates.color);

    const { data, error } = await supabase
      .from('hives')
      .update(validatedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating hive:', error);
    return { data: null, error };
  }
};

export const deleteHive = async (id: string) => {
  try {
    // First, delete any cloned honeycomb references
    await supabase
      .from('cloned_honeycombs')
      .delete()
      .eq('original_honeycomb_id', id);

    // Get all honeycombs in this hive
    const { data: honeycombs } = await supabase
      .from('honeycombs')
      .select('id')
      .eq('hive_id', id);

    // Delete cloned references for each honeycomb
    if (honeycombs && honeycombs.length > 0) {
      const honeycombIds = honeycombs.map(hc => hc.id);
      
      for (const honeycombId of honeycombIds) {
        await supabase
          .from('cloned_honeycombs')
          .delete()
          .or(`original_honeycomb_id.eq.${honeycombId},cloned_honeycomb_id.eq.${honeycombId}`);
      }
    }

    // Now delete the hive (cascading will handle honeycombs and their items)
    const { error } = await supabase
      .from('hives')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting hive:', error);
    return { error };
  }
};

export const getUserHives = async () => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Get hives with their honeycombs
    const { data: hivesData, error: hivesError } = await supabase
      .from('hives')
      .select(`
        *,
        honeycombs (*)
      `)
      .eq('owner_id', user.data.user.id)
      .is('parent_hive_id', null)
      .order('updated_at', { ascending: false });

    if (hivesError) throw hivesError;

    // Transform data to match our TypeScript interfaces with validation
    const transformedHives: Hive[] = (hivesData || []).map(hive => {
      try {
        return {
          ...transformHiveSafe(hive),
          honeycombs: (hive.honeycombs || []).map((hc: any) => ({
            id: hc.id,
            name: validateTitle(hc.name),
            description: validateDescription(hc.description),
            icon: validateIcon(hc.icon),
            color: validateColor(hc.color),
            tasks: [],
            createdAt: new Date(hc.created_at),
            updatedAt: new Date(hc.updated_at),
          })),
        };
      } catch (transformError) {
        console.warn('Error transforming hive, using safe defaults:', transformError, hive);
        return {
          id: hive.id,
          name: 'Corrupted Hive',
          description: 'This hive had invalid data and was restored',
          icon: DEFAULT_ICON,
          color: DEFAULT_COLOR,
          honeycombs: [],
          subHives: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    });

    return { data: transformedHives, error: null };
  } catch (error) {
    console.error('Error fetching hives:', error);
    return { data: [], error };
  }
};

// =============================================
// HONEYCOMB SERVICES (WITH VALIDATION)
// =============================================

export const createHoneycomb = async (
  honeycomb: Omit<Honeycomb, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  hiveId: string
) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const validatedHoneycomb = {
      name: validateTitle(honeycomb.name),
      description: validateDescription(honeycomb.description),
      icon: validateIcon(honeycomb.icon),
      color: validateColor(honeycomb.color),
      hive_id: hiveId,
      owner_id: user.data.user.id,
    };

    const { data, error } = await supabase
      .from('honeycombs')
      .insert([validatedHoneycomb])
      .select()
      .single();

    if (error) throw error;

    const transformedHoneycomb: Honeycomb = {
      id: data.id,
      name: validateTitle(data.name),
      description: validateDescription(data.description),
      icon: validateIcon(data.icon),
      color: validateColor(data.color),
      tasks: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return { data: transformedHoneycomb, error: null };
  } catch (error) {
    console.error('Error creating honeycomb:', error);
    return { data: null, error };
  }
};

export const updateHoneycomb = async (id: string, updates: Partial<Omit<Honeycomb, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>>) => {
  try {
    const validatedUpdates: any = {};
    
    if (updates.name !== undefined) validatedUpdates.name = validateTitle(updates.name);
    if (updates.description !== undefined) validatedUpdates.description = validateDescription(updates.description);
    if (updates.icon !== undefined) validatedUpdates.icon = validateIcon(updates.icon);
    if (updates.color !== undefined) validatedUpdates.color = validateColor(updates.color);

    const { data, error } = await supabase
      .from('honeycombs')
      .update(validatedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating honeycomb:', error);
    return { data: null, error };
  }
};

export const deleteHoneycomb = async (id: string) => {
  try {
    // First, delete any cloned honeycomb references
    await supabase
      .from('cloned_honeycombs')
      .delete()
      .or(`original_honeycomb_id.eq.${id},cloned_honeycomb_id.eq.${id}`);

    // Now delete the honeycomb (cascading will handle honeycomb_items)
    const { error } = await supabase
      .from('honeycombs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting honeycomb:', error);
    return { error };
  }
};

export const getHoneycomb = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('honeycombs')
      .select(`
        *,
        honeycomb_items (*),
        tasks (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Transform to match our interface with validation
    const transformedHoneycomb = {
      id: data.id,
      name: validateTitle(data.name),
      description: validateDescription(data.description),
      icon: validateIcon(data.icon),
      color: validateColor(data.color),
      tasks: (data.tasks || []).map((task: any) => ({
        id: task.id,
        title: validateTitle(task.title),
        description: validateDescription(task.description),
        icon: validateIcon(task.icon),
        priority: validatePriority(task.priority),
        completed: validateBoolean(task.completed),
        deadline: validateDeadline(task.deadline),
        color: validateColor(task.color),
        createdAt: new Date(task.created_at),
        updatedAt: new Date(task.updated_at),
      })),
      canvasItems: (data.honeycomb_items || []).map((item: any) => transformDBItemSafe(item)),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return { data: transformedHoneycomb, error: null };
  } catch (error) {
    console.error('Error fetching honeycomb:', error);
    return { data: null, error };
  }
};

// =============================================
// CLONED HONEYCOMB UTILITIES
// =============================================

export const checkIfHoneycombIsCloned = async (honeycombId: string) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { data: false, error: null };

    const { data } = await supabase
      .from('cloned_honeycombs')
      .select('id')
      .eq('cloned_honeycomb_id', honeycombId)
      .eq('user_id', user.data.user.id)
      .single();

    return { data: !!data, error: null };
  } catch (error) {
    return { data: false, error: null };
  }
};

export const getOriginalHoneycombId = async (clonedHoneycombId: string) => {
  try {
    const { data, error } = await supabase
      .from('cloned_honeycombs')
      .select('original_honeycomb_id')
      .eq('cloned_honeycomb_id', clonedHoneycombId)
      .single();

    if (error) return { data: null, error };
    return { data: data.original_honeycomb_id, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// =============================================
// DATA REPAIR UTILITIES
// =============================================

/**
 * Repair corrupted honeycomb items by validating and fixing their data
 */
export const repairHoneycombItems = async (honeycombId: string) => {
  try {
    console.log(`Starting repair for honeycomb: ${honeycombId}`);
    
    // Get all items for this honeycomb
    const { data: rawItems, error: fetchError } = await supabase
      .from('honeycomb_items')
      .select('*')
      .eq('honeycomb_id', honeycombId);

    if (fetchError) throw fetchError;

    if (!rawItems || rawItems.length === 0) {
      console.log('No items found to repair');
      return { data: { repaired: 0, total: 0 }, error: null };
    }

    let repairedCount = 0;
    const totalCount = rawItems.length;

    // Process each item
    for (const item of rawItems) {
      try {
        // Validate and fix the item
        const coordinates = validateCoordinates(item.q, item.r);
        const position = validatePosition(item.x, item.y);
        
        const repairedData = {
          title: validateTitle(item.title),
          description: validateDescription(item.description),
          icon: validateIcon(item.icon),
          priority: validatePriority(item.priority),
          color: validateColor(item.color),
          completed: validateBoolean(item.completed),
          is_main: validateBoolean(item.is_main),
          q: coordinates.q,
          r: coordinates.r,
          x: position.x,
          y: position.y,
          connections: validateConnections(item.connections),
          deadline: item.deadline ? new Date(item.deadline).toISOString() : null,
          category: item.category || null,
        };

        // Check if repair is needed
        const needsRepair = 
          item.title !== repairedData.title ||
          item.description !== repairedData.description ||
          item.icon !== repairedData.icon ||
          item.priority !== repairedData.priority ||
          item.color !== repairedData.color ||
          item.q !== repairedData.q ||
          item.r !== repairedData.r ||
          item.x !== repairedData.x ||
          item.y !== repairedData.y ||
          JSON.stringify(item.connections) !== JSON.stringify(repairedData.connections);

        if (needsRepair) {
          console.log(`Repairing item: ${item.id}`);
          
          const { error: updateError } = await supabase
            .from('honeycomb_items')
            .update(repairedData)
            .eq('id', item.id);

          if (updateError) {
            console.error(`Failed to repair item ${item.id}:`, updateError);
          } else {
            repairedCount++;
          }
        }
      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError);
      }
    }

    console.log(`Repair completed: ${repairedCount}/${totalCount} items repaired`);
    return { 
      data: { 
        repaired: repairedCount, 
        total: totalCount 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error during repair process:', error);
    return { data: null, error };
  }
};

/**
 * Validate all honeycomb items in the database and return a report
 */
export const validateAllHoneycombItems = async (honeycombId?: string) => {
  try {
    let query = supabase.from('honeycomb_items').select('*');
    
    if (honeycombId) {
      query = query.eq('honeycomb_id', honeycombId);
    }

    const { data: items, error } = await query;

    if (error) throw error;

    const validationReport = {
      total: items?.length || 0,
      valid: 0,
      invalid: 0,
      issues: [] as Array<{
        id: string;
        honeycombId: string;
        issues: string[];
      }>,
    };

    if (!items) return { data: validationReport, error: null };

    for (const item of items) {
      const issues: string[] = [];

      // Check each field
      if (!validateTitle(item.title) || item.title !== validateTitle(item.title)) {
        issues.push('Invalid title');
      }
      if (item.icon !== validateIcon(item.icon)) {
        issues.push('Invalid icon');
      }
      if (item.priority !== validatePriority(item.priority)) {
        issues.push('Invalid priority');
      }
      if (item.color !== validateColor(item.color)) {
        issues.push('Invalid color');
      }
      if (typeof item.q !== 'number' || typeof item.r !== 'number') {
        issues.push('Invalid coordinates');
      }
      if (typeof item.x !== 'number' || typeof item.y !== 'number') {
        issues.push('Invalid position');
      }
      if (!Array.isArray(item.connections)) {
        issues.push('Invalid connections');
      }

      if (issues.length > 0) {
        validationReport.invalid++;
        validationReport.issues.push({
          id: item.id,
          honeycombId: item.honeycomb_id,
          issues,
        });
      } else {
        validationReport.valid++;
      }
    }

    return { data: validationReport, error: null };
  } catch (error) {
    console.error('Error validating honeycomb items:', error);
    return { data: null, error };
  }
};

/**
 * Batch repair all invalid items in the database
 */
export const batchRepairAllItems = async () => {
  try {
    console.log('Starting batch repair of all honeycomb items');
    
    // Get all honeycomb IDs
    const { data: honeycombs, error: honeycombError } = await supabase
      .from('honeycombs')
      .select('id');

    if (honeycombError) throw honeycombError;

    if (!honeycombs || honeycombs.length === 0) {
      return { data: { totalHoneycombs: 0, totalRepaired: 0 }, error: null };
    }

    let totalRepaired = 0;
    const totalHoneycombs = honeycombs.length;

    // Repair each honeycomb
    for (const honeycomb of honeycombs) {
      try {
        const { data: repairResult } = await repairHoneycombItems(honeycomb.id);
        if (repairResult) {
          totalRepaired += repairResult.repaired;
        }
      } catch (repairError) {
        console.error(`Failed to repair honeycomb ${honeycomb.id}:`, repairError);
      }
    }

    console.log(`Batch repair completed: ${totalRepaired} items repaired across ${totalHoneycombs} honeycombs`);
    return { 
      data: { 
        totalHoneycombs, 
        totalRepaired 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error during batch repair:', error);
    return { data: null, error };
  }
};

// =============================================
// EXPORT ALL VALIDATION FUNCTIONS
// =============================================

export {
  validateColor,
  validateIcon,
  validatePriority,
  validateTitle,
  validateDescription,
  validateCoordinates,
  validatePosition,
  validateConnections,
  validateDeadline,
  validateBoolean,
  DEFAULT_COLOR,
  DEFAULT_ICON,
  DEFAULT_PRIORITY,
  VALID_ICONS,
};