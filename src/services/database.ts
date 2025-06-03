/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/database.ts
import supabase from '@/utils/supabase';
import type { Hive, Honeycomb } from '@/types';

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
// HONEYCOMB ITEMS SERVICES
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

export const getHoneycombItems = async (honeycombId: string) => {
  try {
    const { data, error } = await supabase
      .from('honeycomb_items')
      .select('*')
      .eq('honeycomb_id', honeycombId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const transformedItems: HoneycombItemDB[] = (data || []).map((item: any) => ({
      id: item.id,
      honeycombId: item.honeycomb_id,
      title: item.title,
      description: item.description || '',
      icon: item.icon,
      priority: item.priority,
      color: item.color,
      completed: item.completed,
      isMain: item.is_main,
      q: item.q,
      r: item.r,
      x: item.x,
      y: item.y,
      connections: item.connections || [],
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      category: item.category,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));

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
    const { data, error } = await supabase
      .from('honeycomb_items')
      .insert([{
        honeycomb_id: honeycombId,
        title: item.title,
        description: item.description,
        icon: item.icon,
        priority: item.priority,
        color: item.color,
        completed: item.completed,
        is_main: item.isMain,
        q: item.q,
        r: item.r,
        x: item.x,
        y: item.y,
        connections: item.connections,
        deadline: item.deadline?.toISOString(),
        category: item.category,
      }])
      .select()
      .single();

    if (error) throw error;

    const transformedItem: HoneycombItemDB = {
      id: data.id,
      honeycombId: data.honeycomb_id,
      title: data.title,
      description: data.description || '',
      icon: data.icon,
      priority: data.priority,
      color: data.color,
      completed: data.completed,
      isMain: data.is_main,
      q: data.q,
      r: data.r,
      x: data.x,
      y: data.y,
      connections: data.connections || [],
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      category: data.category,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

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
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.isMain !== undefined) updateData.is_main = updates.isMain;
    if (updates.q !== undefined) updateData.q = updates.q;
    if (updates.r !== undefined) updateData.r = updates.r;
    if (updates.x !== undefined) updateData.x = updates.x;
    if (updates.y !== undefined) updateData.y = updates.y;
    if (updates.connections !== undefined) updateData.connections = updates.connections;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline?.toISOString();
    if (updates.category !== undefined) updateData.category = updates.category;

    const { data, error } = await supabase
      .from('honeycomb_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const transformedItem: HoneycombItemDB = {
      id: data.id,
      honeycombId: data.honeycomb_id,
      title: data.title,
      description: data.description || '',
      icon: data.icon,
      priority: data.priority,
      color: data.color,
      completed: data.completed,
      isMain: data.is_main,
      q: data.q,
      r: data.r,
      x: data.x,
      y: data.y,
      connections: data.connections || [],
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      category: data.category,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

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
    const insertData = items.map(item => ({
      honeycomb_id: honeycombId,
      title: item.title,
      description: item.description,
      icon: item.icon,
      priority: item.priority,
      color: item.color,
      completed: item.completed,
      is_main: item.isMain,
      q: item.q,
      r: item.r,
      x: item.x,
      y: item.y,
      connections: item.connections,
      deadline: item.deadline?.toISOString(),
      category: item.category,
    }));

    const { data, error } = await supabase
      .from('honeycomb_items')
      .insert(insertData)
      .select();

    if (error) throw error;

    const transformedItems: HoneycombItemDB[] = (data || []).map((item: any) => ({
      id: item.id,
      honeycombId: item.honeycomb_id,
      title: item.title,
      description: item.description || '',
      icon: item.icon,
      priority: item.priority,
      color: item.color,
      completed: item.completed,
      isMain: item.is_main,
      q: item.q,
      r: item.r,
      x: item.x,
      y: item.y,
      connections: item.connections || [],
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      category: item.category,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));

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
// HIVE SERVICES (FIXED DELETION)
// =============================================

export const createHive = async (hive: Omit<Hive, 'id' | 'createdAt' | 'updatedAt' | 'honeycombs' | 'subHives'>) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('hives')
      .insert([{
        name: hive.name,
        description: hive.description,
        icon: hive.icon,
        color: hive.color,
        owner_id: user.data.user.id,
        parent_hive_id: null, // Top-level hive
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Transform database result to match our TypeScript interface
    const transformedHive: Hive = {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon as any,
      color: data.color,
      honeycombs: [],
      subHives: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return { data: transformedHive, error: null };
  } catch (error) {
    console.error('Error creating hive:', error);
    return { data: null, error };
  }
};

export const updateHive = async (id: string, updates: Partial<Omit<Hive, 'id' | 'createdAt' | 'updatedAt' | 'honeycombs' | 'subHives'>>) => {
  try {
    const { data, error } = await supabase
      .from('hives')
      .update({
        name: updates.name,
        description: updates.description,
        icon: updates.icon,
        color: updates.color,
      })
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
      .is('parent_hive_id', null) // Only top-level hives for now
      .order('updated_at', { ascending: false });

    if (hivesError) throw hivesError;

    // Transform data to match our TypeScript interfaces
    const transformedHives: Hive[] = (hivesData || []).map(hive => ({
      id: hive.id,
      name: hive.name,
      description: hive.description,
      icon: hive.icon as any,
      color: hive.color,
      honeycombs: (hive.honeycombs || []).map((hc: any) => ({
        id: hc.id,
        name: hc.name,
        description: hc.description,
        icon: hc.icon as any,
        color: hc.color,
        tasks: [], // We'll load tasks separately when needed
        createdAt: new Date(hc.created_at),
        updatedAt: new Date(hc.updated_at),
      })),
      subHives: [], // We'll implement sub-hives later
      createdAt: new Date(hive.created_at),
      updatedAt: new Date(hive.updated_at),
    }));

    return { data: transformedHives, error: null };
  } catch (error) {
    console.error('Error fetching hives:', error);
    return { data: [], error };
  }
};

// =============================================
// HONEYCOMB SERVICES (FIXED DELETION)
// =============================================

export const createHoneycomb = async (
  honeycomb: Omit<Honeycomb, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  hiveId: string
) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('honeycombs')
      .insert([{
        name: honeycomb.name,
        description: honeycomb.description,
        icon: honeycomb.icon,
        color: honeycomb.color,
        hive_id: hiveId,
        owner_id: user.data.user.id,
      }])
      .select()
      .single();

    if (error) throw error;

    // Transform database result to match our TypeScript interface
    const transformedHoneycomb: Honeycomb = {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon as any,
      color: data.color,
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
    const { data, error } = await supabase
      .from('honeycombs')
      .update({
        name: updates.name,
        description: updates.description,
        icon: updates.icon,
        color: updates.color,
      })
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

    // Transform to match our interface
    const transformedHoneycomb = {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon as any,
      color: data.color,
      tasks: (data.tasks || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        icon: task.icon as any,
        priority: task.priority as any,
        completed: task.completed,
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        color: task.color,
        createdAt: new Date(task.created_at),
        updatedAt: new Date(task.updated_at),
      })),
      canvasItems: (data.honeycomb_items || []).map((item: any) => ({
        id: item.id,
        x: item.x,
        y: item.y,
        title: item.title,
        description: item.description,
        icon: item.icon as any,
        priority: item.priority as any,
        deadline: item.deadline ? new Date(item.deadline) : undefined,
        color: item.color,
        connections: item.connections || [],
        completed: item.completed,
        isMain: item.is_main,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })),
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