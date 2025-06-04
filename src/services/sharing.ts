/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/sharing.ts
import supabase from '@/utils/supabase';

// =============================================
// TYPES
// =============================================

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

export interface SharingChange {
  id: string;
  session_id: string;
  participant_id: string;
  change_type: 'create' | 'update' | 'delete' | 'move';
  item_id: string;
  changes: any;
  created_at: Date;
}

// =============================================
// CONNECTION MANAGER
// =============================================

class ConnectionManager {
  private static instance: ConnectionManager;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionState: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private listeners: Array<(state: string) => void> = [];

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  addListener(callback: (state: string) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (state: string) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.connectionState));
  }

  setConnectionState(state: 'connected' | 'disconnected' | 'reconnecting') {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.notifyListeners();
      
      if (state === 'connected') {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      }
    }
  }

  getConnectionState() {
    return this.connectionState;
  }

  async attemptReconnection(reconnectFunction: () => Promise<void>): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.setConnectionState('disconnected');
      return false;
    }

    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;

    try {
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      
      await reconnectFunction();
      this.setConnectionState('connected');
      return true;
    } catch (error) {
      console.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      
      // Exponential backoff with jitter
      this.reconnectDelay = Math.min(this.reconnectDelay * 2 + Math.random() * 1000, 30000);
      
      // Try again
      return this.attemptReconnection(reconnectFunction);
    }
  }

  reset() {
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.setConnectionState('disconnected');
  }
}

// Get connection manager instance
const connectionManager = ConnectionManager.getInstance();

// =============================================
// SHARING SESSION MANAGEMENT
// =============================================

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

    if (error && error.code !== 'PGRST116') throw error;
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

// =============================================
// PARTICIPANT MANAGEMENT
// =============================================

// Join a sharing session
export const joinSharingSession = async (
  sessionId: string,
  displayName: string,
  userId?: string
) => {
  try {
    // For anonymous users, create a unique ID
    const anonymousId = userId ? null : `anon_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('sharing_participants')
      .insert([{
        session_id: sessionId,
        user_id: userId,
        anonymous_id: anonymousId,
        display_name: displayName,
        permissions: 'view',
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

// =============================================
// PARTICIPANT STATUS UPDATES (OPTIMIZED)
// =============================================

// Queue for batching status updates
const statusUpdateQueue = new Map<string, any>();
let statusUpdateTimer: NodeJS.Timeout | null = null;

// Flush all queued status updates
const flushStatusUpdates = async () => {
  if (statusUpdateQueue.size === 0) return;

  // Get all updates and clear queue
  const updates = Array.from(statusUpdateQueue.entries());
  statusUpdateQueue.clear();

  // Process all updates in parallel
  const updatePromises = updates.map(async ([participantId, updateData]) => {
    try {
      const { error } = await supabase
        .from('sharing_participants')
        .update(updateData)
        .eq('id', participantId);

      if (error) {
        console.error(`Error updating participant ${participantId}:`, error);
      }
    } catch (error) {
      console.error(`Error updating participant ${participantId}:`, error);
    }
  });

  await Promise.all(updatePromises);
};

// Update participant status with batching
export const updateParticipantStatus = async (
  participantId: string,
  isOnline: boolean,
  cursorPosition?: { x: number; y: number },
  selectedItemId?: string | null
) => {
  const updateData: any = {
    is_online: isOnline,
    last_seen_at: new Date().toISOString()
  };

  if (cursorPosition !== undefined) {
    updateData.cursor_position = cursorPosition;
  }

  if (selectedItemId !== undefined) {
    updateData.selected_item_id = selectedItemId;
  }

  // Queue the update
  statusUpdateQueue.set(participantId, updateData);

  // Clear existing timer
  if (statusUpdateTimer) {
    clearTimeout(statusUpdateTimer);
  }

  // Set timer to flush updates
  statusUpdateTimer = setTimeout(() => {
    flushStatusUpdates();
  }, 50); // Batch updates every 50ms

  return { data: null, error: null };
};

// Clean up offline participants
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

// =============================================
// SHARING CHANGES LOGGING
// =============================================

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

// =============================================
// REAL-TIME SUBSCRIPTIONS
// =============================================

// Active subscriptions tracker
const activeSubscriptions = new Map<string, any>();

// Setup real-time subscription for sharing
export const setupSharingRealtimeSubscription = (
  sessionId: string,
  onParticipantChange: (participant: SharingParticipant) => void,
  onChangeReceived: (change: any) => void,
  onConnectionStateChange?: (state: string) => void
) => {
  const subscriptionKey = `sharing_${sessionId}`;
  
  // Clean up existing subscription
  if (activeSubscriptions.has(subscriptionKey)) {
    const existingChannel = activeSubscriptions.get(subscriptionKey);
    supabase.removeChannel(existingChannel);
    activeSubscriptions.delete(subscriptionKey);
  }

  // Add connection state listener if provided
  if (onConnectionStateChange) {
    connectionManager.addListener(onConnectionStateChange);
  }

  // Create subscription setup function
  const setupSubscription = async () => {
    console.log(`Setting up real-time subscription for session: ${sessionId}`);

    try {
      // Create a single channel for all sharing events
      const channel = supabase
        .channel(`sharing_${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sharing_participants',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('Participant change:', payload);
            if (payload.new) {
              onParticipantChange(payload.new as SharingParticipant);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sharing_changes',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('Change received:', payload);
            if (payload.new) {
              onChangeReceived(payload.new);
            }
          }
        )
        .subscribe((status, err) => {
          console.log(`Subscription status: ${status}`, err);
          
          if (status === 'SUBSCRIBED') {
            connectionManager.setConnectionState('connected');
            console.log('Successfully subscribed to sharing real-time updates');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            connectionManager.setConnectionState('disconnected');
            console.error('Subscription error:', err);
            
            // Attempt reconnection after delay
            setTimeout(() => {
              connectionManager.attemptReconnection(setupSubscription);
            }, 2000);
          }
        });

      // Store the channel
      activeSubscriptions.set(subscriptionKey, channel);
    } catch (error) {
      console.error('Error setting up subscription:', error);
      connectionManager.setConnectionState('disconnected');
      
      // Retry setup
      setTimeout(() => {
        connectionManager.attemptReconnection(setupSubscription);
      }, 2000);
    }
  };

  // Initial setup
  setupSubscription();

  // Network event handlers
  const handleOnline = () => {
    console.log('Network connection restored');
    connectionManager.reset();
    setupSubscription();
  };

  const handleOffline = () => {
    console.log('Network connection lost');
    connectionManager.setConnectionState('disconnected');
  };

  // Add network listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    console.log(`Cleaning up subscription for session: ${sessionId}`);
    
    // Remove network listeners
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    
    // Remove connection state listener
    if (onConnectionStateChange) {
      connectionManager.removeListener(onConnectionStateChange);
    }
    
    // Clean up subscription
    if (activeSubscriptions.has(subscriptionKey)) {
      const channel = activeSubscriptions.get(subscriptionKey);
      supabase.removeChannel(channel);
      activeSubscriptions.delete(subscriptionKey);
    }
    
    // Reset connection manager
    connectionManager.reset();
  };
};

// =============================================
// HONEYCOMB CLONING
// =============================================

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

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Check connection health
export const checkConnectionHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sharing_sessions')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
};

// Get connection status
export const getConnectionStatus = () => {
  return connectionManager.getConnectionState();
};

// Export connection manager for external use
export { connectionManager };