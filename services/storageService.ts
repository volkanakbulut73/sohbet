
import { createClient } from '@supabase/supabase-js';
import { Message, Channel, MessageType } from '../types';
import { CHAT_MODULE_CONFIG } from '../config';

export const isConfigured = () => 
  CHAT_MODULE_CONFIG.SUPABASE_URL.startsWith('https://') && 
  CHAT_MODULE_CONFIG.SUPABASE_KEY.length > 20;

export const supabase = createClient(CHAT_MODULE_CONFIG.SUPABASE_URL, CHAT_MODULE_CONFIG.SUPABASE_KEY);

export const storageService = {
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

  async getModuleVersion(): Promise<string> {
    try {
      const { data } = await supabase.from('system_config').select('value').eq('key', 'min_client_version').single();
      return data?.value || CHAT_MODULE_CONFIG.VERSION;
    } catch {
      return CHAT_MODULE_CONFIG.VERSION;
    }
  },

  async createChannel(channel: Channel) {
    const { error } = await supabase.from('channels').upsert({
      name: channel.name,
      description: channel.description,
      users: channel.users,
      islocked: false,
      ops: [],
      bannedusers: []
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
    return (data || []).map(m => ({
      id: m.id, sender: m.sender, text: m.text, timestamp: new Date(m.created_at), type: m.type as MessageType, channel: m.channel
    }));
  },

  async saveMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const { error } = await supabase.from('messages').insert({
      sender: message.sender, text: message.text, type: message.type, channel: message.channel
    });
    if (error) throw error;
  },

  // --- ENGELLEME VE AYARLAR ---
  async addBlock(blocker: string, blocked: string) {
    const { error } = await supabase.from('user_blocks').upsert({ blocker, blocked });
    if (error) throw error;
  },

  async removeBlock(blocker: string, blocked: string) {
    const { error } = await supabase.from('user_blocks').delete().match({ blocker, blocked });
    if (error) throw error;
  },

  async checkIsBlocked(blocker: string, blocked: string): Promise<boolean> {
    const { data, error } = await supabase.from('user_blocks').select('id').match({ blocker, blocked }).maybeSingle();
    if (error) return false;
    return !!data;
  },

  async getUserSettings(username: string) {
    const { data, error } = await supabase.from('user_settings').select('*').eq('username', username).maybeSingle();
    if (error) return { allow_private: true };
    return data || { allow_private: true };
  },

  async updateUserSettings(username: string, allow_private: boolean) {
    const { error } = await supabase.from('user_settings').upsert({ username, allow_private, updated_at: new Date() });
    if (error) throw error;
  },

  subscribeToMessages(callback: (payload: any) => void) {
    return supabase.channel('messages_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => callback(payload)).subscribe();
  },

  subscribeToChannels(callback: (payload: any) => void) {
    return supabase.channel('channels_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, (payload) => callback(payload)).subscribe();
  }
};
