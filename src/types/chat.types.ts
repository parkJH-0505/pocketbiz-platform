/**
 * Chat System Types
 * PM 기준 채팅방 구조
 */

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderType: 'customer' | 'pm' | 'system';
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'file' | 'system';
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  metadata?: {
    systemEventType?: 'phase_change' | 'file_upload' | 'meeting_schedule' | 'milestone';
    oldPhase?: string;
    newPhase?: string;
  };
}

export interface ChatRoom {
  id: string;
  projectId: string;  // 프로젝트별 채팅방으로 변경
  projectTitle: string;
  projectPhase: string;
  participants: {
    customer: {
      id: string;
      name: string;
      avatar?: string;
    };
    pm: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      company: string;
      role: string;
    };
  };
  isOnline: boolean;

  // 채팅 상태
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage?: ChatMessage;
  lastActivity: Date;
  status: 'active' | 'archived';

  // 세션 정보
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  rooms: Record<string, ChatRoom>; // projectId를 키로 사용
  activeRoomId: string | null;
  isLoading: boolean;
  error: string | null;
}

// 채팅 이벤트 타입
export type ChatEvent =
  | { type: 'SEND_MESSAGE'; payload: { roomId: string; content: string; attachments?: File[] } }
  | { type: 'RECEIVE_MESSAGE'; payload: ChatMessage }
  | { type: 'MARK_AS_READ'; payload: { roomId: string; messageIds: string[] } }
  | { type: 'OPEN_CHAT'; payload: { projectId: string } }
  | { type: 'CLOSE_CHAT' }
  | { type: 'UPDATE_PM_STATUS'; payload: { pmId: string; isOnline: boolean } }
  | { type: 'SYSTEM_MESSAGE'; payload: { roomId: string; message: string; metadata?: any } };

// 채팅방 생성 데이터
export interface CreateChatRoomData {
  projectId: string;
  projectTitle: string;
  projectPhase: string;
  pm: {
    id: string;
    name: string;
    email: string;
    company: string;
    role: string;
  };
  customer: {
    id: string;
    name: string;
  };
}