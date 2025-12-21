
export enum MessageType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  AI = 'AI',
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
}

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  addedBy: string;
}

export interface RadioState {
  currentUrl: string;
  isPlaying: boolean;
  playlist: PlaylistItem[];
}

export interface ChatModuleProps {
  externalUser?: string;
  onSendMessage?: (msg: string) => void;
  className?: string;
}
