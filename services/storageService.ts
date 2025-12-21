
import { createClient } from '@supabase/supabase-js';
import { Message, Channel, MessageType } from '../types';

/**
 * ÖNEMLİ: Supabase panelinizden (Settings -> API) aldığınız değerleri buraya yapıştırın.
 * Eğer bu değerler 'your-project' olarak kalırsa uygulama hata modunda çalışacaktır.
 */
const SUPABASE_URL = 'https://your-project.supabase.co'; 
const SUPABASE_ANON_KEY = 'your-anon-key';

export const isConfigured = () => 
  SUPABASE_URL.includes('supabase.co') && 
  !SUPABASE_URL.includes('your-project') &&
  SUPABASE_ANON_KEY !== 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const storageService = {
  // Kanalları Getir
  async getChannels(): Promise<Channel[]> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*');
      
      if (error) {
        throw error;
      }
      return data as Channel[];
    } catch (err: any) {
      console.error("Supabase error fetching channels:", err.message || err);
      return [];
    }
  },

  // Yeni Kanal Oluştur
  async createChannel(channel: Channel) {
    try {
      const { error } = await supabase.from('channels').upsert({
        name: channel.name,
        description: channel.description,
        users: channel.users
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Error creating channel:", err.message);
    }
  },

  // Mesajları Getir
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
      console.error("Supabase error fetching messages:", err.message);
      return [];
    }
  },

  // Tek Mesaj Gönder
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
      console.error("Error saving message:", err.message);
    }
  },

  // Realtime Aboneliği
  subscribeToMessages(callback: (payload: any) => void) {
    return supabase
      .channel('any')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => callback(payload)
      )
      .subscribe();
  }
};
