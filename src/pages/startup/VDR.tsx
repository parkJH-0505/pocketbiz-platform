import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Download,
  Share2,
  Eye,
  Shield,
  Search,
  Filter,
  FolderOpen,
  Calendar,
  Building,
  ChevronRight,
  ChevronDown,
  Star,
  Lock,
  Globe,
  Users,
  Check,
  X,
  Upload
} from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';

// DnD 타입 정의
const ItemTypes = {
  DOCUMENT: 'document'
};
import { useVDRContext } from '../../contexts/VDRContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import type { VDRDocument, RepresentativeDoc, SharedSession } from '../../contexts/VDRContext';
import ShareSessionModal from '../../components/vdr/ShareSessionModal';
import FileDropZone from '../../components/vdr/FileDropZone';
import UploadProgress, { type UploadItem } from '../../components/vdr/UploadProgress';
import AccessLogViewer from '../../components/vdr/AccessLogViewer';
import DocumentDetailModal from '../../components/vdr/DocumentDetailModal';
import NDATracker from '../../components/vdr/NDATracker';
import MyProfileTab from '../../components/profile/MyProfileTab';
import SessionManagementTab from '../../components/vdr/SessionManagementTab';

// 드래그 가능한 문서 컴포넌트
const DraggableDocument: React.FC<{
  document: VDRDocument;
  onClick?: () => void;
  isSelected?: boolean;
}> = ({ document: doc, onClick, isSelected }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.DOCUMENT,
    item: { id: doc.id, document: doc },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
          : 'border-gray-200 hover:border-blue-300'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm truncate">{doc.name}</span>
            {doc.isRepresentative && (
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <span>{(doc.size / 1048576).toFixed(1)}MB</span>
            <span className="mx-1">•</span>
            <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 드래그 가능한 테이블 행 컴포넌트
const DraggableTableRow: React.FC<{
  document: VDRDocument;
  isSelected: boolean;
  onSelectDoc: (docId: string) => void;
  onViewDocument: (docId: string) => void;
  updateDocumentVisibility: (docId: string, visibility: VDRDocument['visibility']) => void;
  getCategoryLabel: (category: VDRDocument['category']) => string;
  getVisibilityColor: (visibility: VDRDocument['visibility']) => string;
  sharedSessions: SharedSession[]; // 추가: 전체 공유 세션 목록
}> = ({
  document: doc,
  isSelected,
  onSelectDoc,
  onViewDocument,
  updateDocumentVisibility,
  getCategoryLabel,
  getVisibilityColor,
  sharedSessions
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.DOCUMENT,
    item: { id: doc.id, document: doc },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // 해당 문서가 포함된 공유 세션들 찾기
  const documentSessions = sharedSessions.filter(session =>
    session.documentIds.includes(doc.id)
  );

  // 공유 상태 정보 생성
  const getShareStatus = () => {
    if (documentSessions.length === 0) {
      return {
        status: 'not_shared',
        label: '미공유',
        color: 'text-gray-500 bg-gray-100',
        count: 0
      };
    }

    const activeSessions = documentSessions.filter(session => {
      if (!session.expiresAt) return true;
      return new Date(session.expiresAt) > new Date();
    });

    if (activeSessions.length === 0) {
      return {
        status: 'expired',
        label: '만료됨',
        color: 'text-red-600 bg-red-100',
        count: documentSessions.length
      };
    }

    return {
      status: 'active',
      label: '공유중',
      color: 'text-green-600 bg-green-100',
      count: activeSessions.length
    };
  };

  const shareStatus = getShareStatus();

  return (
    <div
      className={`px-4 py-2 hover:bg-gray-50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="grid grid-cols-9 gap-4 items-center">
        {/* Checkbox + Drag Handle */}
        <div className="col-span-1 flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectDoc(doc.id);
            }}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          {/* Drag Handle */}
          <button
            ref={drag}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded cursor-move border border-gray-200 hover:border-gray-300 transition-colors"
            title="드래그하여 대표 문서로 지정"
          >
            ⋮⋮
          </button>
        </div>

        {/* 파일명 - 클릭 가능 */}
        <div
          className="col-span-3 cursor-pointer"
          onClick={() => onViewDocument(doc.id)}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-900 truncate hover:text-blue-600">{doc.name}</span>
                {doc.isRepresentative && (
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 카테고리 */}
        <div className="col-span-1">
          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
            {getCategoryLabel(doc.category)}
          </span>
        </div>

        {/* 공유 상태 - 새로 추가된 열 */}
        <div className="col-span-1 relative">
          <div className="flex items-center gap-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${shareStatus.color}`}>
              {shareStatus.label}
            </span>
            {shareStatus.count > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // 공유 세션 상세 보기 팝오버 토글
                  const popoverId = `session-popover-${doc.id}`;
                  const existingPopover = document.getElementById(popoverId);

                  if (existingPopover) {
                    existingPopover.remove();
                  } else {
                    // 다른 모든 팝오버 제거
                    document.querySelectorAll('[id^="session-popover-"]').forEach(p => p.remove());

                    // 새 팝오버 생성
                    const popover = document.createElement('div');
                    popover.id = popoverId;
                    popover.className = 'absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64 mt-1';
                    popover.style.left = '0';
                    popover.style.top = '100%';

                    const sessionsHtml = documentSessions.map(session => {
                      const isExpired = session.expiresAt && new Date(session.expiresAt) < new Date();
                      return `
                        <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded border-b border-gray-100 last:border-b-0">
                          <div class="flex-1 min-w-0">
                            <div class="font-medium text-sm truncate">${session.name}</div>
                            <div class="text-xs text-gray-500">
                              생성: ${new Date(session.createdAt).toLocaleDateString('ko-KR')}
                              ${session.expiresAt ? ` • 만료: ${new Date(session.expiresAt).toLocaleDateString('ko-KR')}` : ' • 무제한'}
                            </div>
                          </div>
                          <div class="flex items-center gap-1 ml-2">
                            <button onclick="navigator.clipboard.writeText('${session.link}'); this.innerHTML='복사됨!'; setTimeout(() => this.innerHTML='복사', 1000)"
                                    class="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="링크 복사">
                              복사
                            </button>
                            <button onclick="window.open('${session.link}', '_blank')"
                                    class="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200" title="새 탭에서 열기">
                              열기
                            </button>
                          </div>
                        </div>
                      `;
                    }).join('');

                    popover.innerHTML = `
                      <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-gray-900">공유 세션 (${documentSessions.length}개)</h4>
                        <button onclick="this.closest('[id^=session-popover-]').remove()"
                                class="text-gray-400 hover:text-gray-600">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      <div class="max-h-48 overflow-y-auto">
                        ${sessionsHtml}
                      </div>
                    `;

                    e.currentTarget.parentElement?.appendChild(popover);

                    // 외부 클릭 시 팝오버 닫기
                    const handleOutsideClick = (event: Event) => {
                      if (!popover.contains(event.target as Node)) {
                        popover.remove();
                        document.removeEventListener('click', handleOutsideClick);
                      }
                    };
                    // 짧은 지연 후 이벤트 리스너 추가 (현재 클릭 이벤트가 처리된 후)
                    setTimeout(() => {
                      document.addEventListener('click', handleOutsideClick);
                    }, 100);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                title="공유 세션 보기"
              >
                {shareStatus.count}개
              </button>
            )}
          </div>
          {documentSessions.length > 0 && (
            <div className="text-xs text-gray-400 mt-0.5 truncate">
              {documentSessions[0].name}
              {documentSessions.length > 1 && ` 외 ${documentSessions.length - 1}개`}
            </div>
          )}
        </div>

        {/* 업로더 */}
        <div className="col-span-1">
          <span className="text-sm text-gray-600">{doc.uploadedBy || '-'}</span>
        </div>

        {/* 크기 */}
        <div className="col-span-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-gray-600">{(doc.size / 1048576).toFixed(1)}MB</span>
            {doc.downloadCount > 0 && (
              <span className="text-xs text-blue-600">↓ {doc.downloadCount}회</span>
            )}
          </div>
        </div>

        {/* 업로드일 */}
        <div className="col-span-1">
          <span className="text-sm text-gray-600">
            {new Date(doc.uploadDate).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

// 공유 문서 섹션 컴포넌트
const SharedDocumentsSection: React.FC<{
  sharedDocs: VDRDocument[];
  getCategoryLabel: (category: VDRDocument['category']) => string;
}> = ({ sharedDocs, getCategoryLabel }) => {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // 공유 세션별로 문서들을 그룹화
  const sharedSessions = useMemo(() => {
    const sessionsMap = new Map<string, {
      session: SharedSession;
      documents: VDRDocument[];
    }>();

    sharedDocs.forEach(doc => {
      doc.sharedSessions?.forEach(session => {
        if (!sessionsMap.has(session.id)) {
          sessionsMap.set(session.id, {
            session,
            documents: []
          });
        }
        sessionsMap.get(session.id)!.documents.push(doc);
      });
    });

    return Array.from(sessionsMap.values()).sort((a, b) =>
      new Date(b.session.createdAt).getTime() - new Date(a.session.createdAt).getTime()
    );
  }, [sharedDocs]);

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // 간단한 토스트 알림
      const toast = document.createElement('div');
      toast.textContent = '링크가 복사되었습니다';
      toast.className = 'fixed bottom-20 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
      document.body.appendChild(toast);

      setTimeout(() => {
        document.body.removeChild(toast);
      }, 2000);
    }).catch(err => {
      console.error('클립보드 복사 실패:', err);
    });
  };

  if (sharedSessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-600" />
          공유중인 문서
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">공유중인 문서가 없습니다</p>
          <p className="text-sm">문서를 선택하고 공유 버튼을 눌러 공유 세션을 생성해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-600" />
          공유중인 문서
        </h2>
        <span className="text-sm text-gray-500">
          {sharedSessions.length}개 세션, {sharedDocs.length}개 문서
        </span>
      </div>

      <div className="space-y-4">
        {sharedSessions.map(({ session, documents }) => {
          const isExpanded = expandedSessions.has(session.id);
          const isExpired = session.expiresAt && new Date(session.expiresAt) < new Date();

          return (
            <div key={session.id} className="border rounded-lg overflow-hidden">
              {/* 세션 헤더 */}
              <div
                className={`p-4 cursor-pointer transition-colors ${
                  isExpired ? 'bg-red-50 border-red-100' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => toggleSession(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="p-1">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{session.name}</h3>
                        {isExpired && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                            만료됨
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        생성: {new Date(session.createdAt).toLocaleDateString('ko-KR')}
                        {session.expiresAt && (
                          <>
                            {' • '}만료: {new Date(session.expiresAt).toLocaleDateString('ko-KR')}
                          </>
                        )}
                        {' • '}접근: {session.accessCount}회
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {documents.length}개 문서
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(session.link);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="링크 복사"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 세션 내 문서 목록 */}
              {isExpanded && (
                <div className="border-t">
                  <div className="p-4">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">
                      <div className="col-span-4">파일명</div>
                      <div className="col-span-2">카테고리</div>
                      <div className="col-span-2">크기</div>
                      <div className="col-span-2">업로드일</div>
                      <div className="col-span-2">상태</div>
                    </div>
                    <div className="space-y-2">
                      {documents.map(doc => (
                        <div key={doc.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="col-span-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium text-gray-900 truncate">{doc.name}</span>
                              {doc.isRepresentative && (
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {getCategoryLabel(doc.category)}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm text-gray-600">
                              {(doc.size / 1048576).toFixed(1)}MB
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm text-gray-600">
                              {new Date(doc.uploadDate).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {isExpired ? '접근 불가' : '공유 중'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 드롭 존 컴포넌트
const RepresentativeDropZone: React.FC<{
  type: RepresentativeDoc['type'];
  label: string;
  currentDoc?: VDRDocument;
  onDrop: (docId: string) => void;
  onRemove?: () => void;
  visibility?: VDRDocument['visibility'];
  onVisibilityChange?: (visibility: VDRDocument['visibility']) => void;
}> = ({ type, label, currentDoc, onDrop, onRemove, visibility = 'private', onVisibilityChange }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.DOCUMENT,
    drop: (item: { id: string; document: VDRDocument }) => {
      // 모든 문서를 해당 대표 문서 타입으로 지정 가능
      onDrop(item.id);
    },
    canDrop: (item: { id: string; document: VDRDocument }) => {
      // 모든 문서가 드롭 가능
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isActive = isOver && canDrop;

  const getVisibilityIcon = (visibility: VDRDocument['visibility']) => {
    switch(visibility) {
      case 'private': return <Lock className="w-3 h-3" />;
      case 'team': return <Users className="w-3 h-3" />;
      case 'investors': return <Eye className="w-3 h-3" />;
      case 'public': return <Globe className="w-3 h-3" />;
    }
  };

  const getVisibilityColor = (visibility: VDRDocument['visibility']) => {
    switch(visibility) {
      case 'private': return 'text-red-600 bg-red-50 border-red-200';
      case 'team': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'investors': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'public': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getVisibilityLabel = (visibility: VDRDocument['visibility']) => {
    switch(visibility) {
      case 'private': return '비공개';
      case 'team': return '팀';
      case 'investors': return '투자자';
      case 'public': return '공개';
    }
  };

  return (
    <div
      ref={drop}
      className={`border-2 rounded-lg p-4 transition-all min-h-[160px] ${
        currentDoc
          ? 'border-green-200 bg-green-50'
          : isActive
          ? 'border-blue-400 bg-blue-50'
          : canDrop && isOver
          ? 'border-orange-400 bg-orange-50'
          : 'border-gray-200 border-dashed'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{label}</span>
        {currentDoc && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
      </div>

      {/* 공개 범위 설정 */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 block mb-1">프로필 공개 범위</label>
        <select
          value={visibility}
          onChange={(e) => onVisibilityChange?.(e.target.value as VDRDocument['visibility'])}
          className={`text-xs px-2 py-1 rounded border ${getVisibilityColor(visibility)} w-full`}
        >
          <option value="private">비공개 (프로필에 표시 안함)</option>
          <option value="team">팀 (내부 구성원만)</option>
          <option value="investors">투자자 (투자자에게만)</option>
          <option value="public">공개 (모든 방문자)</option>
        </select>
        <div className={`flex items-center gap-1 mt-1 text-xs ${getVisibilityColor(visibility).split(' ')[0]}`}>
          {getVisibilityIcon(visibility)}
          <span>프로필에서 {getVisibilityLabel(visibility)} 표시</span>
        </div>
      </div>

      {currentDoc ? (
        <div className="text-sm text-gray-600">
          <p className="truncate font-medium">{currentDoc.name}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(currentDoc.uploadDate).toLocaleDateString()}
          </p>
          <button
            onClick={onRemove}
            className="mt-2 text-xs text-red-600 hover:text-red-800"
          >
            지정 해제
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">
            {isActive ? '여기에 놓으세요!' : '파일을 드래그해서 놓으세요'}
          </p>
          <p className="text-xs text-gray-300">
            모든 문서를 {label}로 지정할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
};

const VDR: React.FC = () => {
  const {
    documents,
    representativeDocs,
    sharedSessions,
    aggregateDocuments,
    uploadDocument,
    updateDocumentVisibility,
    setRepresentativeDocument,
    createShareSession,
    searchDocuments,
    downloadDocument,
    downloadMultipleDocuments,
    viewDocument,
    updateRepresentativeDocumentVisibility,
    loading
  } = useVDRContext();

  const { projects } = useBuildupContext();

  // 탭 상태 추가
  const [activeTab, setActiveTab] = useState<'documents' | 'logs' | 'nda' | 'profile'>('documents');

  // 문서 관리 탭 내 뷰 모드 상태
  const [documentsViewMode, setDocumentsViewMode] = useState<'documents' | 'sessions'>('documents');

  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 문서 상세 모달 상태
  const [showDocumentDetail, setShowDocumentDetail] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VDRDocument | null>(null);

  // 대표 문서별 공개 범위 설정 상태
  const [representativeVisibilities, setRepresentativeVisibilities] = useState<Record<RepresentativeDoc['type'], VDRDocument['visibility']>>({
    'ir_deck': 'investors',
    'business_plan': 'team',
    'financial': 'team',
    'marketing': 'public'
  });

  // 모든 문서를 표시 - 단일 뷰 구조 (filteredDocs를 먼저 정의)
  const filteredDocs = useMemo(() => {
    return (searchQuery ? searchDocuments(searchQuery) : documents).filter(doc => {
      const matchesFilter = filterCategory === 'all' || doc.category === filterCategory;
      const matchesProject = selectedProjectId === 'all' || doc.projectId === selectedProjectId;
      return matchesFilter && matchesProject;
    });
  }, [documents, searchQuery, filterCategory, selectedProjectId, searchDocuments]);

  // 공유중인 문서만 별도로 추출
  const sharedDocs = useMemo(() => {
    return documents.filter(doc => doc.sharedSessions && doc.sharedSessions.length > 0);
  }, [documents]);

  // 키보드 단축키 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A: 전체 선택
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedDocs(new Set(filteredDocs.map(doc => doc.id)));
      }

      // Ctrl/Cmd + D: 선택 해제
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setSelectedDocs(new Set());
      }

      // Delete: 선택된 문서 삭제 (확인 후)
      if (e.key === 'Delete' && selectedDocs.size > 0) {
        if (confirm(`선택된 ${selectedDocs.size}개 문서를 삭제하시겠습니까?`)) {
          console.log('Delete selected documents:', Array.from(selectedDocs));
          setSelectedDocs(new Set());
          // 토스트 알림 추가
          const toast = document.createElement('div');
          toast.textContent = `${selectedDocs.size}개 문서가 삭제되었습니다`;
          toast.className = 'fixed bottom-20 right-6 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
          document.body.appendChild(toast);
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 2000);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredDocs, selectedDocs]);

  // 초기 로드 시 문서 집계
  useEffect(() => {
    aggregateDocuments();
  }, []);

  const handleSelectDoc = (docId: string) => {
    const newSelection = new Set(selectedDocs);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocs(newSelection);
  };

  const handleShare = async () => {
    if (selectedDocs.size === 0) return;
    setShowShareModal(true);
  };

  const handleCreateShareSession = async (name: string, documentIds: string[], expiresAt?: Date) => {
    console.log('[VDR] handleCreateShareSession called with:', { name, documentIds, expiresAt });

    try {
      const shareLink = await createShareSession(name, documentIds, expiresAt);
      console.log('[VDR] Share session created, link received:', shareLink);

      setSelectedDocs(new Set()); // 선택 해제

      console.log('[VDR] Returning link to modal:', shareLink);
      return shareLink;
    } catch (error) {
      console.error('[VDR] Error in handleCreateShareSession:', error);
      throw error;
    }
  };

  // 파일 업로드 핸들러 (진행률 추적)
  const handleFilesUpload = async (files: File[]) => {
    // 업로드 아이템 생성
    const newUploads: UploadItem[] = files.map(file => ({
      id: `upload-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending' as const
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);

    // 각 파일 업로드 시뮬레이션
    for (const upload of newUploads) {
      try {
        // 업로드 시작
        setUploadQueue(prev => prev.map(u =>
          u.id === upload.id ? { ...u, status: 'uploading' as const } : u
        ));

        // 진행률 시뮬레이션 (실제로는 XMLHttpRequest나 Fetch API의 progress 이벤트 사용)
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setUploadQueue(prev => prev.map(u =>
            u.id === upload.id ? { ...u, progress } : u
          ));
        }

        // 실제 업로드
        await uploadDocument(upload.file, 'vdr_upload');

        // 업로드 완료
        setUploadQueue(prev => prev.map(u =>
          u.id === upload.id ? { ...u, status: 'completed' as const, progress: 100 } : u
        ));
      } catch (error) {
        // 업로드 실패
        setUploadQueue(prev => prev.map(u =>
          u.id === upload.id ? {
            ...u,
            status: 'error' as const,
            error: error instanceof Error ? error.message : '업로드 실패'
          } : u
        ));
      }
    }

    // 문서 목록 새로고침
    await aggregateDocuments();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    await handleFilesUpload(Array.from(files));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getVisibilityIcon = (visibility: VDRDocument['visibility']) => {
    switch(visibility) {
      case 'private': return <Lock className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'investors': return <Eye className="w-4 h-4" />;
      case 'public': return <Globe className="w-4 h-4" />;
    }
  };

  const getVisibilityColor = (visibility: VDRDocument['visibility']) => {
    switch(visibility) {
      case 'private': return 'text-red-600 bg-red-50';
      case 'team': return 'text-blue-600 bg-blue-50';
      case 'investors': return 'text-purple-600 bg-purple-50';
      case 'public': return 'text-green-600 bg-green-50';
    }
  };

  const getCategoryLabel = (category: VDRDocument['category']) => {
    const labels = {
      buildup_deliverable: '빌드업 산출물',
      kpi_report: 'KPI 보고서',
      vdr_upload: 'VDR 업로드',
      contract: '계약서',
      ir_deck: 'IR Deck',
      business_plan: '사업계획서',
      financial: '재무제표',
      marketing: '마케팅 지표'
    };
    return labels[category] || category;
  };

  // 문서 상세 보기 핸들러
  const handleViewDocument = (docId: string) => {
    const document = filteredDocs.find(doc => doc.id === docId);
    if (document) {
      setSelectedDocument(document);
      setShowDocumentDetail(true);
    }
  };

  // 문서 업데이트 핸들러
  const handleDocumentUpdate = (updatedDocument: VDRDocument) => {
    // TODO: VDRContext에 updateDocument 함수 추가 필요
    console.log('[VDR] Document updated:', updatedDocument);
    setSelectedDocument(updatedDocument);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with File Drop Zone */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Virtual Data Room</h1>
              <p className="text-sm text-gray-500 mt-1">모든 문서를 한 곳에서 관리하고 안전하게 공유하세요</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDropZone(!showDropZone)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showDropZone
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                {showDropZone ? '드롭존 닫기' : '드롭존 열기'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                파일 선택
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* File Drop Zone - Collapsible */}
          {showDropZone && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <FileDropZone
                onFilesSelected={async (files) => {
                  console.log('[VDR] Files dropped:', files);

                  // 진행률 추적 업로드
                  await handleFilesUpload(files);

                  // 드롭존 닫기
                  setShowDropZone(false);
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.zip,.png,.jpg,.jpeg"
                maxSize={100 * 1024 * 1024} // 100MB
                maxFiles={10}
              />
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  문서 관리
                </div>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  접근 로그
                </div>
              </button>
              <button
                onClick={() => setActiveTab('nda')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nda'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  NDA 관리
                </div>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  마이프로필
                </div>
              </button>
            </nav>
          </div>
        </div>


        {/* Tab Content */}
        {activeTab === 'documents' && (
          <>
            {/* Representative Documents Drop Zone - Only in documents tab */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">대표 문서 지정</h2>
                <p className="text-sm text-gray-600 mb-6">
                  아래 문서를 각 카테고리 영역으로 드래그해서 대표 문서로 지정하세요.
                </p>

                {/* 드롭 존 그리드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {representativeDocs.map(type => {
                    const currentDoc = documents.find(d => d.representativeType === type.type && d.isRepresentative);
                    return (
                      <RepresentativeDropZone
                        key={type.type}
                        type={type.type}
                        label={type.label}
                        currentDoc={currentDoc}
                        visibility={representativeVisibilities[type.type]}
                        onVisibilityChange={(visibility) => {
                          setRepresentativeVisibilities(prev => ({
                            ...prev,
                            [type.type]: visibility
                          }));
                          updateRepresentativeDocumentVisibility(type.type, visibility);
                        }}
                        onDrop={(docId) => {
                          console.log('드롭 이벤트:', { type: type.type, docId });
                          setRepresentativeDocument(type.type, docId);
                        }}
                        onRemove={() => setRepresentativeDocument(type.type, null)}
                      />
                    );
                  })}
                </div>
            </div>
          </>
        )}


        {activeTab === 'logs' && (
          <AccessLogViewer />
        )}
        {/* NDA Tab Content */}
        {activeTab === 'nda' && (
          <NDATracker
            signatures={[
              // 샘플 데이터 - 실제로는 VDRContext에서 가져옴
              {
                id: '1',
                sessionId: 'session1',
                sessionName: '2024 IR 자료',
                signerName: '김철수',
                signerEmail: 'kim@example.com',
                signerCompany: 'ABC 벤처캐피탈',
                signerTitle: '투자심사역',
                templateId: 'standard',
                templateName: '표준 NDA (한국어)',
                status: 'signed',
                requestedAt: new Date('2024-01-15'),
                signedAt: new Date('2024-01-16'),
                deadline: new Date('2024-01-22'),
                ipAddress: '123.456.789.0',
                documentUrl: '/nda/signed/1.pdf'
              },
              {
                id: '2',
                sessionId: 'session2',
                sessionName: '재무제표 2023',
                signerName: '이영희',
                signerEmail: 'lee@example.com',
                signerCompany: 'XYZ 캐피탈',
                templateId: 'standard',
                templateName: '표준 NDA (한국어)',
                status: 'pending',
                requestedAt: new Date('2024-01-18'),
                deadline: new Date('2024-01-25')
              },
              {
                id: '3',
                sessionId: 'session3',
                sessionName: '기술 특허 문서',
                signerName: 'John Smith',
                signerEmail: 'john@global.com',
                signerCompany: 'Global Ventures',
                templateId: 'standard-en',
                templateName: 'Standard NDA (English)',
                status: 'expired',
                requestedAt: new Date('2024-01-10'),
                deadline: new Date('2024-01-17')
              }
            ]}
            onRefresh={() => console.log('Refresh NDA signatures')}
            onViewDocument={(id) => console.log('View NDA document:', id)}
            onDownloadDocument={(id) => console.log('Download NDA document:', id)}
            onResendRequest={(id) => console.log('Resend NDA request:', id)}
          />
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <MyProfileTab />
        )}

        {/* Documents Tab Content - Continue from search/filter */}
        {activeTab === 'documents' && (
          <>
            {/* View Mode Toggle */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {documentsViewMode === 'documents' ? '문서 중심 관리' : '세션 중심 관리'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {documentsViewMode === 'documents'
                      ? '문서별로 업로드, 공유 상태를 관리합니다'
                      : '공유 세션별로 문서를 그룹화하여 관리합니다'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setDocumentsViewMode('documents')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      documentsViewMode === 'documents'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      문서 중심
                    </div>
                  </button>
                  <button
                    onClick={() => setDocumentsViewMode('sessions')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      documentsViewMode === 'sessions'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      세션 중심
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {documentsViewMode === 'documents' ? (
              <>
                {/* 기존 문서 중심 뷰 */}
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">필터 및 검색</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="문서 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 프로젝트 필터 */}
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full appearance-none px-4 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">모든 프로젝트</option>
                {projects?.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* 카테고리 필터 */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full appearance-none px-4 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">모든 카테고리</option>
                <option value="buildup_deliverable">빌드업 산출물</option>
                <option value="kpi_report">KPI 보고서</option>
                <option value="ir_deck">IR Deck</option>
                <option value="business_plan">사업계획서</option>
                <option value="financial">재무제표</option>
                <option value="marketing">마케팅 지표</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* 활성 필터 및 키보드 단축키 안내 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              {(selectedProjectId !== 'all' || filterCategory !== 'all') && (
                <>
                  <span className="text-sm text-gray-600">활성 필터:</span>
                  {selectedProjectId !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      프로젝트: {projects?.find(p => p.id === selectedProjectId)?.title}
                      <button
                        onClick={() => setSelectedProjectId('all')}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      카테고리: {getCategoryLabel(filterCategory as any)}
                      <button
                        onClick={() => setFilterCategory('all')}
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </>
              )}
            </div>

            {/* 키보드 단축키 안내 */}
            <div className="text-xs text-gray-500">
              단축키: Ctrl+A (전체 선택), Ctrl+D (선택 해제), Del (삭제)
            </div>
          </div>
        </div>

        {/* Document List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {filteredDocs.length}개 문서 {selectedDocs.size > 0 && `(${selectedDocs.size}개 선택됨)`}
            </span>
          </div>

          {/* Table Header */}
          <div className="border-b bg-gray-50 px-4 py-3">
            <div className="grid grid-cols-9 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDocs(new Set(filteredDocs.map(doc => doc.id)));
                    } else {
                      setSelectedDocs(new Set());
                    }
                  }}
                />
              </div>
              <div className="col-span-3">파일명</div>
              <div className="col-span-1">카테고리</div>
              <div className="col-span-1">공유 상태</div>
              <div className="col-span-1">업로더</div>
              <div className="col-span-1">크기</div>
              <div className="col-span-1">업로드일</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {filteredDocs.map(doc => (
              <DraggableTableRow
                key={doc.id}
                document={doc}
                isSelected={selectedDocs.has(doc.id)}
                onSelectDoc={handleSelectDoc}
                onViewDocument={handleViewDocument}
                updateDocumentVisibility={updateDocumentVisibility}
                getCategoryLabel={getCategoryLabel}
                getVisibilityColor={getVisibilityColor}
                sharedSessions={sharedSessions}
              />
            ))}
          </div>
        </div>

        {/* Shared Documents Section - Bottom Section */}
        <div className="mt-6">
          <SharedDocumentsSection
            sharedDocs={sharedDocs}
            getCategoryLabel={getCategoryLabel}
          />
        </div>
              </>
            ) : (
              <>
                {/* 세션 중심 뷰 - 기존 SessionManagementTab 내용 통합 */}
                <SessionManagementTab
                  onCreateNewSession={() => setShowShareModal(true)}
                  onEditSession={(sessionId) => {
                    console.log('Edit session:', sessionId);
                    // TODO: 세션 상세 편집 모달 구현
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Floating Action Buttons - Only show in documents tab and documents view mode */}
        {activeTab === 'documents' && documentsViewMode === 'documents' && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        {/* Selection Counter - Only show when docs are selected */}
        {selectedDocs.size > 0 && (
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-bounce">
            {selectedDocs.size}개 선택됨
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (selectedDocs.size === 0) {
                alert('공유할 문서를 선택해주세요.');
                return;
              }
              handleShare();
            }}
            className={`w-14 h-14 ${
              selectedDocs.size > 0
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 hover:bg-gray-500'
            } text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105`}
            title="공유"
          >
            <Share2 className="w-6 h-6" />
          </button>

          <button
            onClick={async () => {
              if (selectedDocs.size === 0) {
                alert('다운로드할 문서를 선택해주세요.');
                return;
              }

              try {
                const selectedDocIds = Array.from(selectedDocs);

                if (selectedDocIds.length === 1) {
                  // 단일 파일 다운로드
                  await downloadDocument(selectedDocIds[0]);

                  // 성공 토스트
                  const toast = document.createElement('div');
                  toast.textContent = '다운로드 완료';
                  toast.className = 'fixed bottom-20 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
                  document.body.appendChild(toast);
                  setTimeout(() => {
                    document.body.removeChild(toast);
                  }, 2000);
                } else {
                  // 다중 파일 다운로드
                  const toast = document.createElement('div');
                  toast.textContent = `${selectedDocIds.length}개 파일 다운로드 중...`;
                  toast.className = 'fixed bottom-20 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                  document.body.appendChild(toast);

                  await downloadMultipleDocuments(selectedDocIds);

                  // 완료 메시지로 변경
                  toast.textContent = `${selectedDocIds.length}개 파일 다운로드 완료`;
                  toast.className = 'fixed bottom-20 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
                  setTimeout(() => {
                    document.body.removeChild(toast);
                  }, 3000);
                }

                // 선택 해제
                setSelectedDocs(new Set());

              } catch (error) {
                console.error('Download failed:', error);
                alert('다운로드 중 오류가 발생했습니다.');
              }
            }}
            className={`w-14 h-14 ${
              selectedDocs.size > 0
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 hover:bg-gray-500'
            } text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105`}
            title="다운로드"
          >
            <Download className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              if (selectedDocs.size === 0) {
                alert('삭제할 문서를 선택해주세요.');
                return;
              }
              if (confirm(`선택된 ${selectedDocs.size}개 문서를 삭제하시겠습니까?`)) {
                console.log('Delete selected documents:', Array.from(selectedDocs));
                setSelectedDocs(new Set());
                alert(`${selectedDocs.size}개 문서가 삭제되었습니다.`);
              }
            }}
            className={`w-14 h-14 ${
              selectedDocs.size > 0
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-400 hover:bg-gray-500'
            } text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105`}
            title="삭제"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
        )}

      {/* Enhanced Share Session Modal */}
      <ShareSessionModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        selectedDocuments={filteredDocs.filter(doc => selectedDocs.has(doc.id))}
        onCreateSession={handleCreateShareSession}
      />

      {/* Upload Progress Indicator */}
      {uploadQueue.length > 0 && (
        <UploadProgress
          uploads={uploadQueue}
          onCancel={(id) => {
            setUploadQueue(prev => prev.filter(u => u.id !== id));
          }}
          onRetry={async (id) => {
            const upload = uploadQueue.find(u => u.id === id);
            if (upload) {
              // 재시도 로직
              setUploadQueue(prev => prev.map(u =>
                u.id === id ? { ...u, status: 'pending' as const, progress: 0, error: undefined } : u
              ));
              await handleFilesUpload([upload.file]);
            }
          }}
          onClose={() => {
            // 완료된 항목만 제거
            setUploadQueue(prev => prev.filter(u => u.status !== 'completed' && u.status !== 'error'));
          }}
        />
      )}

      {/* Simple Test Modal */}

      {/* Document Detail Modal */}
      <DocumentDetailModal
        isOpen={showDocumentDetail}
        docData={selectedDocument}
        onClose={() => {
          setShowDocumentDetail(false);
          setSelectedDocument(null);
        }}
        onUpdate={handleDocumentUpdate}
      />
      </div>
    </div>
  );
};

export default VDR;