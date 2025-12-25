
import { createClient } from '@supabase/supabase-js';
import { Message, Channel, MessageType, UserRegistration } from '../types';
import { CHAT_MODULE_CONFIG } from '../config';

export const isConfigured = () => 
  CHAT_MODULE_CONFIG.SUPABASE_URL.startsWith('https://') && 
  CHAT_MODULE_CONFIG.SUPABASE_KEY.length > 20;

export const supabase = createClient(CHAT_MODULE_CONFIG.SUPABASE_URL, CHAT_MODULE_CONFIG.SUPABASE_KEY);

export const storageService = {
  // --- KAYIT VE KİMLİK DOĞRULAMA ---
  async registerUser(regData: UserRegistration) {
    const { error } = await supabase.from('registrations').insert({
      nickname: regData.nickname,
      email: regData.email,
      password: regData.password,
      criminal_record_file: regData.criminal_record_file,
      insurance_file: regData.insurance_file,
      status: 'pending'
    });
    if (error) {
      console.error("Supabase Error:", error);
      if (error.code === '23505') throw new Error('Bu email veya nickname zaten kullanımda.');
      if (error.message.includes('not found')) throw new Error('Veritabanı tabloları henüz oluşturulmamış. Lütfen SQL kurulumunu yapın.');
      throw error;
    }
  },

  async loginUser(email: string, pass: string): Promise<UserRegistration | null> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('email', email)
      .eq('password', pass)
      .maybeSingle();
    
    if (error) {
      console.error("Login Error:", error);
      throw error;
    }
    return data as UserRegistration | null;
  },

  // --- KANAL VE MESAJ YÖNETİMİ ---
  async getChannels(): Promise<Channel[]> {
    const { data, error } = await supabase.from('channels').select('*');
    if (error) throw error;
    return (data || []).map(c => ({
      ...c,
      islocked: c.islocked ?? false,
      ops: c.ops ?? [],
      bannedusers: c.bannedusers ?? []
    })) as Channel[];
  },

  async getMessagesByChannel(channelName: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel', channelName)
      .order('created_at', { ascending: true })
      .limit(100);
      
    if (error) throw error;
    return (data || []).map(m => ({
      id: m.id.toString(), 
      sender: m.sender, 
      text: m.text, 
      timestamp: new Date(m.created_at), 
      type: m.type as MessageType, 
      channel: m.channel
    }));
  },

  async saveMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const { error } = await supabase.from('messages').insert({
      sender: message.sender, 
      text: message.text, 
      type: message.type, 
      channel: message.channel
    });
    if (error) throw error;
  },

  subscribeToMessages(callback: (payload: any) => void) {
    return supabase
      .channel('messages_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => callback(payload))
      .subscribe();
  }
};
