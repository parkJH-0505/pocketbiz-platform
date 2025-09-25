import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Calendar,
  Clock,
  Eye,
  Shield,
  Link2,
  Copy,
  Check,
  AlertCircle,
  Users,
  FileText,
  ChevronDown,
  Settings,
  Mail,
  Plus,
  Trash2,
  Send,
  FileSignature,
  ScrollText
} from 'lucide-react';
import type { VDRDocument } from '../../contexts/VDRContext';

interface ShareSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocuments: VDRDocument[];
  onCreateSession: (name: string, documents: string[], expiresAt?: Date) => Promise<string>;
}

const ShareSessionModal: React.FC<ShareSessionModalProps> = ({
  isOpen,
  onClose,
  selectedDocuments,
  onCreateSession
}) => {
  const [sessionName, setSessionName] = useState('');
  const [description, setDescription] = useState('');
  const [expiryType, setExpiryType] = useState<'7days' | '30days' | 'custom' | 'never'>('7days');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('23:59');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [accessLevel, setAccessLevel] = useState<'view' | 'download'>('view');
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 🚀 Docsend 이메일 초대 관련 상태
  const [inviteMode, setInviteMode] = useState<'link' | 'email'>('link');
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [requireEmailAuth, setRequireEmailAuth] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [advancedTab, setAdvancedTab] = useState<'access' | 'security' | 'branding'>('access');

  // 🛡️ Docsend 고급 보안 설정 상태
  const [downloadBlocked, setDownloadBlocked] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [viewLimit, setViewLimit] = useState<number | undefined>();
  const [ipRestrictions, setIpRestrictions] = useState<string[]>([]);
  const [ipInput, setIpInput] = useState('');

  // 🎨 브랜딩 커스터마이징 상태
  const [customBranding, setCustomBranding] = useState({
    logoUrl: '',
    primaryColor: '#3B82F6',
    companyName: ''
  });

  // 📝 NDA 설정 상태
  const [ndaRequired, setNdaRequired] = useState(false);
  const [selectedNdaTemplate, setSelectedNdaTemplate] = useState<string>('standard');
  const [ndaDeadline, setNdaDeadline] = useState<'7days' | '30days' | 'custom' | 'none'>('7days');
  const [customNdaDeadline, setCustomNdaDeadline] = useState('');
  const [ndaCustomMessage, setNdaCustomMessage] = useState('');

  // 초기화
  useEffect(() => {
    if (isOpen) {
      const allDocIds = selectedDocuments.map(doc => doc.id);
      setSelectedDocs(new Set(allDocIds));
      setSessionName(`공유함 - ${new Date().toLocaleDateString('ko-KR')}`);
      setShareLink('');
      setCopied(false);
      setIsCreating(false);
    }
  }, [isOpen, selectedDocuments]);

  // shareLink 상태 변화 감지
  useEffect(() => {
    console.log('[ShareModal] ShareLink state changed:', shareLink);
  }, [shareLink]);

  const handleDocumentToggle = (docId: string) => {
    const newSelection = new Set(selectedDocs);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocs(newSelection);
  };

  // 🚀 이메일 초대 헬퍼 함수들
  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && isValidEmail(email) && !inviteEmails.includes(email)) {
      setInviteEmails([...inviteEmails, email]);
      setEmailInput('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setInviteEmails(inviteEmails.filter(email => email !== emailToRemove));
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
  };

  // 🛡️ 보안 설정 헬퍼 함수들
  const addIpRestriction = () => {
    const ip = ipInput.trim();
    if (ip && isValidIpOrCidr(ip) && !ipRestrictions.includes(ip)) {
      setIpRestrictions([...ipRestrictions, ip]);
      setIpInput('');
    }
  };

  const removeIpRestriction = (ipToRemove: string) => {
    setIpRestrictions(ipRestrictions.filter(ip => ip !== ipToRemove));
  };

  const isValidIpOrCidr = (ip: string): boolean => {
    // 간단한 IP/CIDR 유효성 검증 (실제로는 더 정교한 검증 필요)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    return ipv4Regex.test(ip);
  };

  const handleIpKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIpRestriction();
    }
  };

  // 워터마크 텍스트 기본값 설정
  const getDefaultWatermarkText = () => {
    return customBranding.companyName || '기밀 문서';
  };

  const getExpiryDate = (): Date | undefined => {
    const now = new Date();
    switch (expiryType) {
      case '7days':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'custom':
        if (customDate) {
          const [year, month, day] = customDate.split('-').map(Number);
          const [hours, minutes] = customTime.split(':').map(Number);
          return new Date(year, month - 1, day, hours, minutes);
        }
        return undefined;
      case 'never':
        return undefined;
      default:
        return undefined;
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim() || selectedDocs.size === 0) {
      console.warn('[ShareModal] Cannot create session - missing name or docs');
      return;
    }

    console.log('[ShareModal] Creating session with:', {
      name: sessionName.trim(),
      documents: Array.from(selectedDocs),
      expiresAt: getExpiryDate()
    });

    setIsCreating(true);
    try {
      const expiresAt = getExpiryDate();

      const link = await onCreateSession(
        sessionName.trim(),
        Array.from(selectedDocs),
        expiresAt
      );

      console.log('[ShareModal] Received link from onCreateSession:', link);

      if (link && typeof link === 'string' && link.length > 0) {
        setShareLink(link);
        console.log('[ShareModal] ShareLink state updated to:', link);
      } else {
        console.error('[ShareModal] Invalid link received:', link);
        alert('공유 링크 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('[ShareModal] Failed to create share session:', error);
      alert(`공유 세션 생성 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">공유함 생성</h2>
              <p className="text-sm text-gray-500">선택한 문서를 안전하게 공유하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex overflow-hidden">
          {/* 왼쪽: 문서 선택 */}
          <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto max-h-[60vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">공유할 문서</h3>
              <span className="text-sm text-gray-500">
                {selectedDocs.size}개 선택됨
              </span>
            </div>

            <div className="space-y-2">
              {selectedDocuments.map(doc => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedDocs.has(doc.id)
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleDocumentToggle(doc.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.id)}
                      onChange={() => handleDocumentToggle(doc.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString('ko-KR')}</span>
                        {doc.projectName && (
                          <>
                            <span>•</span>
                            <span className="truncate">{doc.projectName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 공유 설정 */}
          <div className="w-1/2 p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  공유함 이름 *
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="예: 포켓전자 IR 자료 - YS캐피탈"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명 (선택사항)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="공유 목적이나 추가 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* 🚀 공유 방식 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  공유 방식
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInviteMode('link')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                      inviteMode === 'link'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                    링크 공유
                  </button>
                  <button
                    onClick={() => setInviteMode('email')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                      inviteMode === 'email'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    이메일 초대
                  </button>
                </div>
                {inviteMode === 'email' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      선택한 이메일로 직접 초대장을 발송합니다. 이메일 인증을 통해 더 안전하게 공유할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>

              {/* 🚀 이메일 초대 설정 */}
              {inviteMode === 'email' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  {/* 이메일 주소 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      초대할 이메일 주소
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyPress={handleEmailKeyPress}
                        placeholder="example@company.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={addEmail}
                        disabled={!emailInput.trim() || !isValidEmail(emailInput.trim())}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter 또는 쉼표(,)로 구분하여 여러 이메일을 추가할 수 있습니다
                    </p>
                  </div>

                  {/* 추가된 이메일 목록 */}
                  {inviteEmails.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        초대 목록 ({inviteEmails.length}명)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {inviteEmails.map((email, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            <span>{email}</span>
                            <button
                              onClick={() => removeEmail(email)}
                              className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 이메일 커스터마이징 */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이메일 제목
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder={`${sessionName} - 문서 공유`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        개인 메시지 (선택사항)
                      </label>
                      <textarea
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder="초대받는 분에게 전할 메시지를 입력하세요"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* 이메일 인증 필수 */}
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={requireEmailAuth}
                        onChange={(e) => setRequireEmailAuth(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">이메일 인증 필수</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">
                      활성화하면 초대받은 이메일로만 접근할 수 있습니다 (더 안전)
                    </p>
                  </div>
                </div>
              )}

              {/* 만료 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  만료 기간
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { value: '7days', label: '7일' },
                    { value: '30days', label: '30일' },
                    { value: 'custom', label: '직접 설정' },
                    { value: 'never', label: '무제한' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setExpiryType(option.value as any)}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        expiryType === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {expiryType === 'custom' && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* 🚀 Docsend 고급 설정 - 탭 구조 */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Settings className="w-4 h-4" />
                  고급 설정
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                    {/* 탭 네비게이션 */}
                    <div className="flex border-b border-gray-200 mb-4">
                      {[
                        { key: 'access', label: '접근 권한', icon: Eye },
                        { key: 'security', label: '보안 설정', icon: Shield },
                        { key: 'branding', label: '브랜딩', icon: Settings }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setAdvancedTab(tab.key as any)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            advancedTab === tab.key
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* 탭 컨텐츠 */}
                    <div className="space-y-4">
                      {/* 접근 권한 탭 */}
                      {advancedTab === 'access' && (
                        <div className="space-y-4">
                          {/* 접근 권한 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Eye className="w-4 h-4 inline mr-1" />
                              문서 접근 권한
                            </label>
                            <div className="flex gap-2">
                              {[
                                { value: 'view', label: '보기만', icon: Eye },
                                { value: 'download', label: '다운로드 허용', icon: FileText }
                              ].map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => setAccessLevel(option.value as any)}
                                  className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm rounded-lg border transition-colors ${
                                    accessLevel === option.value
                                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  <option.icon className="w-4 h-4" />
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 비밀번호 보호 */}
                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={requirePassword}
                                onChange={(e) => setRequirePassword(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <Shield className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">비밀번호 보호</span>
                            </label>
                            {requirePassword && (
                              <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="접근 비밀번호 설정"
                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}
                          </div>

                          {/* 이메일 인증 필수 (이메일 모드일 때만) */}
                          {inviteMode === 'email' && (
                            <div>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={requireEmailAuth}
                                  onChange={(e) => setRequireEmailAuth(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">이메일 인증 필수</span>
                              </label>
                              <p className="text-xs text-gray-500 ml-6">
                                초대받은 이메일로만 접근 가능 (더 안전)
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 보안 설정 탭 */}
                      {advancedTab === 'security' && (
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600 mb-3">
                            <Shield className="w-4 h-4 inline mr-1" />
                            Docsend 수준의 고급 보안 기능을 설정하세요
                          </div>

                          {/* 🚀 워터마크 설정 */}
                          <div className="space-y-3">
                            <div>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={watermarkEnabled}
                                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">워터마크 표시</span>
                              </label>
                              <p className="text-xs text-gray-500 ml-6">
                                문서에 사용자 정보나 회사명을 워터마크로 표시합니다
                              </p>
                            </div>

                            {watermarkEnabled && (
                              <div className="ml-6 space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    워터마크 텍스트
                                  </label>
                                  <input
                                    type="text"
                                    value={watermarkText}
                                    onChange={(e) => setWatermarkText(e.target.value)}
                                    placeholder={getDefaultWatermarkText()}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <p className="text-xs text-gray-400 mt-1">
                                    비워두면 "{getDefaultWatermarkText()}"로 표시됩니다
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 🚀 다운로드 차단 설정 */}
                          <div className="space-y-3">
                            <div>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={downloadBlocked}
                                  onChange={(e) => setDownloadBlocked(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">다운로드 차단</span>
                              </label>
                              <p className="text-xs text-gray-500 ml-6">
                                문서를 온라인에서만 볼 수 있도록 다운로드를 완전히 차단합니다
                              </p>
                            </div>

                            {downloadBlocked && (
                              <div className="ml-6 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                                <strong>주의:</strong> 다운로드가 차단되어도 스크린샷이나 프린트는 막을 수 없습니다.
                              </div>
                            )}
                          </div>

                          {/* 🚀 조회 제한 설정 */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                조회 횟수 제한
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={viewLimit !== undefined}
                                  onChange={(e) => setViewLimit(e.target.checked ? 10 : undefined)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">제한 설정</span>
                              </div>
                            </div>

                            {viewLimit !== undefined && (
                              <div className="ml-6 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">최대</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={viewLimit}
                                    onChange={(e) => setViewLimit(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <span className="text-xs text-gray-600">번 조회 가능</span>
                                </div>
                                <p className="text-xs text-gray-400">
                                  설정한 횟수만큼 조회한 후 자동으로 접근이 차단됩니다
                                </p>
                              </div>
                            )}
                          </div>

                          {/* 🚀 IP 제한 설정 */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                IP 주소 제한
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={ipRestrictions.length > 0}
                                  onChange={(e) => {
                                    if (!e.target.checked) {
                                      setIpRestrictions([]);
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">특정 IP에서만 접근 허용</span>
                              </div>
                            </div>

                            {/* IP 입력 */}
                            <div className="ml-6 space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={ipInput}
                                  onChange={(e) => setIpInput(e.target.value)}
                                  onKeyPress={handleIpKeyPress}
                                  placeholder="192.168.1.1 또는 192.168.1.0/24"
                                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                  onClick={addIpRestriction}
                                  disabled={!ipInput.trim() || !isValidIpOrCidr(ipInput.trim())}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-400">
                                IP 주소 또는 CIDR 형식 (예: 192.168.1.0/24)으로 입력하세요
                              </p>
                            </div>

                            {/* 추가된 IP 목록 */}
                            {ipRestrictions.length > 0 && (
                              <div className="ml-6 space-y-2">
                                <label className="block text-xs font-medium text-gray-600">
                                  허용된 IP 목록 ({ipRestrictions.length}개)
                                </label>
                                <div className="space-y-1">
                                  {ipRestrictions.map((ip, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between px-2 py-1 bg-green-50 border border-green-200 rounded text-sm"
                                    >
                                      <span className="text-green-800 font-mono">{ip}</span>
                                      <button
                                        onClick={() => removeIpRestriction(ip)}
                                        className="p-0.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 📝 NDA 서명 요구 설정 */}
                          <div className="space-y-3 pt-3 border-t border-gray-200">
                            <div>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={ndaRequired}
                                  onChange={(e) => setNdaRequired(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <FileSignature className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">NDA 서명 필수</span>
                              </label>
                              <p className="text-xs text-gray-500 ml-6">
                                문서 접근 전 비밀유지계약서 서명을 요구합니다
                              </p>
                            </div>

                            {ndaRequired && (
                              <div className="ml-6 space-y-3 p-3 bg-blue-50 rounded-lg">
                                {/* NDA 템플릿 선택 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    <ScrollText className="w-3 h-3 inline mr-1" />
                                    NDA 템플릿
                                  </label>
                                  <select
                                    value={selectedNdaTemplate}
                                    onChange={(e) => setSelectedNdaTemplate(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="standard">표준 NDA (한국어)</option>
                                    <option value="standard-en">Standard NDA (English)</option>
                                    <option value="mutual">상호 NDA</option>
                                    <option value="custom">사용자 정의 템플릿</option>
                                  </select>
                                </div>

                                {/* 서명 기한 설정 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    서명 기한
                                  </label>
                                  <div className="grid grid-cols-4 gap-1">
                                    {[
                                      { value: '7days', label: '7일' },
                                      { value: '30days', label: '30일' },
                                      { value: 'custom', label: '직접' },
                                      { value: 'none', label: '무제한' }
                                    ].map(option => (
                                      <button
                                        key={option.value}
                                        onClick={() => setNdaDeadline(option.value as any)}
                                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                                          ndaDeadline === option.value
                                            ? 'border-blue-500 bg-blue-100 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                  {ndaDeadline === 'custom' && (
                                    <input
                                      type="date"
                                      value={customNdaDeadline}
                                      onChange={(e) => setCustomNdaDeadline(e.target.value)}
                                      min={new Date().toISOString().split('T')[0]}
                                      className="mt-2 w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  )}
                                </div>

                                {/* 서명자에게 보낼 메시지 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    서명 요청 메시지 (선택사항)
                                  </label>
                                  <textarea
                                    value={ndaCustomMessage}
                                    onChange={(e) => setNdaCustomMessage(e.target.value)}
                                    placeholder="NDA 서명이 필요한 이유나 추가 안내사항을 입력하세요"
                                    rows={2}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                  />
                                </div>

                                {/* NDA 정보 알림 */}
                                <div className="p-2 bg-blue-100 border border-blue-200 rounded text-xs">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-3 h-3 text-blue-600 mt-0.5" />
                                    <div className="text-blue-700">
                                      <strong>NDA 서명 프로세스:</strong>
                                      <ol className="mt-1 ml-3 list-decimal space-y-0.5">
                                        <li>수신자가 링크 접속 시 NDA 서명 페이지로 이동</li>
                                        <li>서명 완료 후 문서 접근 가능</li>
                                        <li>서명된 NDA는 자동으로 저장되어 추적 가능</li>
                                      </ol>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 브랜딩 탭 */}
                      {advancedTab === 'branding' && (
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600 mb-3">
                            <Settings className="w-4 h-4 inline mr-1" />
                            공유 페이지의 브랜딩을 커스터마이징하세요
                          </div>

                          {/* 🎨 회사/브랜드 정보 */}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                회사명
                              </label>
                              <input
                                type="text"
                                value={customBranding.companyName}
                                onChange={(e) => setCustomBranding(prev => ({
                                  ...prev,
                                  companyName: e.target.value
                                }))}
                                placeholder="포켓전자(주)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                공유 페이지와 워터마크에 표시됩니다
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                로고 URL
                              </label>
                              <input
                                type="url"
                                value={customBranding.logoUrl}
                                onChange={(e) => setCustomBranding(prev => ({
                                  ...prev,
                                  logoUrl: e.target.value
                                }))}
                                placeholder="https://your-company.com/logo.png"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                공유 페이지 상단에 표시될 로고 이미지 URL
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                테마 색상
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={customBranding.primaryColor}
                                  onChange={(e) => setCustomBranding(prev => ({
                                    ...prev,
                                    primaryColor: e.target.value
                                  }))}
                                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={customBranding.primaryColor}
                                  onChange={(e) => setCustomBranding(prev => ({
                                    ...prev,
                                    primaryColor: e.target.value
                                  }))}
                                  placeholder="#3B82F6"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                공유 페이지의 버튼과 강조 요소에 사용됩니다
                              </p>
                            </div>

                            {/* 브랜딩 프리뷰 */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                미리보기
                              </label>
                              <div className="bg-white p-4 rounded-lg border" style={{ borderTopColor: customBranding.primaryColor, borderTopWidth: '3px' }}>
                                <div className="flex items-center gap-3 mb-3">
                                  {customBranding.logoUrl ? (
                                    <img
                                      src={customBranding.logoUrl}
                                      alt="Logo"
                                      className="w-8 h-8 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                      <Settings className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {customBranding.companyName || '회사명'}
                                    </h4>
                                    <p className="text-sm text-gray-500">문서 공유 페이지</p>
                                  </div>
                                </div>
                                <button
                                  style={{ backgroundColor: customBranding.primaryColor }}
                                  className="px-4 py-2 text-white text-sm rounded-lg"
                                  disabled
                                >
                                  문서 보기
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          {/* Debug info */}
          <div className="mb-2 text-xs text-gray-500">
            Debug: shareLink = "{shareLink}" (length: {shareLink.length})
          </div>

          {shareLink ? (
            /* 생성 완료 상태 */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">공유함이 생성되었습니다!</span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Link2 className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                    copied
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 inline mr-1" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 inline mr-1" />
                      복사
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>
                  {expiryType === 'never'
                    ? '이 링크는 수동으로 삭제하기 전까지 유효합니다.'
                    : `이 링크는 ${getExpiryDate()?.toLocaleString('ko-KR')}까지 유효합니다.`
                  }
                </span>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  완료
                </button>
              </div>
            </div>
          ) : (
            /* 생성 전 상태 */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>암호화된 안전한 링크가 생성됩니다</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={!sessionName.trim() || selectedDocs.size === 0 || isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      공유함 생성
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShareLink('https://test.example.com/share/test123')}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                >
                  TEST: Set Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareSessionModal;