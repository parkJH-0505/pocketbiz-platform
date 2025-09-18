import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  Copy,
  ExternalLink,
  Edit3,
  Check,
  X,
  Plus,
  Eye,
  EyeOff,
  Building,
  Clock,
  Calendar
} from 'lucide-react';

interface ContactMethod {
  id: string;
  type: 'email' | 'phone' | 'address' | 'website' | 'social';
  platform?: 'linkedin' | 'twitter' | 'github' | 'facebook' | 'instagram' | 'youtube';
  label: string;
  value: string;
  isPublic?: boolean;
  isPrimary?: boolean;
  description?: string;
}

interface OfficeHours {
  day: string;
  open: string;
  close: string;
  isClosed?: boolean;
}

interface ContactInfoProps {
  viewMode: 'public' | 'investors' | 'team' | 'private';
  isEditing?: boolean;
}

const ContactInfo: React.FC<ContactInfoProps> = ({ viewMode, isEditing = false }) => {
  const [localEditing, setLocalEditing] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // 연락처 정보
  const [contacts, setContacts] = useState<ContactMethod[]>([
    {
      id: '1',
      type: 'email',
      label: '대표 이메일',
      value: 'contact@company.com',
      isPublic: true,
      isPrimary: true,
      description: '일반 문의 및 비즈니스 제안'
    },
    {
      id: '2',
      type: 'email',
      label: '투자 문의',
      value: 'investment@company.com',
      isPublic: false,
      description: '투자 관련 문의 전용'
    },
    {
      id: '3',
      type: 'phone',
      label: '대표 전화',
      value: '+82-2-1234-5678',
      isPublic: true,
      isPrimary: true
    },
    {
      id: '4',
      type: 'address',
      label: '본사 주소',
      value: '서울특별시 강남구 테헤란로 427, 위워크타워 15층',
      isPublic: true,
      isPrimary: true
    },
    {
      id: '5',
      type: 'website',
      label: '홈페이지',
      value: 'https://www.company.com',
      isPublic: true,
      isPrimary: true
    },
    {
      id: '6',
      type: 'social',
      platform: 'linkedin',
      label: 'LinkedIn',
      value: 'https://linkedin.com/company/ourcompany',
      isPublic: true
    },
    {
      id: '7',
      type: 'social',
      platform: 'twitter',
      label: 'Twitter',
      value: 'https://twitter.com/ourcompany',
      isPublic: true
    }
  ]);

  // 운영 시간
  const [officeHours] = useState<OfficeHours[]>([
    { day: '월요일', open: '09:00', close: '18:00' },
    { day: '화요일', open: '09:00', close: '18:00' },
    { day: '수요일', open: '09:00', close: '18:00' },
    { day: '목요일', open: '09:00', close: '18:00' },
    { day: '금요일', open: '09:00', close: '18:00' },
    { day: '토요일', open: '', close: '', isClosed: true },
    { day: '일요일', open: '', close: '', isClosed: true }
  ]);

  const [newContact, setNewContact] = useState<Partial<ContactMethod>>({
    type: 'email',
    label: '',
    value: '',
    isPublic: true
  });

  // 아이콘 매핑
  const getContactIcon = (contact: ContactMethod) => {
    if (contact.type === 'email') return Mail;
    if (contact.type === 'phone') return Phone;
    if (contact.type === 'address') return MapPin;
    if (contact.type === 'website') return Globe;
    if (contact.type === 'social') {
      const socialIcons = {
        linkedin: Linkedin,
        twitter: Twitter,
        github: Github,
        facebook: Facebook,
        instagram: Instagram,
        youtube: Youtube
      };
      return socialIcons[contact.platform!] || MessageCircle;
    }
    return MessageCircle;
  };

  // 보기 모드별 필터링
  const getVisibleContacts = () => {
    if (viewMode === 'private' || viewMode === 'team') {
      return contacts;
    }
    return contacts.filter(contact => contact.isPublic);
  };

  const visibleContacts = getVisibleContacts();

  // 복사 기능
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 연락처 추가
  const handleAddContact = () => {
    if (newContact.label && newContact.value) {
      const contact: ContactMethod = {
        id: Date.now().toString(),
        type: newContact.type as ContactMethod['type'],
        platform: newContact.platform as any,
        label: newContact.label,
        value: newContact.value,
        isPublic: newContact.isPublic,
        description: newContact.description
      };
      setContacts([...contacts, contact]);
      setNewContact({
        type: 'email',
        label: '',
        value: '',
        isPublic: true
      });
      setShowAddContact(false);
    }
  };

  // 연락처 삭제
  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  // 링크 열기
  const handleOpenLink = (value: string, type: string) => {
    if (type === 'email') {
      window.open(`mailto:${value}`);
    } else if (type === 'phone') {
      window.open(`tel:${value}`);
    } else if (type === 'website' || type === 'social') {
      window.open(value, '_blank');
    } else if (type === 'address') {
      window.open(`https://maps.google.com?q=${encodeURIComponent(value)}`, '_blank');
    }
  };

  // 현재 시간 기준으로 운영 상태 확인
  const getCurrentOperatingStatus = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = 일요일
    const dayMapping = [6, 0, 1, 2, 3, 4, 5]; // 일~토 -> 월~일 순서로 변환
    const todayHours = officeHours[dayMapping[currentDay]];

    if (todayHours.isClosed) {
      return { status: '휴무', color: 'text-gray-500' };
    }

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    if (currentTime >= openTime && currentTime <= closeTime) {
      return { status: '운영중', color: 'text-green-600' };
    } else {
      return { status: '운영종료', color: 'text-red-600' };
    }
  };

  const operatingStatus = getCurrentOperatingStatus();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">연락처 정보</h3>
              <p className="text-sm text-gray-600">
                {visibleContacts.length}개 연락 방법 ·
                <span className={`ml-1 font-medium ${operatingStatus.color}`}>
                  {operatingStatus.status}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {localEditing && (
              <button
                onClick={() => setShowAddContact(true)}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            )}
            {localEditing ? (
              <button
                onClick={() => setLocalEditing(false)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setLocalEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 주요 연락처 */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" />
              연락처
            </h4>

            <div className="space-y-3">
              {visibleContacts.map((contact) => {
                const Icon = getContactIcon(contact);
                const isPrimary = contact.isPrimary;

                return (
                  <div
                    key={contact.id}
                    className={`group p-4 rounded-lg border transition-all hover:shadow-sm ${
                      isPrimary ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isPrimary ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {contact.label}
                            </span>
                            {isPrimary && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                주요
                              </span>
                            )}
                            {!contact.isPublic && (
                              <EyeOff className="w-3 h-3 text-gray-400" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600 truncate">
                              {contact.value}
                            </span>
                            {contact.description && (
                              <span className="text-xs text-gray-500 hidden sm:inline">
                                · {contact.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼들 */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(contact.value, contact.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="복사"
                        >
                          {copiedItem === contact.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenLink(contact.value, contact.type)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="열기"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        {localEditing && (
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="삭제"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {visibleContacts.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">표시할 연락처가 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* 운영 시간 */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                운영 시간
              </h4>

              <div className="space-y-2">
                {officeHours.map((hours, index) => (
                  <div key={index} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-600">{hours.day}</span>
                    <span className={`font-medium ${
                      hours.isClosed ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {hours.isClosed ? '휴무' : `${hours.open} - ${hours.close}`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">현재 상태:</span>
                  <span className={`font-medium ${operatingStatus.color}`}>
                    {operatingStatus.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 소셜 미디어 */}
            {visibleContacts.filter(c => c.type === 'social').length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">소셜 미디어</h4>
                <div className="space-y-2">
                  {visibleContacts
                    .filter(c => c.type === 'social')
                    .map((contact) => {
                      const Icon = getContactIcon(contact);
                      return (
                        <button
                          key={contact.id}
                          onClick={() => handleOpenLink(contact.value, contact.type)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                        >
                          <Icon className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {contact.label}
                          </span>
                          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 연락처 추가 모달 */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 연락처 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                <select
                  value={newContact.type}
                  onChange={(e) => setNewContact({ ...newContact, type: e.target.value as ContactMethod['type'] })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="email">이메일</option>
                  <option value="phone">전화번호</option>
                  <option value="address">주소</option>
                  <option value="website">웹사이트</option>
                  <option value="social">소셜 미디어</option>
                </select>
              </div>

              {newContact.type === 'social' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼</label>
                  <select
                    value={newContact.platform || ''}
                    onChange={(e) => setNewContact({ ...newContact, platform: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                    <option value="github">GitHub</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">라벨 *</label>
                <input
                  type="text"
                  value={newContact.label}
                  onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="예: 대표 이메일"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">값 *</label>
                <input
                  type="text"
                  value={newContact.value}
                  onChange={(e) => setNewContact({ ...newContact, value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="예: contact@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input
                  type="text"
                  value={newContact.description || ''}
                  onChange={(e) => setNewContact({ ...newContact, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="예: 일반 문의용"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newContact.isPublic}
                  onChange={(e) => setNewContact({ ...newContact, isPublic: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  공개 표시
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleAddContact}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowAddContact(false);
                  setNewContact({
                    type: 'email',
                    label: '',
                    value: '',
                    isPublic: true
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInfo;