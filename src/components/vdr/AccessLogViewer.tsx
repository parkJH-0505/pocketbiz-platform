import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Download,
  Upload,
  Share2,
  Eye,
  User,
  Monitor,
  Smartphone,
  Tablet,
  Filter,
  Search,
  TrendingUp,
  BarChart3,
  Download as ExportIcon,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useVDRContext } from '../../contexts/VDRContext';
import type { EnhancedAccessLog, AccessLogFilter, AccessStatistics } from '../../contexts/VDRContext';

const AccessLogViewer: React.FC = () => {
  const {
    accessLogs,
    getAccessLogs,
    clearAccessLogs,
    exportAccessLogs,
    getAccessStatistics
  } = useVDRContext();

  const [activeView, setActiveView] = useState<'timeline' | 'statistics'>('timeline');
  const [filter, setFilter] = useState<AccessLogFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // 필터링된 로그 가져오기
  const filteredLogs = useMemo(() => {
    let logs = getAccessLogs(filter);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      logs = logs.filter(log =>
        log.details.documentName.toLowerCase().includes(query) ||
        log.userInfo.userName?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
      );
    }

    return logs;
  }, [filter, searchQuery, getAccessLogs]);

  // 통계 데이터
  const statistics = useMemo(() => getAccessStatistics(), [getAccessStatistics]);

  // 액션 아이콘 매핑
  const getActionIcon = (action: EnhancedAccessLog['action']) => {
    switch (action) {
      case 'view': return <Eye className="w-4 h-4" />;
      case 'download': return <Download className="w-4 h-4" />;
      case 'upload': return <Upload className="w-4 h-4" />;
      case 'share': return <Share2 className="w-4 h-4" />;
      case 'delete': return <Trash2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // 액션 색상 매핑
  const getActionColor = (action: EnhancedAccessLog['action']) => {
    switch (action) {
      case 'view': return 'text-blue-600 bg-blue-50';
      case 'download': return 'text-green-600 bg-green-50';
      case 'upload': return 'text-purple-600 bg-purple-50';
      case 'share': return 'text-orange-600 bg-orange-50';
      case 'delete': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 디바이스 아이콘
  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  // 성공/실패 아이콘
  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 헤더 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            접근 로그 분석
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAccessLogs('csv')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ExportIcon className="w-4 h-4" />
              CSV 내보내기
            </button>
            <button
              onClick={() => exportAccessLogs('json')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ExportIcon className="w-4 h-4" />
              JSON 내보내기
            </button>
            <button
              onClick={() => clearAccessLogs()}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              로그 삭제
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('timeline')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'timeline'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            타임라인
          </button>
          <button
            onClick={() => setActiveView('statistics')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'statistics'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            통계
          </button>
        </div>
      </div>

      {/* 타임라인 뷰 */}
      {activeView === 'timeline' && (
        <div className="p-6">
          {/* 검색 및 필터 */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="문서명, 사용자명, 액션으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                필터
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* 필터 패널 */}
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">액션</label>
                    <select
                      value={filter.action || ''}
                      onChange={(e) => setFilter(prev => ({
                        ...prev,
                        action: e.target.value as EnhancedAccessLog['action'] || undefined
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">모든 액션</option>
                      <option value="view">조회</option>
                      <option value="download">다운로드</option>
                      <option value="upload">업로드</option>
                      <option value="share">공유</option>
                      <option value="delete">삭제</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
                    <input
                      type="date"
                      value={filter.startDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setFilter(prev => ({
                        ...prev,
                        startDate: e.target.value ? new Date(e.target.value) : undefined
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
                    <input
                      type="date"
                      value={filter.endDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setFilter(prev => ({
                        ...prev,
                        endDate: e.target.value ? new Date(e.target.value) : undefined
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setFilter({});
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 로그 목록 - 컴팩트 테이블 형태 */}
          <div className="border rounded-lg overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">접근 로그가 없습니다.</p>
              </div>
            ) : (
              <>
                {/* 테이블 헤더 */}
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    <div className="col-span-1">액션</div>
                    <div className="col-span-1">상태</div>
                    <div className="col-span-3">문서명</div>
                    <div className="col-span-2">사용자</div>
                    <div className="col-span-2">시간</div>
                    <div className="col-span-1">디바이스</div>
                    <div className="col-span-1">소요시간</div>
                    <div className="col-span-1">상세</div>
                  </div>
                </div>

                {/* 테이블 바디 */}
                <div className="divide-y divide-gray-100">
                  {filteredLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center text-sm">
                          {/* 액션 */}
                          <div className="col-span-1">
                            <div className={`inline-flex p-1.5 rounded ${getActionColor(log.action)}`}>
                              {getActionIcon(log.action)}
                            </div>
                          </div>

                          {/* 상태 */}
                          <div className="col-span-1">
                            {getStatusIcon(log.details.success)}
                          </div>

                          {/* 문서명 */}
                          <div className="col-span-3">
                            <span className="font-medium text-gray-900 truncate block">
                              {log.details.documentName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {log.details.documentCategory}
                            </span>
                          </div>

                          {/* 사용자 */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="truncate">
                                {log.userInfo.userName || '익명'}
                              </span>
                            </div>
                            {log.userInfo.userRole && (
                              <span className="text-xs text-gray-500">
                                {log.userInfo.userRole}
                              </span>
                            )}
                          </div>

                          {/* 시간 */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">
                                {log.timestamp.toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>

                          {/* 디바이스 */}
                          <div className="col-span-1">
                            <div className="flex items-center gap-1">
                              {getDeviceIcon(log.metadata?.deviceType)}
                              <span className="text-xs truncate">
                                {log.metadata?.deviceType || 'desktop'}
                              </span>
                            </div>
                          </div>

                          {/* 소요시간 */}
                          <div className="col-span-1">
                            <span className="text-xs text-gray-600">
                              {log.details.duration ? `${log.details.duration}초` : '-'}
                            </span>
                          </div>

                          {/* 상세 버튼 */}
                          <div className="col-span-1">
                            <button
                              onClick={() => setExpandedLog(
                                expandedLog === log.id ? null : log.id
                              )}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="상세 정보"
                            >
                              {expandedLog === log.id ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 확장 정보 */}
                      {expandedLog === log.id && (
                        <div className="px-4 py-3 bg-gray-50 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                                <User className="w-4 h-4" />
                                사용자 정보
                              </h4>
                              <div className="space-y-1.5 text-gray-600">
                                <div className="flex justify-between">
                                  <span>사용자 ID:</span>
                                  <span className="font-mono text-xs">{log.userInfo.userId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>IP 주소:</span>
                                  <span className="font-mono text-xs">{log.userInfo.ipAddress || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>익명 접근:</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    log.userInfo.isAnonymous ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {log.userInfo.isAnonymous ? '예' : '아니오'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                문서 상세정보
                              </h4>
                              <div className="space-y-1.5 text-gray-600">
                                <div className="flex justify-between">
                                  <span>문서 ID:</span>
                                  <span className="font-mono text-xs truncate">{log.documentId}</span>
                                </div>
                                {log.details.fileSize && (
                                  <div className="flex justify-between">
                                    <span>파일 크기:</span>
                                    <span className="text-xs">{(log.details.fileSize / 1048576).toFixed(2)}MB</span>
                                  </div>
                                )}
                                {log.metadata?.downloadSpeed && (
                                  <div className="flex justify-between">
                                    <span>다운로드 속도:</span>
                                    <span className="text-xs">{log.metadata.downloadSpeed}KB/s</span>
                                  </div>
                                )}
                                {log.sessionId && (
                                  <div className="flex justify-between">
                                    <span>세션 ID:</span>
                                    <span className="font-mono text-xs truncate">{log.sessionId}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {log.details.errorMessage && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-medium text-red-800">오류 발생</span>
                                  <p className="text-red-700 text-sm mt-1">{log.details.errorMessage}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 통계 뷰 */}
      {activeView === 'statistics' && (
        <div className="p-6">
          {/* 요약 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-blue-900 font-medium">총 접근</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {statistics.totalAccess.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-green-600" />
                <span className="text-green-900 font-medium">고유 사용자</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {statistics.uniqueUsers.toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-purple-600" />
                <span className="text-purple-900 font-medium">다운로드</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {(statistics.actionBreakdown.download || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-orange-900 font-medium">오늘 접근</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {statistics.dailyStats[statistics.dailyStats.length - 1]?.accessCount || 0}
              </div>
            </div>
          </div>

          {/* 인기 문서 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">가장 많이 접근된 문서</h3>
            <div className="space-y-2">
              {statistics.topDocuments.slice(0, 5).map((doc, index) => (
                <div key={doc.documentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-200 text-yellow-800' :
                      index === 1 ? 'bg-gray-200 text-gray-800' :
                      index === 2 ? 'bg-orange-200 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 truncate">{doc.documentName}</span>
                  </div>
                  <span className="text-sm text-gray-600">{doc.accessCount}회</span>
                </div>
              ))}
            </div>
          </div>

          {/* 액션별 통계 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">액션별 통계</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(statistics.actionBreakdown).map(([action, count]) => (
                <div key={action} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`inline-flex p-2 rounded-lg mb-2 ${getActionColor(action as EnhancedAccessLog['action'])}`}>
                    {getActionIcon(action as EnhancedAccessLog['action'])}
                  </div>
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{action}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 디바이스별 통계 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">디바이스별 접근</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(statistics.deviceBreakdown).map(([device, count]) => (
                <div key={device} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="inline-flex p-2 rounded-lg mb-2 bg-blue-100 text-blue-600">
                    {getDeviceIcon(device)}
                  </div>
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{device}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessLogViewer;