import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  ChatRoom,
  ChatMessage,
  ChatState,
  CreateChatRoomData
} from '../types/chat.types';
import type { Project } from '../types/buildup.types';
import { useBuildupContext } from './BuildupContext';
import { defaultBusinessSupportPM } from '../data/mockProjects';
import { useUserProfile } from './UserProfileContext';

interface ChatContextType {
  // 채팅방 관리
  chatRooms: Record<string, ChatRoom>;
  activeChatRoom: ChatRoom | null;

  // 프로젝트 기반 채팅방 생성/열기
  createChatRoomForProject: (project: Project) => ChatRoom;
  openChatForProject: (projectId: string) => void;

  // 이벤트 상담 채팅방 생성/열기
  openEventConsultation: (eventData: any) => void;

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
  const { profile } = useUserProfile();

  const activeChatRoom = activeChatRoomId ? chatRooms[activeChatRoomId] : null;

  // 프로젝트를 위한 채팅방 생성
  const createChatRoomForProject = useCallback((project: Project): ChatRoom => {
    // 이미 채팅방이 있으면 반환
    const existingRoom = chatRooms[project.id];
    if (existingRoom) {
      return existingRoom;
    }

    // 사용자의 전담 빌더 정보 사용, 없으면 기본 경영지원팀
    const assignedBuilder = profile?.basicInfo.assignedBuilder;
    const pmInfo = assignedBuilder ? {
      id: assignedBuilder.id,
      name: assignedBuilder.name,
      email: assignedBuilder.email,
      company: assignedBuilder.company,
      role: assignedBuilder.role
    } : {
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
        },
        // 경영지원팀인 경우 특별한 안내 메시지 추가
        ...(pmInfo.id === defaultBusinessSupportPM.id ? [
          {
            id: `msg-business-support-${Date.now()}`,
            roomId: `room-${project.id}`,
            senderId: pmInfo.id,
            senderType: 'pm' as const,
            content: `안녕하세요! 포켓빌드업 경영지원팀입니다 🙋‍♀️

담당 PM 배정 전까지 프로젝트 시작을 도와드리겠습니다.

🗓️ **가이드 미팅 예약**
아래 예약 폼을 통해 편하신 시간을 선택해주세요!

📍 **미팅 옵션**
• 🎥 온라인 미팅 (Zoom 링크 제공)
• 🏢 오프라인 미팅 (강남역 포켓컴퍼니 사무실)

⏰ **이용 가능 시간**
• 평일 10:00 - 18:00
• 소요시간: 30-60분 (추천: 45분)

💡 **미팅 내용**
✓ 프로젝트 목표 및 범위 확정
✓ 일정 및 마일스톤 계획
✓ 요구사항 상세 논의
✓ 최적 담당 PM 배정

준비가 되시면 아래 폼으로 예약해주세요! 📅`,
            timestamp: new Date(Date.now() + 1000),
            isRead: false,
            type: 'text' as const
          },
          {
            id: `msg-meeting-form-${Date.now()}`,
            roomId: `room-${project.id}`,
            senderId: pmInfo.id,
            senderType: 'pm' as const,
            content: 'meeting_booking_form',
            timestamp: new Date(Date.now() + 2000),
            isRead: false,
            type: 'meeting_form' as const
          }
        ] : [])
      ],
      unreadCount: pmInfo.id === defaultBusinessSupportPM.id ? 3 : 1,
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
  }, [profile]);

  // 메시지 읽음 처리
  const markMessagesAsRead = useCallback((roomId: string) => {
    setChatRooms(prev => {
      const room = prev[roomId];
      if (!room) return prev;

      const updatedMessages = room.messages.map(msg => ({
        ...msg,
        isRead: true
      }));

      return {
        ...prev,
        [roomId]: {
          ...room,
          messages: updatedMessages,
          unreadCount: 0
        }
      };
    });
  }, []);

  // 프로젝트 채팅방 열기
  const openChatForProject = useCallback((projectId: string) => {
    if (chatRooms[projectId]) {
      setActiveChatRoomId(projectId);
      // markMessagesAsRead를 별도로 처리
      setTimeout(() => {
        markMessagesAsRead(projectId);
      }, 100);
    }
  }, [chatRooms, markMessagesAsRead]);

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

  // 이벤트 상담 채팅방 열기
  const openEventConsultation = useCallback((eventData: any) => {
    console.log('Opening event consultation for:', eventData.title);
    const consultationRoomId = 'consultation';

    // 사용자의 전담 빌더 정보
    const assignedBuilder = profile?.basicInfo.assignedBuilder;
    const builderInfo = assignedBuilder || {
      id: 'builder-001',
      name: '김수민',
      email: 'kim@pocket.com',
      company: '포켓컴퍼니',
      role: 'Senior PM'
    };

    // 이벤트 요약 템플릿 생성
    const eventSummary = `📋 **이벤트 상담 요청**

**🏢 이벤트명:** ${eventData.title}

**📅 신청 마감:** ${eventData.applicationEndDate ? new Date(eventData.applicationEndDate).toLocaleDateString('ko-KR') : '미정'}

**🏛 주관기관:** ${eventData.hostOrganization || eventData.vcName || eventData.acceleratorName || '미정'}

**💰 지원 규모:** ${eventData.fundingAmount || eventData.investmentAmount || eventData.supportAmount || '미정'}

**⏰ 수행 기간:** ${eventData.programDuration || eventData.executionPeriod || '미정'}

**📝 설명:** ${eventData.description}

---
위 이벤트에 대해 상담을 요청드립니다. 지원 가능성과 준비 방향에 대해 조언 부탁드려요!`;

    // 상담 채팅방이 없으면 생성
    if (!chatRooms[consultationRoomId]) {
      const consultationRoom: ChatRoom = {
        id: consultationRoomId,
        projectId: consultationRoomId,
        projectTitle: '스마트매칭 상담',
        projectPhase: 'consultation',
        participants: {
          customer: {
            id: 'user-001',
            name: profile?.basicInfo.name || '고객님',
          },
          pm: {
            id: builderInfo.id,
            name: builderInfo.name,
            email: builderInfo.email,
            company: builderInfo.company,
            role: builderInfo.role
          }
        },
        isOnline: true,
        messages: [],
        unreadCount: 0,
        lastActivity: new Date(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setChatRooms(prev => ({
        ...prev,
        [consultationRoomId]: consultationRoom
      }));
    }

    // 이벤트 요약 메시지 자동 전송
    const eventMessage: ChatMessage = {
      id: `msg-event-${Date.now()}`,
      roomId: consultationRoomId,
      senderId: 'user-001',
      senderType: 'customer',
      content: eventSummary,
      timestamp: new Date(),
      isRead: true,
      type: 'text'
    };

    setChatRooms(prev => ({
      ...prev,
      [consultationRoomId]: {
        ...prev[consultationRoomId],
        messages: [...prev[consultationRoomId].messages, eventMessage],
        lastActivity: new Date(),
        updatedAt: new Date()
      }
    }));

    // 채팅방 열기
    setActiveChatRoomId(consultationRoomId);

    // PM 자동 응답 (2초 후)
    setTimeout(() => {
      const autoResponse: ChatMessage = {
        id: `msg-auto-${Date.now()}`,
        roomId: consultationRoomId,
        senderId: builderInfo.id,
        senderType: 'pm',
        content: `안녕하세요! ${eventData.title} 이벤트 상담 요청 확인했습니다. 📋

먼저 이벤트 내용을 검토해보니, 다음 사항들을 점검해보면 좋을 것 같습니다:

🔍 **현재 준비 상황 체크**
• 신청 자격 요건 충족 여부
• 필요 서류 보유 현황
• 팀 구성 및 역량
• 사업계획서 준비 정도

💡 **추천 준비 방향**
현재 KPI 점수를 기반으로 맞춤형 준비 전략을 제안드릴 수 있습니다.

궁금한 점이나 구체적으로 상담받고 싶은 부분이 있으시면 언제든 말씀해주세요! 🙋‍♀️`,
        timestamp: new Date(),
        isRead: false,
        type: 'text'
      };

      setChatRooms(prev => ({
        ...prev,
        [consultationRoomId]: {
          ...prev[consultationRoomId],
          messages: [...prev[consultationRoomId].messages, autoResponse],
          unreadCount: prev[consultationRoomId].unreadCount + 1,
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      }));
    }, 2000);

  }, [profile]);

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
    openEventConsultation,
    closeChat,
    sendMessage,
    sendSystemMessage,
    markMessagesAsRead,
    totalUnreadCount,
    getUnreadCountByProject,
    getActiveRooms,
    archiveChatRoom
  };

  // GlobalContextManager에 등록
  useEffect(() => {
    // Window 객체에 노출
    if (typeof window !== 'undefined') {
      window.chatContext = value;

      // GlobalContextManager에 등록
      import('../utils/globalContextManager').then(({ contextManager }) => {
        contextManager.register('chat', value, {
          name: 'chat',
          version: '1.0.0',
          description: 'Chat and messaging context',
          dependencies: ['user'],
          isReady: true
        });
      }).catch(error => {
        console.warn('GlobalContextManager registration failed:', error);
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.chatContext;
      }
    };
  }, [value]);

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