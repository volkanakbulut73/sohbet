
export enum MessageType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  ACTION = 'ACTION',
  IMAGE = 'IMAGE'
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  type: MessageType;
  channel: string;
}

export interface Channel {
  name: string;
  description: string;
  unreadCount: number;
  users: string[];
  islocked?: boolean;
  ops?: string[];
  bannedusers?: string[];
}

export interface ChatModuleProps {
  externalUser?: string;
  onSendMessage?: (msg: string) => void;
  className?: string;
  embedded?: boolean;
}

export interface UserRegistration {
  id?: string;
  nickname: string;
  fullName: string;
  email: string;
  password?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  // Fix: Added missing security document properties used in registration and admin views
  criminal_record_file?: string;
  insurance_file?: string;
}
