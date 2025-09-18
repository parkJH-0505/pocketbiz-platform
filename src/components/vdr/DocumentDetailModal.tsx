import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Share2,
  Star,
  StarOff,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  User,
  HardDrive,
  Tag,
  MessageSquare,
  BarChart3,
  Link2,
  Copy,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useVDRContext } from '../../contexts/VDRContext';
import type { VDRDocument, EnhancedAccessLog } from '../../contexts/VDRContext';
import DocumentPreview from './DocumentPreview';

interface DocumentDetailModalProps {
  isOpen: boolean;
  docData: VDRDocument | null;
  onClose: () => void;
  onUpdate?: (docData: VDRDocument) => void;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  docData: docData,
  onClose,
  onUpdate
}) => {
  const {
    downloadDocument,
    updateDocumentVisibility,
    getAccessLogs,
    viewDocument,
    documents,
    createShareSession
  } = useVDRContext();

  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'activity' | 'relations'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docDataLogs, setDocumentLogs] = useState<EnhancedAccessLog[]>([]);
  const [relatedDocuments, setRelatedDocuments] = useState<VDRDocument[]>([]);

  // 문서가 변경될 때 편집 상태 초기화 및 데이터 로드
  useEffect(() => {
    if (docData) {
      setEditedDescription(docData.description || '');
      setEditedTags(docData.tags || []);
      setIsEditing(false);
      setActiveTab('overview');

      // 문서 조회 로그 기록
      viewDocument(docData.id);

      // 문서별 접근 로그 가져오기
      const logs = getAccessLogs({ docDataId: docData.id });
      setDocumentLogs(logs);

      // 관련 문서 찾기 (같은 카테고리 또는 프로젝트)
      const related = documents.filter(doc =>
        doc.id !== docData.id && (
          doc.category === docData.category ||
          doc.projectId === docData.projectId ||
          doc.tags?.some(tag => docData.tags?.includes(tag))
        )
      ).slice(0, 5);
      setRelatedDocuments(related);
    }
  }, [docData, viewDocument, getAccessLogs, documents]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen && typeof document !== 'undefined') {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !docData) {
    return null;
  }

  // 파일 크기 포맷터
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 승인 상태 스타일
  const getApprovalStatusStyle = (status?: string) => {
    switch (status) {
      case 'approved':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle className="w-4 h-4" /> };
      case 'rejected':
        return { color: 'text-red-600', bg: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> };
      case 'pending':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Clock className="w-4 h-4" /> };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', icon: <AlertCircle className="w-4 h-4" /> };
    }
  };

  // 공개범위 스타일
  const getVisibilityStyle = (visibility: VDRDocument['visibility']) => {
    switch (visibility) {
      case 'private':
        return { color: 'text-red-600', bg: 'bg-red-100', label: '비공개' };
      case 'team':
        return { color: 'text-blue-600', bg: 'bg-blue-100', label: '팀' };
      case 'investors':
        return { color: 'text-purple-600', bg: 'bg-purple-100', label: '투자자' };
      case 'public':
        return { color: 'text-green-600', bg: 'bg-green-100', label: '공개' };
    }
  };

  // 태그 추가
  const handleAddTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  // 태그 삭제
  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  // 편집 저장 (실제 구현에서는 VDRContext의 업데이트 함수 사용)
  const handleSaveEdit = () => {
    const updatedDocument = {
      ...docData,
      description: editedDescription,
      tags: editedTags
    };

    // TODO: VDRContext에 updateDocument 함수 추가 필요
    onUpdate?.(updatedDocument);
    setIsEditing(false);

    console.log('[DocumentDetailModal] Document updated:', updatedDocument);
  };

  // 즐겨찾기 토글 (실제 구현에서는 VDRContext의 함수 사용)
  const handleToggleFavorite = () => {
    const updatedDocument = {
      ...docData,
      isFavorite: !docData.isFavorite
    };
    onUpdate?.(updatedDocument);
    console.log('[DocumentDetailModal] Favorite toggled:', updatedDocument.isFavorite);
  };

  // 공유 버튼 핸들러
  const handleShare = async () => {
    try {
      const shareLink = await createShareSession(
        `${docData.name} 공유`,
        [docData.id],
        undefined // 만료일 없음
      );

      // 링크 클립보드 복사
      navigator.clipboard.writeText(shareLink);

      // 성공 알림 (간단한 토스트)
      const toast = document.createElement('div');
      toast.textContent = '공유 링크가 생성되어 클립보드에 복사되었습니다';
      toast.className = 'fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);

      console.log('[DocumentDetailModal] Share link created:', shareLink);
    } catch (error) {
      console.error('[DocumentDetailModal] Share failed:', error);
      alert('공유 링크 생성에 실패했습니다.');
    }
  };

  // 액션 아이콘 가져오기
  const getActionIcon = (action: EnhancedAccessLog['action']) => {
    switch (action) {
      case 'view': return <Eye className="w-4 h-4" />;
      case 'download': return <Download className="w-4 h-4" />;
      case 'upload': return <FileText className="w-4 h-4" />;
      case 'share': return <Share2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // 액션 색상 가져오기
  const getActionColor = (action: EnhancedAccessLog['action']) => {
    switch (action) {
      case 'view': return 'text-blue-600 bg-blue-50';
      case 'download': return 'text-green-600 bg-green-50';
      case 'upload': return 'text-purple-600 bg-purple-50';
      case 'share': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const approvalStatus = getApprovalStatusStyle(docData.approvalStatus);
  const visibilityStyle = getVisibilityStyle(docData.visibility);

  return (
    <>

      <div className="fixed inset-0 z-50 overflow-hidden" style={{zIndex: 9999}}>
        {/* 백드롭 */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

      {/* 모달 컨테이너 */}
      <div className={`absolute inset-0 flex items-center justify-center p-4 ${
        isFullscreen ? 'p-0' : ''
      }`}>
        <div className={`bg-white rounded-lg shadow-xl max-h-full overflow-hidden transition-all ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[90vh]'
        }`}>

          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {docData.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${visibilityStyle.bg} ${visibilityStyle.color}`}>
                    <Shield className="w-3 h-3" />
                    {visibilityStyle.label}
                  </span>
                  {docData.isRepresentative && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3" />
                      대표문서
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${approvalStatus.bg} ${approvalStatus.color}`}>
                    {approvalStatus.icon}
                    {docData.approvalStatus || 'pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* 헤더 액션 버튼들 */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  docData.isFavorite
                    ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={docData.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                {docData.isFavorite ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                title={isFullscreen ? '축소' : '전체화면'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b bg-white px-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: '개요', icon: <Info className="w-4 h-4" /> },
                { id: 'preview', label: '미리보기', icon: <Eye className="w-4 h-4" /> },
                { id: 'activity', label: '활동', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'relations', label: '관련문서', icon: <Link2 className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* 왼쪽: 기본 정보 */}
                  <div className="lg:col-span-2 space-y-6">

                    {/* 파일 정보 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">파일 정보</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">파일 크기</label>
                          <p className="text-gray-900 mt-1">{formatFileSize(docData.size)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">파일 형식</label>
                          <p className="text-gray-900 mt-1">{docData.fileType || 'Unknown'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">업로드일</label>
                          <p className="text-gray-900 mt-1">
                            {new Date(docData.uploadDate).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">최종 수정</label>
                          <p className="text-gray-900 mt-1">
                            {new Date(docData.lastModified).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">버전</label>
                          <p className="text-gray-900 mt-1">{docData.version || 'v1.0'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">카테고리</label>
                          <p className="text-gray-900 mt-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {docData.category}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 설명 및 태그 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">설명 및 태그</h3>
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          {isEditing ? '취소' : '편집'}
                        </button>
                      </div>

                      {/* 설명 */}
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-600">설명</label>
                        {isEditing ? (
                          <textarea
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="문서 설명을 입력하세요..."
                          />
                        ) : (
                          <p className="text-gray-900 mt-1 min-h-[60px] p-3 bg-white rounded border">
                            {docData.description || '설명이 없습니다.'}
                          </p>
                        )}
                      </div>

                      {/* 태그 */}
                      <div>
                        <label className="text-sm font-medium text-gray-600">태그</label>
                        <div className="mt-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {editedTags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                  >
                                    {tag}
                                    <button
                                      onClick={() => handleRemoveTag(tag)}
                                      className="hover:bg-blue-200 rounded-full p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newTag}
                                  onChange={(e) => setNewTag(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="새 태그 입력..."
                                />
                                <button
                                  onClick={handleAddTag}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                >
                                  추가
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(docData.tags && docData.tags.length > 0) ? (
                                docData.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                  >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <p className="text-gray-500 text-sm">태그가 없습니다.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 편집 모드 저장 버튼 */}
                      {isEditing && (
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            저장
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽: 액션 패널 및 통계 */}
                  <div className="space-y-6">

                    {/* 액션 패널 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">액션</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => downloadDocument(docData.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                          다운로드
                        </button>
                        <button
                          onClick={handleShare}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
                          공유
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                          링크 복사
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* 업로더 정보 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">업로더 정보</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{docData.uploadedBy || '알 수 없음'}</p>
                            <p className="text-sm text-gray-500">업로더</p>
                          </div>
                        </div>
                        {docData.approvedBy && (
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="font-medium text-gray-900">{docData.approvedBy}</p>
                              <p className="text-sm text-gray-500">승인자</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 통계 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">통계</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">조회수</span>
                          <span className="font-medium text-gray-900">{docData.viewCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">다운로드</span>
                          <span className="font-medium text-gray-900">{docData.downloadCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">공유 세션</span>
                          <span className="font-medium text-gray-900">{docData.sharedSessions?.length || 0}</span>
                        </div>
                        {docData.lastAccessDate && (
                          <div className="pt-2 border-t">
                            <span className="text-gray-600 text-sm">최근 접근</span>
                            <p className="font-medium text-gray-900 text-sm">
                              {new Date(docData.lastAccessDate).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 미리보기 탭 */}
            {activeTab === 'preview' && (
              <div className="p-6">
                <DocumentPreview
                  docData={docData}
                  onPreviewError={(error) => {
                    console.error('[DocumentDetailModal] Preview error:', error);
                  }}
                />
              </div>
            )}

            {/* 활동 탭 */}
            {activeTab === 'activity' && (
              <div className="p-6">
                <div className="space-y-6">
                  {/* 활동 통계 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-900">{docData.viewCount || 0}</div>
                      <div className="text-sm text-blue-700">조회수</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Download className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900">{docData.downloadCount || 0}</div>
                      <div className="text-sm text-green-700">다운로드</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <Share2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-900">{docData.sharedSessions?.length || 0}</div>
                      <div className="text-sm text-orange-700">공유 세션</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-900">{docDataLogs.length}</div>
                      <div className="text-sm text-purple-700">총 활동</div>
                    </div>
                  </div>

                  {/* 활동 로그 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
                    {docDataLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">활동 기록이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {docDataLogs.slice(0, 20).map((log) => (
                          <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                              {getActionIcon(log.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 capitalize">{log.action}</span>
                                <span className="text-sm text-gray-500">
                                  by {log.userInfo.userName || '익명'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {log.timestamp.toLocaleString('ko-KR')}
                                {log.details.duration && (
                                  <span className="ml-2">• {log.details.duration}초</span>
                                )}
                                {log.metadata?.deviceType && (
                                  <span className="ml-2">• {log.metadata.deviceType}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 공유 세션 정보 */}
                  {docData.sharedSessions && docData.sharedSessions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">공유 세션</h3>
                      <div className="space-y-3">
                        {docData.sharedSessions.map((session) => (
                          <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{session.name}</span>
                              <span className="text-sm text-gray-500">
                                {session.accessCount}회 접근
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              생성: {new Date(session.createdAt).toLocaleString('ko-KR')}
                              {session.expiresAt && (
                                <span className="ml-4">
                                  만료: {new Date(session.expiresAt).toLocaleString('ko-KR')}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => navigator.clipboard.writeText(session.link)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                                링크 복사
                              </button>
                              <button
                                onClick={() => window.open(session.link, '_blank')}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                새 탭에서 열기
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 관련 문서 탭 */}
            {activeTab === 'relations' && (
              <div className="p-6">
                <div className="space-y-6">
                  {/* 관련 문서 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">관련 문서</h3>
                    {relatedDocuments.length === 0 ? (
                      <div className="text-center py-8">
                        <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">관련 문서가 없습니다.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {relatedDocuments.map((relatedDoc) => (
                          <div key={relatedDoc.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-start gap-3">
                              <FileText className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{relatedDoc.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {relatedDoc.category} • {(relatedDoc.size / 1048576).toFixed(2)}MB
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(relatedDoc.uploadDate).toLocaleDateString('ko-KR')}
                                </p>
                                {relatedDoc.tags && relatedDoc.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {relatedDoc.tags.slice(0, 3).map((tag, index) => (
                                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                    {relatedDoc.tags.length > 3 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        +{relatedDoc.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 같은 프로젝트 문서 */}
                  {docData.projectId && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">같은 프로젝트 문서</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">{docData.projectName}</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          프로젝트 ID: {docData.projectId}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 문서 연결 관리 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">문서 연결 관리</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-3">
                        다른 문서와의 연결을 추가하거나 관리할 수 있습니다.
                      </p>
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Link2 className="w-4 h-4" />
                        연결 추가
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default DocumentDetailModal;