
import { createClient } from '@supabase/supabase-js';
import { Message, Channel, MessageType } from '../types';

const SUPABASE_URL = 'https://abunbqqxtpugsjfvvikj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidW5icXF4dHB1Z3NqZnZ2aWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTcyNzksImV4cCI6MjA4MTg5MzI3OX0.ld29ijoxlkkCC2uNPnvc4aiTiMEhQvu2bfilH6IOIzo';

export const isConfigured = () => 
  SUPABASE_URL.startsWith('https://') && 
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes('anon-key');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const storageService = {
  async cleanupOldMessages(hours = 24) {
    try {
      if (!isConfigured()) return;
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - hours);
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .lt('created_at', cutoff.toISOString());
        
      if (error) console.error("Cleanup error:", error.message);
    } catch (err) {
      console.error("Cleanup failed:", err);
    }
  },

  async getChannels(): Promise<Channel[]> {
    try {
      const { data, error } = await supabase.from('channels').select('*');
      if (error) throw error;
      return data as Channel[];
    } catch (err: any) {
      throw err;
    }
  },

  async createChannel(channel: Channel) {
    try {
      const { error } = await supabase.from('channels').upsert({
        name: channel.name,
        description: channel.description,
        users: channel.users
      });
      if (error) throw error;
    } catch (err: any) {
      throw err;
    }
  },

  async addUserToChannel(channelName: string, userName: string) {
    try {
      const { data: channel } = await supabase
        .from('channels')
        .select('users')
        .eq('name', channelName)
        .single();

      if (channel) {
        const users = channel.users || [];
        if (!users.includes(userName)) {
          const newUsers = [...users, userName];
          await supabase
            .from('channels')
            .update({ users: newUsers })
            .eq('name', channelName);
        }
      }
    } catch (err) {}
  },

  async getMessagesByChannel(channelName: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel', channelName)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      return data.map(m => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        timestamp: new Date(m.created_at),
        type: m.type as MessageType,
        channel: m.channel
      }));
    } catch (err: any) {
      throw err;
    }
  },

  async saveMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    try {
      const { error } = await supabase.from('messages').insert({
        sender: message.sender,
        text: message.text,
        type: message.type,
        channel: message.channel
      });
      if (error) throw error;
    } catch (err: any) {
      throw err;
    }
  },

  subscribeToMessages(callback: (payload: any) => void) {
    return supabase
      .channel('messages_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => callback(payload)
      )
      .subscribe();
  },

  subscribeToChannels(callback: (payload: any) => void) {
    return supabase
      .channel('channels_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'channels' },
        (payload) => callback(payload)
      )
      .subscribe();
  }
};
