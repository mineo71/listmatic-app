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
// HIVE SERVICES
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
// HONEYCOMB SERVICES
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