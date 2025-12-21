
import { createClient } from '@supabase/supabase-js';
import { Message, Channel, MessageType } from '../types';

// Not: Bu değerleri Supabase panelinizden (Settings -> API) alıp buraya yapıştırın.
// Mimari gereği process.env kullanılması önerilir ancak burada örnek için placeholder bırakılmıştır.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const storageService = {
  // Kanalları Getir
  async getChannels(): Promise<Channel[]> {
    const { data, error } = await supabase
      .from('channels')
      .select('*');
    
    if (error) {
      console.error("Error fetching channels:", error);
      return [];
    }
    return data as Channel[];
  },

  // Yeni Kanal Oluştur
  async createChannel(channel: Channel) {
    await supabase.from('channels').upsert(channel);
  },

  // Mesajları Getir (Belli bir kanal için)
  async getMessagesByChannel(channelName: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel', channelName)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return data.map(m => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: new Date(m.created_at),
      type: m.type as MessageType,
      channel: m.channel
    }));
  },

  // Tek Mesaj Gönder
  async saveMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const { error } = await supabase.from('messages').insert({
      sender: message.sender,
      text: message.text,
      type: message.type,
      channel: message.channel
    });
    if (error) console.error("Error saving message:", error);
  },

  // Realtime Aboneliği Başlat
  subscribeToMessages(callback: (payload: any) => void) {
    return supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => callback(payload)
      )
      .subscribe();
  }
};
