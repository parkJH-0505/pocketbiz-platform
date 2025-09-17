import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Paperclip,
  MoreVertical,
  Minimize2,
  Maximize2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ChatSideModalProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

export default function ChatSideModal({ projectId, projectTitle, onClose }: ChatSideModalProps) {
  const {
    chatRooms,
    sendMessage,
    markMessagesAsRead,
    createChatRoomForProject,
    openChatForProject
  } = useChatContext();

  const [messageInput, setMessageInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 채팅방 가져오기 또는 생성
  const chatRoom = chatRooms[projectId];

  useEffect(() => {
    // 채팅방 활성화 및 메시지 읽음 처리
    if (chatRoom) {
      openChatForProject(projectId);
      markMessagesAsRead(projectId);
    }
  }, [chatRoom, projectId, markMessagesAsRead, openChatForProject]);

  // 메시지 목록 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatRoom?.messages]);

  // 메시지 전송
  const handleSendMessage = () => {
    if (!messageInput.trim() || !chatRoom) return;

    // 현재 활성 채팅방을 이 프로젝트로 설정하고 메시지 전송
    sendMessage(messageInput);
    setMessageInput('');
  };

  // 파일 첨부
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && chatRoom) {
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

  if (!chatRoom) {
    return null;
  }

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* 채팅 모달 */}
      <div className={`fixed right-4 z-50 transition-all duration-300 ${
        isMinimized
          ? 'bottom-4 w-80'
          : 'top-4 bottom-4 w-96'
      }`}>
        <div className="bg-white rounded-xl shadow-2xl flex flex-col h-full overflow-hidden border border-gray-200">
          {/* 헤더 */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h3 className="font-semibold text-sm">{projectTitle}</h3>
                <span className="text-xs opacity-90">
                  {chatRoom.participants.pm.name} PM
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title={isMinimized ? "펼치기" : "최소화"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* 메시지 목록 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {chatRoom.messages.map((message) => {
                  const isCustomer = message.senderType === 'customer';
                  const isSystem = message.senderType === 'system';

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-1.5 rounded-full text-xs">
                          {message.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[80%] ${isCustomer ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* 아바타 */}
                        {!isCustomer && (
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {chatRoom.participants.pm.name[0]}
                            </div>
                          </div>
                        )}

                        {/* 메시지 버블 */}
                        <div className={`group relative ${isCustomer ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm ${
                              isCustomer
                                ? 'bg-blue-500 text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                            }`}
                          >
                            {message.type === 'file' && message.attachments && (
                              <div className="mb-1">
                                {message.attachments.map((file, idx) => (
                                  <div key={idx} className="flex items-center space-x-1">
                                    <Paperclip className="w-3 h-3" />
                                    <span className="text-xs underline">{file.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <span className={`text-[10px] ${isCustomer ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {isCustomer && message.isRead && (
                              <CheckCircle2 className="w-2.5 h-2.5 text-blue-500" />
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
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-4 h-4 text-gray-600" />
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
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className={`p-1.5 rounded-lg transition-all ${
                      messageInput.trim()
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}