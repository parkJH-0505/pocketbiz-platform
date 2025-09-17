import React from 'react';
import { Wrench } from 'lucide-react';

const PocketBuilder = () => {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Wrench className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">포켓 빌더</h1>
              <p className="text-gray-600 mt-1">다음 버전 (현재 버전 미포함)</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="max-w-md mx-auto">
            <Wrench className="w-20 h-20 text-orange-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              추후 구현 계획
            </h2>
            <p className="text-gray-600">
              포켓 빌더 기능은 다음 버전에서 구현될 예정입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PocketBuilder;