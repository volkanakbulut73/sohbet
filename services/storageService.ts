
import { createClient } from '@supabase/supabase-js';
import { Message, Channel, MessageType, UserRegistration } from '../types';
import { CHAT_MODULE_CONFIG } from '../config';

export const isConfigured = () => 
  CHAT_MODULE_CONFIG.SUPABASE_URL && 
  CHAT_MODULE_CONFIG.SUPABASE_URL.startsWith('https://') && 
  CHAT_MODULE_CONFIG.SUPABASE_KEY &&
  CHAT_MODULE_CONFIG.SUPABASE_KEY.length > 20;

// Initialize Supabase Client
const supabaseUrl = CHAT_MODULE_CONFIG.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = CHAT_MODULE_CONFIG.SUPABASE_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'workigom-chat' },
  },
});

/**
 * Helper to handle fetch errors gracefully
 */
const handleFetchError = (err: any, context: string) => {
  if (!navigator.onLine) {
    throw new Error("İnternet bağlantınız yok. Lütfen bağlantınızı kontrol edin.");
  }
  
  if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
    console.error(`CRITICAL [${context}]: Network error or blocked request. Check Supabase status or adblockers.`);
    throw new Error("Sunucuya ulaşılamıyor. Lütfen internetinizi kontrol edin veya daha sonra tekrar deneyin.");
  }
  
  console.error(`Supabase Error [${context}]:`, err.message || err);
  throw err;
};

export const storageService = {
  isConfigured,

  // --- KAYIT VE KİMLİK DOĞRULAMA ---
  async registerUser(regData: UserRegistration) {
    try {
      const { error } = await supabase.from('registrations').insert({
        nickname: regData.nickname,
        full_name: regData.fullName,
        email: regData.email,
        password: regData.password,
        criminal_record_file: regData.criminal_record_file,
        insurance_file: regData.insurance_file,
        status: 'pending'
      });
      if (error) {
        if (error.code === '23505') throw new Error('Bu email veya nickname zaten kullanımda.');
        throw error;
      }
    } catch (e) {
      handleFetchError(e, 'registerUser');
    }
  },

  async loginUser(email: string, pass: string): Promise<UserRegistration | null> {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('email', email)
        .eq('password', pass)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        fullName: data.full_name
      } as UserRegistration;
    } catch (e) {
      handleFetchError(e, 'loginUser');
      return null;
    }
  },

  // --- ADMIN İŞLEMLERİ ---
  async adminLogin(user: string, pass: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value')
        .in('key', ['admin_username', 'admin_password']);
      
      if (error || !data) return false;
      
      const dbAdmin = data.find(d => d.key === 'admin_username')?.value;
      const dbPass = data.find(d => d.key === 'admin_password')?.value;
      
      return user === dbAdmin && pass === dbPass;
    } catch (e) {
      handleFetchError(e, 'adminLogin');
      return false;
    }
  },

  async getAllRegistrations(): Promise<UserRegistration[]> {
    if (!isConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
           return [];
        }
        throw error;
      }
      
      return (data || []).map(d => ({
        ...d,
        fullName: d.full_name
      })) as UserRegistration[];
    } catch (err) {
      handleFetchError(err, 'getAllRegistrations');
      return [];
    }
  },

  async updateRegistrationStatus(id: string, status: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      handleFetchError(e, 'updateStatus');
    }
  },

  async deleteRegistration(id: string) {
    try {
      const { error } = await supabase.from('registrations').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      handleFetchError(e, 'deleteRegistration');
    }
  },

  // --- PRIVACY: MESAJ SİLME ---
  async deleteMessagesByChannel(channelName: string) {
    if (channelName.startsWith('#')) return;
    try {
      const { error } = await supabase.from('messages').delete().eq('channel', channelName);
      if (error) throw error;
    } catch (e) {
      console.error("Privacy delete error ignored due to background process.");
    }
  },

  async deleteAllPrivateMessagesForUser(nick: string) {
    try {
      await supabase
        .from('messages')
        .delete()
        .or(`channel.ilike.private:%:${nick},channel.ilike.private:${nick}:%,channel.eq.${CHAT_MODULE_CONFIG.BOT_NAME}`);
    } catch (e) {
      console.error("Global privacy cleanup error ignored.");
    }
  },

  // --- BİLDİRİM YÖNETİMİ ---
  async sendChatNotification(channel: string, text: string) {
    try {
      let targetChannels: string[] = [];
      
      if (channel === 'all') {
        const { data: channels } = await supabase.from('channels').select('name');
        targetChannels = (channels || []).map(c => c.name);
        if (targetChannels.length === 0) targetChannels = ['#sohbet'];
      } else {
        targetChannels = [channel];
      }

      const insertData = targetChannels.map(c => ({
        sender: 'SYSTEM',
        text,
        type: MessageType.SYSTEM,
        channel: c
      }));

      const { error: msgError } = await supabase.from('messages').insert(insertData);
      if (msgError) throw msgError;

      await supabase.from('notifications_log').insert({
        type: 'chat',
        target: channel,
        body: text,
        sender_admin: 'WorkigomAdmin'
      });
    } catch (e) {
      handleFetchError(e, 'sendChatNotification');
    }
  },

  async sendEmailNotification(emails: string[], subject: string, body: string) {
    try {
      const logs = emails.map(email => ({
        type: 'email',
        target: email,
        subject,
        body,
        sender_admin: 'WorkigomAdmin'
      }));
      
      const { error } = await supabase.from('notifications_log').insert(logs);
      if (error) throw error;
    } catch (e) {
      handleFetchError(e, 'sendEmailNotification');
    }
  },

  async getNotificationLogs() {
    try {
      const { data, error } = await supabase
        .from('notifications_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    } catch (e) {
      handleFetchError(e, 'getNotificationLogs');
      return [];
    }
  },

  // --- KANAL VE MESAJ YÖNETİMİ ---
  async getChannels(): Promise<Channel[]> {
    try {
      const { data, error } = await supabase.from('channels').select('*');
      if (error) throw error;
      return (data || []).map(c => ({
        ...c,
        unreadCount: 0,
        users: [],
        islocked: c.islocked ?? false,
        ops: c.ops ?? [],
        bannedusers: c.bannedusers ?? []
      })) as Channel[];
    } catch (e) {
      handleFetchError(e, 'getChannels');
      return [];
    }
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
      return (data || []).map(m => ({
        id: m.id.toString(), 
        sender: m.sender, 
        text: m.text, 
        timestamp: new Date(m.created_at), 
        type: m.type as MessageType, 
        channel: m.channel
      }));
    } catch (e) {
      handleFetchError(e, 'getMessagesByChannel');
      return [];
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
    } catch (e) {
      handleFetchError(e, 'saveMessage');
    }
  },

  subscribeToMessages(callback: (payload: any) => void) {
    return supabase
      .channel('messages_realtime_global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => callback(payload))
      .subscribe();
  }
};
