/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/sharing.ts
import supabase from '@/utils/supabase';

// Types
export interface SharingSession {
  id: string;
  honeycomb_id: string;
  owner_id: string;
  share_code: string;
  share_link: string;
  permissions: 'view' | 'edit' | 'comment';
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SharingParticipant {
  id: string;
  session_id: string;
  user_id?: string;
  anonymous_id?: string;
  display_name: string;
  permissions: 'view' | 'edit' | 'comment';
  is_online: boolean;
  cursor_position?: { x: number; y: number };
  selected_item_id?: string;
  joined_at: Date;
  last_seen_at: Date;
}

// Create a new sharing session
export const createSharingSession = async (
  honeycombId: string,
  permissions: 'view' | 'edit' = 'view'
) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('create_sharing_session', {
      p_honeycomb_id: honeycombId,
      p_owner_id: user.user.id,
      p_permissions: permissions
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating sharing session:', error);
    return { data: null, error };
  }
};

// Get active sharing session for a honeycomb
export const getActiveSession = async (honeycombId: string) => {
  try {
    const { data, error } = await supabase
      .from('sharing_sessions')
      .select('*')
      .eq('honeycomb_id', honeycombId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return { data, error: null };
  } catch (error) {
    console.error('Error getting active session:', error);
    return { data: null, error };
  }
};

// Get sharing session by code
export const getSessionByCode = async (shareCode: string) => {
  try {
    const { data, error } = await supabase
      .from('sharing_sessions')
      .select(`
        *,
        honeycombs (
          id,
          name,
          description,
          color,
          icon
        )
      `)
      .eq('share_code', shareCode)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting session by code:', error);
    return { data: null, error };
  }
};

// Join a sharing session
export const joinSharingSession = async (
  sessionId: string,
  displayName: string,
  userId?: string
) => {
  try {
    // For anonymous users, create a unique ID based on session and time
    const anonymousId = userId ? null : `anon_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('sharing_participants')
      .insert([{
        session_id: sessionId,
        user_id: userId,
        anonymous_id: anonymousId,
        display_name: displayName,
        permissions: 'view', // Default permission for new participants
        is_online: true
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error joining sharing session:', error);
    return { data: null, error };
  }
};

// Update session permissions
export const updateSessionPermissions = async (
  sessionId: string,
  permissions: 'view' | 'edit' | 'comment'
) => {
  try {
    const { data, error } = await supabase
      .from('sharing_sessions')
      .update({ permissions })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating session permissions:', error);
    return { data: null, error };
  }
};

// Update participant permissions
export const updateParticipantPermissions = async (
  participantId: string,
  permissions: 'view' | 'edit' | 'comment'
) => {
  try {
    const { data, error } = await supabase
      .from('sharing_participants')
      .update({ permissions })
      .eq('id', participantId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating participant permissions:', error);
    return { data: null, error };
  }
};

// Get session participants
export const getSessionParticipants = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('sharing_participants')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting session participants:', error);
    return { data: [], error };
  }
};

// Update participant status
export const updateParticipantStatus = async (
  participantId: string,
  isOnline: boolean,
  cursorPosition?: { x: number; y: number },
  selectedItemId?: string
) => {
  try {
    const updateData: any = {
      is_online: isOnline,
      last_seen_at: new Date().toISOString()
    };

    if (cursorPosition) {
      updateData.cursor_position = cursorPosition;
    }

    if (selectedItemId !== undefined) {
      updateData.selected_item_id = selectedItemId;
    }

    const { data, error } = await supabase
      .from('sharing_participants')
      .update(updateData)
      .eq('id', participantId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating participant status:', error);
    return { data: null, error };
  }
};

// End sharing session
export const endSharingSession = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('sharing_sessions')
      .update({ is_active: false })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error ending sharing session:', error);
    return { data: null, error };
  }
};

// Clone honeycomb for user
export const cloneHoneycombForUser = async (sessionId: string) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('clone_honeycomb_for_user', {
      p_session_id: sessionId,
      p_user_id: user.user.id
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error cloning honeycomb:', error);
    return { data: null, error };
  }
};

// Log sharing change
export const logSharingChange = async (
  sessionId: string,
  participantId: string,
  changeType: 'create' | 'update' | 'delete' | 'move',
  itemId: string,
  changes: any
) => {
  try {
    const { data, error } = await supabase
      .from('sharing_changes')
      .insert([{
        session_id: sessionId,
        participant_id: participantId,
        change_type: changeType,
        item_id: itemId,
        changes
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error logging sharing change:', error);
    return { data: null, error };
  }
};

// Get recent changes for a session
export const getRecentChanges = async (sessionId: string, since?: Date) => {
  try {
    let query = supabase
      .from('sharing_changes')
      .select(`
        *,
        sharing_participants (
          display_name,
          user_id,
          anonymous_id
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (since) {
      query = query.gt('created_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting recent changes:', error);
    return { data: [], error };
  }
};

// Clean up offline participants (remove participants offline for more than 1 hour)
export const cleanupOfflineParticipants = async (sessionId: string) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { error } = await supabase
      .from('sharing_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('is_online', false)
      .lt('last_seen_at', oneHourAgo.toISOString());

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error cleaning up offline participants:', error);
    return { error };
  }
};

// Track active channels to prevent multiple subscriptions
const activeChannels = new Map<string, any>();

// Setup real-time subscriptions for sharing
export const setupSharingRealtimeSubscription = (
  sessionId: string,
  onParticipantChange: (participant: SharingParticipant) => void,
  onChangeReceived: (change: any) => void
) => {
  // Check if we already have channels for this session
  const participantsChannelKey = `sharing_participants:${sessionId}`;
  const changesChannelKey = `sharing_changes:${sessionId}`;
  
  if (activeChannels.has(participantsChannelKey) || activeChannels.has(changesChannelKey)) {
    console.warn('Channels already exist for session:', sessionId);
    return () => {}; // Return empty cleanup function
  }

  // Subscribe to participant changes
  const participantsChannel = supabase
    .channel(participantsChannelKey)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sharing_participants',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        onParticipantChange(payload.new as SharingParticipant);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to participants channel for session:', sessionId);
      }
    });

  // Subscribe to sharing changes
  const changesChannel = supabase
    .channel(changesChannelKey)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sharing_changes',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        onChangeReceived(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to changes channel for session:', sessionId);
      }
    });

  // Store channels to prevent duplicates
  activeChannels.set(participantsChannelKey, participantsChannel);
  activeChannels.set(changesChannelKey, changesChannel);

  // Return cleanup function
  return () => {
    console.log('Cleaning up channels for session:', sessionId);
    
    if (activeChannels.has(participantsChannelKey)) {
      supabase.removeChannel(activeChannels.get(participantsChannelKey));
      activeChannels.delete(participantsChannelKey);
    }
    
    if (activeChannels.has(changesChannelKey)) {
      supabase.removeChannel(activeChannels.get(changesChannelKey));
      activeChannels.delete(changesChannelKey);
    }
  };
};