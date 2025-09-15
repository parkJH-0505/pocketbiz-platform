import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Plus, Trash2 } from 'lucide-react';
import type { NotificationSettings, ProgramCategory } from '../../../types/smartMatching';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    channels: {
      email: { enabled: false, address: '' },
      sms: { enabled: false, number: '' }
    },
    quickSettings: {
      newMatches: true,
      deadlineReminders: true,
      weeklyReport: false
    },
    categories: ['government', 'investment'],
    keywords: []
  });

  const [newKeyword, setNewKeyword] = useState('');

  // localStorage에서 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      onClose();
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const handleQuickSettingChange = (key: keyof typeof settings.quickSettings) => {
    setSettings(prev => ({
      ...prev,
      quickSettings: {
        ...prev.quickSettings,
        [key]: !prev.quickSettings[key]
      }
    }));
  };

  const handleChannelChange = (channel: 'email' | 'sms', field: 'enabled' | 'address' | 'number', value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          [field]: value
        }
      }
    }));
  };

  const handleCategoryToggle = (category: ProgramCategory) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !settings.keywords.includes(newKeyword.trim())) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const categoryLabels: Record<ProgramCategory, string> = {
    government: '정부지원사업',
    investment: '투자',
    accelerator: '액셀러레이터',
    'r&d': 'R&D',
    global: '글로벌',
    other: '기타'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">맞춤형 알림 설정</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* 빠른 설정 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">빠른 알림 설정</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">새로운 매칭 기회 알림</label>
                    <p className="text-xs text-gray-500">나에게 맞는 새 프로그램 등록 시</p>
                  </div>
                  <button
                    onClick={() => handleQuickSettingChange('newMatches')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.quickSettings.newMatches ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.quickSettings.newMatches ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">마감 임박 알림</label>
                    <p className="text-xs text-gray-500">D-7, D-3, D-1 알림</p>
                  </div>
                  <button
                    onClick={() => handleQuickSettingChange('deadlineReminders')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.quickSettings.deadlineReminders ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.quickSettings.deadlineReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">진행 상황 주간 리포트</label>
                    <p className="text-xs text-gray-500">매주 월요일 진행 현황 요약</p>
                  </div>
                  <button
                    onClick={() => handleQuickSettingChange('weeklyReport')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.quickSettings.weeklyReport ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.quickSettings.weeklyReport ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 알림 채널 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">알림 받을 방법</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <input
                      type="email"
                      placeholder="email@company.com"
                      value={settings.channels.email.address}
                      onChange={(e) => handleChannelChange('email', 'address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => handleChannelChange('email', 'enabled', !settings.channels.email.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.channels.email.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.channels.email.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={settings.channels.sms.number}
                      onChange={(e) => handleChannelChange('sms', 'number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => handleChannelChange('sms', 'enabled', !settings.channels.sms.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.channels.sms.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.channels.sms.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 관심 분야 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">관심 분야 선택</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(categoryLabels).map(([category, label]) => {
                  const isSelected = settings.categories.includes(category as ProgramCategory);
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category as ProgramCategory)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 커스텀 키워드 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">키워드 알림</h3>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="알림받을 키워드 입력 (예: 헬스케어, AI, 바이오)"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {settings.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {settings.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              알림 설정 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;