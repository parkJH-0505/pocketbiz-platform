import React, { useState, useEffect, useMemo } from 'react';
import {
  Link2,
  Calendar,
  Clock,
  FileText,
  Users,
  Search,
  Filter,
  Grid,
  List,
  Copy,
  Edit,
  Trash2,
  Pause,
  Play,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Plus,
  Download,
  Eye,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { useVDRContext } from '../../contexts/VDRContext';
import type { SharedSession, VDRDocument } from '../../contexts/VDRContext';
import SessionCard from './SessionCard';

type ViewMode = 'table' | 'grid';
type SessionStatus = 'active' | 'expired' | 'paused' | 'expiring';
type FilterPeriod = 'all' | 'today' | 'week' | 'month';
type SortBy = 'recent' | 'expiring' | 'popular';

interface SessionManagementTabProps {
  onCreateNewSession?: () => void;
  onEditSession?: (sessionId: string) => void;
}

const SessionManagementTab: React.FC<SessionManagementTabProps> = ({
  onCreateNewSession,
  onEditSession
}) => {
  const { sharedSessions, documents } = useVDRContext();

  // UI 상태
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'all'>('all');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 세션 상태 계산 함수
  const getSessionStatus = (session: SharedSession): SessionStatus => {
    if (!session.expiresAt) return 'active';

    const now = new Date();
    const expiryDate = new Date(session.expiresAt);
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (expiryDate < now) return 'expired';
    if (hoursUntilExpiry <= 24) return 'expiring';
    // TODO: paused 상태는 추후 구현
    return 'active';
  };

  // 세션 상태별 색상 및 아이콘
  const getStatusStyle = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          icon: <CheckCircle className="w-4 h-4" />,
          label: '활성'
        };
      case 'expiring':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          icon: <AlertCircle className="w-4 h-4" />,
          label: '만료 임박'
        };
      case 'expired':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          icon: <XCircle className="w-4 h-4" />,
          label: '만료됨'
        };
      case 'paused':
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          icon: <Pause className="w-4 h-4" />,
          label: '일시정지'
        };
    }
  };

  // 필터링된 세션 목록
  const filteredSessions = useMemo(() => {
    let filtered = [...sharedSessions];

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.name.toLowerCase().includes(query)
      );
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(session =>
        getSessionStatus(session) === filterStatus
      );
    }

    // 기간 필터
    if (filterPeriod !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(session => {
        const createdAt = new Date(session.createdAt);
        switch (filterPeriod) {
          case 'today':
            return createdAt >= startOfDay;
          case 'week':
            return createdAt >= startOfWeek;
          case 'month':
            return createdAt >= startOfMonth;
          default:
            return true;
        }
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'expiring':
          const aExpiry = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
          const bExpiry = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
          return aExpiry - bExpiry;
        case 'popular':
          return b.accessCount - a.accessCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [sharedSessions, searchQuery, filterStatus, filterPeriod, sortBy]);

  // 세션의 문서 정보 가져오기
  const getSessionDocuments = (session: SharedSession): VDRDocument[] => {
    return documents.filter(doc => session.documentIds.includes(doc.id));
  };

  // 링크 복사 함수
  const copyShareLink = (link: string) => {
    navigator.clipboard.writeText(link);
    // TODO: 토스트 알림 추가
    console.log('Link copied:', link);
  };

  // 남은 시간 계산
  const getTimeRemaining = (expiresAt?: Date) => {
    if (!expiresAt) return '무제한';

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return '만료됨';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}일 남음`;
    if (hours > 0) return `${hours}시간 남음`;
    return '1시간 미만';
  };

  // 통계 정보
  const stats = useMemo(() => {
    const total = sharedSessions.length;
    const active = sharedSessions.filter(s => getSessionStatus(s) === 'active').length;
    const expiring = sharedSessions.filter(s => getSessionStatus(s) === 'expiring').length;
    const expired = sharedSessions.filter(s => getSessionStatus(s) === 'expired').length;

    return { total, active, expiring, expired };
  }, [sharedSessions]);

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">세션 관리</h2>
            <p className="text-gray-600 mt-1">공유 세션을 관리하고 접근 권한을 제어합니다</p>
          </div>
          <button
            onClick={onCreateNewSession}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 세션 만들기
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 세션</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Link2 className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">활성 세션</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">만료 임박</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.expiring}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">만료됨</p>
                <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 툴바 섹션 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* 검색 */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="세션명으로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 필터 버튼 */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                필터
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* 필터 드롭다운 */}
              {showFilterMenu && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                  <div className="space-y-4">
                    {/* 상태 필터 */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">상태</p>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as SessionStatus | 'all')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="all">전체</option>
                        <option value="active">활성</option>
                        <option value="expiring">만료 임박</option>
                        <option value="expired">만료됨</option>
                        <option value="paused">일시정지</option>
                      </select>
                    </div>

                    {/* 기간 필터 */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">기간</p>
                      <select
                        value={filterPeriod}
                        onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="all">전체</option>
                        <option value="today">오늘</option>
                        <option value="week">이번 주</option>
                        <option value="month">이번 달</option>
                      </select>
                    </div>

                    {/* 정렬 */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">정렬</p>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="recent">최신순</option>
                        <option value="expiring">만료 임박순</option>
                        <option value="popular">접근 많은순</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 뷰 모드 전환 */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${
                viewMode === 'table'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 세션 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">세션이 없습니다</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterStatus !== 'all' || filterPeriod !== 'all'
                ? '필터 조건에 맞는 세션이 없습니다'
                : '첫 번째 공유 세션을 만들어보세요'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterPeriod === 'all' && (
              <button
                onClick={onCreateNewSession}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                새 세션 만들기
              </button>
            )}
          </div>
        ) : (
          <div>
            {viewMode === 'table' ? (
              // 테이블 뷰
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedSessions.size === filteredSessions.length && filteredSessions.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSessions(new Set(filteredSessions.map(s => s.id)));
                            } else {
                              setSelectedSessions(new Set());
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        세션명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        생성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        만료일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        문서
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        접근
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSessions.map(session => {
                      const status = getSessionStatus(session);
                      const statusStyle = getStatusStyle(status);
                      const sessionDocs = getSessionDocuments(session);

                      return (
                        <tr
                          key={session.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedSessions.has(session.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedSessions);
                                if (e.target.checked) {
                                  newSelected.add(session.id);
                                } else {
                                  newSelected.delete(session.id);
                                }
                                setSelectedSessions(newSelected);
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Link2 className="w-4 h-4 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {session.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {sessionDocs.length}개 문서 포함
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                              {statusStyle.icon}
                              {statusStyle.label}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(session.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {session.expiresAt ? (
                                <div>
                                  <div>{new Date(session.expiresAt).toLocaleDateString('ko-KR')}</div>
                                  <div className="text-xs text-gray-500">
                                    {getTimeRemaining(session.expiresAt)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">무제한</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {sessionDocs.length}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {session.accessCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => copyShareLink(session.link)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="링크 복사"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => window.open(session.link, '_blank')}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="새 탭에서 열기"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              {onEditSession && (
                                <button
                                  onClick={() => onEditSession(session.id)}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="수정"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                title="더보기"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              // 그리드 뷰
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredSessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      documents={getSessionDocuments(session)}
                      onEdit={onEditSession}
                      onCopyLink={copyShareLink}
                      isSelected={selectedSessions.has(session.id)}
                      onSelect={(sessionId, selected) => {
                        const newSelected = new Set(selectedSessions);
                        if (selected) {
                          newSelected.add(sessionId);
                        } else {
                          newSelected.delete(sessionId);
                        }
                        setSelectedSessions(newSelected);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManagementTab;