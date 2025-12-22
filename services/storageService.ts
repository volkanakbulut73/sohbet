
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
  async getChannels(): Promise<Channel[]> {
    const { data, error } = await supabase.from('channels').select('*');
    if (error) throw error;
    return data as Channel[];
  },

  async createChannel(channel: Channel) {
    const { error } = await supabase.from('channels').upsert({
      name: channel.name,
      description: channel.description,
      users: channel.users,
      isLocked: false,
      ops: [],
      bannedUsers: []
    });
    if (error) throw error;
  },

  async updateChannel(name: string, updates: Partial<Channel>) {
    const { error } = await supabase.from('channels').update(updates).eq('name', name);
    if (error) throw error;
  },

  async clearChannelMessages(channelName: string) {
    const { error } = await supabase.from('messages').delete().eq('channel', channelName);
    if (error) throw error;
  },

  async getMessagesByChannel(channelName: string): Promise<Message[]> {
    const { data, error } = await supabase.from('messages').select('*').eq('channel', channelName).order('created_at', { ascending: true }).limit(200);
    if (error) throw error;
    return data.map(m => ({
      id: m.id, sender: m.sender, text: m.text, timestamp: new Date(m.created_at), type: m.type as MessageType, channel: m.channel
    }));
  },

  async saveMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const { error } = await supabase.from('messages').insert({
      sender: message.sender, text: message.text, type: message.type, channel: message.channel
    });
    if (error) throw error;
  },

  subscribeToMessages(callback: (payload: any) => void) {
    return supabase.channel('messages_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => callback(payload)).subscribe();
  },

  subscribeToChannels(callback: (payload: any) => void) {
    return supabase.channel('channels_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, (payload) => callback(payload)).subscribe();
  }
};
