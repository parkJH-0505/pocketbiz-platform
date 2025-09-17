import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, Briefcase } from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { activeChatRoom, sendMessage } = useChatContext();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatRoom?.messages]);

  const handleSend = () => {
    if (inputMessage.trim() && activeChatRoom) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  // 채팅방이 없으면 빈 패널
  if (!activeChatRoom) {
    return null;
  }

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Chat Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{activeChatRoom.participants.pm.name}</p>
                  <p className="text-xs text-gray-500">{activeChatRoom.participants.pm.company} • {activeChatRoom.participants.pm.role}</p>
                  <p className="text-xs flex items-center gap-1 mt-0.5">
                    {activeChatRoom.isOnline ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-green-600">온라인</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        <span className="text-gray-500">오프라인</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* 프로젝트 표시 */}
              <div className="mt-3">
                <div className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 inline-flex items-center">
                  <Briefcase className="w-3 h-3 mr-1" />
                  {activeChatRoom.projectTitle}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 180px)' }}>
          {activeChatRoom.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] ${
                  message.senderType === 'customer'
                    ? 'order-2'
                    : 'order-1'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    message.senderType === 'customer'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : message.senderType === 'system'
                      ? 'bg-gray-200 text-gray-700 rounded-lg text-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${
                  message.senderType === 'customer' ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}