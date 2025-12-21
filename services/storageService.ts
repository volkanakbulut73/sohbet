
import { createClient } from '@supabase/supabase-js';
import { Message, Channel, MessageType } from '../types';

/**
 * Supabase yapılandırması.
 */
const SUPABASE_URL = 'https://abunbqqxtpugsjfvvikj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidW5icXF4dHB1Z3NqZnZ2aWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTcyNzksImV4cCI6MjA4MTg5MzI3OX0.ld29ijoxlkkCC2uNPnvc4aiTiMEhQvu2bfilH6IOIzo';

export const isConfigured = () => 
  SUPABASE_URL.startsWith('https://') && 
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes('anon-key');

// İstemciyi yapılandırma ile oluştur
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const storageService = {
  async getChannels(): Promise<Channel[]> {
    try {
      if (!isConfigured()) throw new Error("Supabase anahtarları eksik veya hatalı.");
      const { data, error } = await supabase.from('channels').select('*');
      if (error) throw error;
      return data as Channel[];
    } catch (err: any) {
      console.error("Supabase Channels Error:", err.message);
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
      console.error("Create Channel Error:", err.message);
      throw err;
    }
  },

  async getMessagesByChannel(channelName: string): Promise<Message[]> {
    try {
      if (!isConfigured()) return [];
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
      console.error("Get Messages Error:", err.message);
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
      console.error("Save Message Error:", err.message);
      throw err;
    }
  },

  subscribeToMessages(callback: (payload: any) => void) {
    if (!isConfigured()) return { unsubscribe: () => {} };
    return supabase
      .channel('messages_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => callback(payload)
      )
      .subscribe();
  }
};
