import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  ChatRoom,
  ChatMessage,
  ChatState,
  CreateChatRoomData
} from '../types/chat.types';
import type { Project } from '../types/buildup.types';
import { useBuildupContext } from './BuildupContext';

interface ChatContextType {
  // 채팅방 관리
  chatRooms: Record<string, ChatRoom>;
  activeChatRoom: ChatRoom | null;

  // 프로젝트 기반 채팅방 생성/열기
  createChatRoomForProject: (project: Project) => ChatRoom;
  openChatForProject: (projectId: string) => void;

  // 채팅방 액션
  closeChat: () => void;
  sendMessage: (content: string, attachments?: File[]) => void;
  sendSystemMessage: (roomId: string, message: string, metadata?: any) => void;
  markMessagesAsRead: (roomId: string) => void;

  // 읽지 않은 메시지 관리
  totalUnreadCount: number;
  getUnreadCountByProject: (projectId: string) => number;

  // 채팅방 목록 관리
  getActiveRooms: () => ChatRoom[];
  archiveChatRoom: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Mock 초기 채팅 데이터 - 프로젝트 기반으로 재구성
const initialMockData: Record<string, ChatRoom> = {
  'PRJ-001': {
    id: 'room-PRJ-001',
    projectId: 'PRJ-001',
    projectTitle: 'IR 덱 전문 컨설팅',
    projectPhase: 'design',
    participants: {
      customer: {
        id: 'user-001',
        name: '스타트업 대표',
      },
      pm: {
        id: 'pm-001',
        name: '김수민',
        email: 'kim@pocket.com',
        company: '포켓컴퍼니',
        role: 'Senior PM'
      }
    },
    isOnline: true,
    messages: [
      {
        id: 'msg-1',
        roomId: 'room-PRJ-001',
        senderId: 'pm-001',
        senderType: 'pm',
        content: '안녕하세요! IR 덱 프로젝트 담당 PM 김수민입니다. 프로젝트가 디자인 단계로 진입했습니다.',
        timestamp: new Date(Date.now() - 86400000),
        isRead: true,
        type: 'text'
      },
      {
        id: 'msg-2',
        roomId: 'room-PRJ-001',
        senderId: 'user-001',
        senderType: 'customer',
        content: '디자인 시안은 언제쯤 확인할 수 있을까요?',
        timestamp: new Date(Date.now() - 82800000),
        isRead: true,
        type: 'text'
      },
      {
        id: 'msg-3',
        roomId: 'room-PRJ-001',
        senderId: 'pm-001',
        senderType: 'pm',
        content: '3일 후 가이드미팅 3차에서 최종 검토 예정입니다. 초안은 내일 중으로 공유드리겠습니다.',
        timestamp: new Date(Date.now() - 79200000),
        isRead: true,
        type: 'text'
      },
      {
        id: 'msg-sys-1',
        roomId: 'room-PRJ-001',
        senderId: 'system',
        senderType: 'system',
        content: '프로젝트가 [설계] 단계에서 [디자인] 단계로 전환되었습니다.',
        timestamp: new Date(Date.now() - 172800000),
        isRead: true,
        type: 'system',
        metadata: {
          systemEventType: 'phase_change',
          oldPhase: 'planning',
          newPhase: 'design'
        }
      }
    ],
    unreadCount: 0,
    lastActivity: new Date(Date.now() - 79200000),
    status: 'active',
    createdAt: new Date(Date.now() - 1209600000),
    updatedAt: new Date(Date.now() - 79200000)
  },
  'PRJ-002': {
    id: 'room-PRJ-002',
    projectId: 'PRJ-002',
    projectTitle: 'MVP 개발 프로젝트',
    projectPhase: 'planning',
    participants: {
      customer: {
        id: 'user-001',
        name: '스타트업 대표',
      },
      pm: {
        id: 'pm-002',
        name: '박준영',
        email: 'park@pocket.com',
        company: '포켓컴퍼니',
        role: 'Technical PM'
      }
    },
    isOnline: false,
    messages: [
      {
        id: 'msg-4',
        roomId: 'room-PRJ-002',
        senderId: 'pm-002',
        senderType: 'pm',
        content: 'MVP 개발 프로젝트 담당 PM 박준영입니다. 내일 가이드미팅 1차가 예정되어 있습니다.',
        timestamp: new Date(Date.now() - 3600000),
        isRead: false,
        type: 'text'
      }
    ],
    unreadCount: 1,
    lastActivity: new Date(Date.now() - 3600000),
    status: 'active',
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(Date.now() - 3600000)
  }
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chatRooms, setChatRooms] = useState<Record<string, ChatRoom>>(initialMockData);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);

  const activeChatRoom = activeChatRoomId ? chatRooms[activeChatRoomId] : null;

  // 프로젝트를 위한 채팅방 생성
  const createChatRoomForProject = useCallback((project: Project): ChatRoom => {
    // 이미 채팅방이 있으면 반환
    if (chatRooms[project.id]) {
      return chatRooms[project.id];
    }

    // PM 정보 추출
    const pmInfo = project.team?.pm || {
      id: 'pm-auto',
      name: '담당 PM 배정 중',
      email: 'support@pocket.com',
      company: '포켓컴퍼니',
      role: 'PM'
    };

    // 새 채팅방 생성
    const newRoom: ChatRoom = {
      id: `room-${project.id}`,
      projectId: project.id,
      projectTitle: project.title,
      projectPhase: project.phase || 'contract_pending',
      participants: {
        customer: {
          id: 'user-001',
          name: '고객님',
        },
        pm: {
          id: pmInfo.id,
          name: pmInfo.name,
          email: pmInfo.email,
          company: pmInfo.company || '포켓컴퍼니',
          role: pmInfo.role || 'PM'
        }
      },
      isOnline: true,
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          roomId: `room-${project.id}`,
          senderId: 'system',
          senderType: 'system',
          content: `${project.title} 프로젝트가 시작되었습니다. PM이 곧 연락드릴 예정입니다.`,
          timestamp: new Date(),
          isRead: false,
          type: 'system',
          metadata: {
            systemEventType: 'phase_change',
            newPhase: project.phase
          }
        }
      ],
      unreadCount: 1,
      lastActivity: new Date(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChatRooms(prev => ({
      ...prev,
      [project.id]: newRoom
    }));

    return newRoom;
  }, [chatRooms]);

  // 프로젝트 채팅방 열기
  const openChatForProject = useCallback((projectId: string) => {
    if (chatRooms[projectId]) {
      setActiveChatRoomId(projectId);
      markMessagesAsRead(projectId);
    }
  }, [chatRooms]);

  // 채팅방 닫기
  const closeChat = useCallback(() => {
    setActiveChatRoomId(null);
  }, []);

  // 메시지 전송
  const sendMessage = useCallback((content: string, attachments?: File[]) => {
    if (!activeChatRoomId || !activeChatRoom) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      roomId: activeChatRoom.id,
      senderId: 'user-001',
      senderType: 'customer',
      content,
      timestamp: new Date(),
      isRead: true,
      type: attachments && attachments.length > 0 ? 'file' : 'text',
      attachments: attachments?.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type
      }))
    };

    setChatRooms(prev => ({
      ...prev,
      [activeChatRoomId]: {
        ...prev[activeChatRoomId],
        messages: [...prev[activeChatRoomId].messages, newMessage],
        lastActivity: new Date(),
        updatedAt: new Date()
      }
    }));

    // PM 자동 응답 시뮬레이션
    setTimeout(() => {
      const autoResponse: ChatMessage = {
        id: `msg-auto-${Date.now()}`,
        roomId: activeChatRoom.id,
        senderId: activeChatRoom.participants.pm.id,
        senderType: 'pm',
        content: '메시지 확인했습니다. 곧 답변드리겠습니다.',
        timestamp: new Date(),
        isRead: false,
        type: 'text'
      };

      setChatRooms(prev => ({
        ...prev,
        [activeChatRoomId]: {
          ...prev[activeChatRoomId],
          messages: [...prev[activeChatRoomId].messages, autoResponse],
          unreadCount: prev[activeChatRoomId].unreadCount + 1,
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      }));
    }, 2000);
  }, [activeChatRoomId, activeChatRoom]);

  // 시스템 메시지 전송
  const sendSystemMessage = useCallback((roomId: string, message: string, metadata?: any) => {
    if (!chatRooms[roomId]) return;

    const systemMessage: ChatMessage = {
      id: `msg-sys-${Date.now()}`,
      roomId,
      senderId: 'system',
      senderType: 'system',
      content: message,
      timestamp: new Date(),
      isRead: false,
      type: 'system',
      metadata
    };

    setChatRooms(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        messages: [...prev[roomId].messages, systemMessage],
        unreadCount: prev[roomId].unreadCount + 1,
        lastActivity: new Date(),
        updatedAt: new Date()
      }
    }));
  }, [chatRooms]);

  // 메시지 읽음 처리
  const markMessagesAsRead = useCallback((roomId: string) => {
    setChatRooms(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        messages: prev[roomId].messages.map(msg => ({
          ...msg,
          isRead: true
        })),
        unreadCount: 0,
        updatedAt: new Date()
      }
    }));
  }, []);

  // 전체 읽지 않은 메시지 수
  const totalUnreadCount = Object.values(chatRooms).reduce(
    (sum, room) => sum + room.unreadCount,
    0
  );

  // 프로젝트별 읽지 않은 메시지 수
  const getUnreadCountByProject = useCallback((projectId: string) => {
    return chatRooms[projectId]?.unreadCount || 0;
  }, [chatRooms]);

  // 활성 채팅방 목록 가져오기
  const getActiveRooms = useCallback(() => {
    return Object.values(chatRooms)
      .filter(room => room.status === 'active')
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }, [chatRooms]);

  // 채팅방 아카이브
  const archiveChatRoom = useCallback((roomId: string) => {
    setChatRooms(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        status: 'archived',
        updatedAt: new Date()
      }
    }));
  }, []);

  const value: ChatContextType = {
    chatRooms,
    activeChatRoom,
    createChatRoomForProject,
    openChatForProject,
    closeChat,
    sendMessage,
    sendSystemMessage,
    markMessagesAsRead,
    totalUnreadCount,
    getUnreadCountByProject,
    getActiveRooms,
    archiveChatRoom
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}