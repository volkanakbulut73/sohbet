
export enum MessageType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  AI = 'AI',
  ACTION = 'ACTION'
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
}

export interface ChatModuleProps {
  externalUser?: string;
  onSendMessage?: (msg: string) => void;
  className?: string;
}
