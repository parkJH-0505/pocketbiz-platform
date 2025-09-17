import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send,
  Paperclip,
  Search,
  ChevronLeft,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  MoreVertical,
  FileText,
  Calendar,
  Briefcase,
  MessageSquare
} from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useProjectChatIntegration } from '../../hooks/useProjectChatIntegration';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PHASE_INFO } from '../../utils/projectPhaseUtils';
import MeetingBookingForm, { type MeetingBookingData } from '../../components/chat/MeetingBookingForm';

export default function Messages() {
  const {
    chatRooms,
    activeChatRoom,
    openChatForProject,
    closeChat,
    sendMessage,
    markMessagesAsRead,
    totalUnreadCount,
    getActiveRooms,
    archiveChatRoom
  } = useChatContext();

  const { projects } = useBuildupContext();
  useProjectChatIntegration();
  const location = useLocation();

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // BuildupDashboard에서 전달받은 프로젝트 ID로 자동 채팅방 열기
  useEffect(() => {
    const openProjectId = location.state?.openProjectId;
    if (openProjectId) {
      openChatForProject(openProjectId);
      // state 초기화
      window.history.replaceState({}, document.title);
    }
  }, [location.state, openChatForProject]);

  // 활성 채팅방 목록
  const activeRooms = getActiveRooms();

  // 메시지 목록 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatRoom?.messages]);

  // 메시지 전송
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput('');
  };

  // 파일 첨부
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      sendMessage(`파일을 전송했습니다: ${files[0].name}`, Array.from(files));
    }
  };

  // 메시지 시간 포맷
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return formatDistanceToNow(messageDate, { addSuffix: true, locale: ko });
    } else {
      return messageDate.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // 프로젝트 상태 배지
  const getPhaseColor = (phase: string) => {
    return PHASE_INFO[phase]?.color || 'text-gray-600';
  };

  const getPhaseBgColor = (phase: string) => {
    return PHASE_INFO[phase]?.bgColor || 'bg-gray-100';
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-gray-50">
      {/* 채팅방 목록 (좌측) */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">메시지</h2>
              {totalUnreadCount > 0 && (
                <p className="text-sm text-blue-600">읽지 않은 메시지 {totalUnreadCount}개</p>
              )}
            </div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="보관함"
            >
              <Archive className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="프로젝트 또는 PM 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 채팅방 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {activeRooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">진행중인 프로젝트가 없습니다</p>
            </div>
          ) : (
            activeRooms.map((room) => {
              const isActive = activeChatRoom?.id === room.id;
              const lastMessage = room.messages[room.messages.length - 1];

              return (
                <button
                  key={room.id}
                  onClick={() => openChatForProject(room.projectId)}
                  className={`w-full p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                    isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* PM 아바타 */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {room.participants.pm.name[0]}
                      </div>
                    </div>

                    {/* 채팅 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {room.projectTitle}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPhaseBgColor(room.projectPhase)} ${getPhaseColor(room.projectPhase)}`}>
                              {PHASE_INFO[room.projectPhase]?.shortLabel}
                            </span>
                            <span className="text-xs text-gray-500">
                              {room.participants.pm.name} PM
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {room.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                              {room.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {lastMessage && formatMessageTime(lastMessage.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* 마지막 메시지 */}
                      {lastMessage && (
                        <p className="mt-1 text-sm text-gray-600 truncate">
                          {lastMessage.senderType === 'system' ? (
                            <span className="italic">📢 {lastMessage.content}</span>
                          ) : lastMessage.senderType === 'customer' ? (
                            <span>나: {lastMessage.content}</span>
                          ) : (
                            lastMessage.content
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 채팅창 (우측) */}
      {activeChatRoom ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* 채팅 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={closeChat}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {activeChatRoom.projectTitle}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPhaseBgColor(activeChatRoom.projectPhase)} ${getPhaseColor(activeChatRoom.projectPhase)}`}>
                      {PHASE_INFO[activeChatRoom.projectPhase]?.label}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${activeChatRoom.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-600">
                        {activeChatRoom.participants.pm.name} PM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => archiveChatRoom(activeChatRoom.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Archive className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {activeChatRoom.messages.map((message, index) => {
              const isCustomer = message.senderType === 'customer';
              const isSystem = message.senderType === 'system';

              if (isSystem) {
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm">
                      {message.content}
                    </div>
                  </div>
                );
              }

              // 미팅 예약 폼 메시지 처리
              if (message.type === 'meeting_form') {
                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-lg">
                      {/* PM 아바타 */}
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {activeChatRoom.participants.pm.name[0]}
                        </div>
                      </div>

                      {/* 미팅 예약 폼 */}
                      <div className="flex flex-col">
                        <MeetingBookingForm
                          onSubmit={(formData: MeetingBookingData) => {
                            // 미팅 예약 요청 메시지 전송
                            const meetingRequest = `📅 미팅 예약 요청

날짜: ${formData.date}
시간: ${formData.time}
소요시간: ${formData.duration}분
방식: ${formData.type === 'online' ? '온라인 (Zoom)' : '오프라인 (강남 사무실)'}
${formData.notes ? `\n추가 요청사항: ${formData.notes}` : ''}

검토 후 확정된 일정을 안내드리겠습니다.`;

                            sendMessage(meetingRequest);
                          }}
                        />
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-400">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-md ${isCustomer ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* 아바타 */}
                    {!isCustomer && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {activeChatRoom.participants.pm.name[0]}
                        </div>
                      </div>
                    )}

                    {/* 메시지 버블 */}
                    <div className={`group relative ${isCustomer ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isCustomer
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        {message.type === 'file' && message.attachments && (
                          <div className="mb-2">
                            {message.attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center space-x-2 mb-1">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm underline">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs ${isCustomer ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {isCustomer && message.isRead && (
                          <CheckCircle2 className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* 메시지 입력 */}
          <div className="px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Paperclip className="h-5 w-5 text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileAttachment}
                className="hidden"
                multiple
              />
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className={`p-2 rounded-lg transition-all ${
                  messageInput.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              메시지를 선택하세요
            </h3>
            <p className="text-sm text-gray-600">
              좌측에서 프로젝트를 선택하여 대화를 시작하세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}