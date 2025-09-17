import React from 'react';
import { Bot } from 'lucide-react';

const ConnectAI = () => {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">커넥트AI</h1>
              <p className="text-gray-600 mt-1">AI 기반 연결 서비스</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="max-w-md mx-auto">
            <Bot className="w-20 h-20 text-blue-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              기존 CRM 참조
            </h2>
            <p className="text-gray-600">
              커넥트AI 서비스 콘텐츠는 기존 CRM 시스템을 참조하여 구성됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectAI;