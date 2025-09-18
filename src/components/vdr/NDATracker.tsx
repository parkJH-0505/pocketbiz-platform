import React, { useState, useMemo } from 'react';
import {
  FileSignature,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Filter,
  Search,
  Calendar,
  User,
  Building,
  Mail,
  RefreshCw
} from 'lucide-react';

interface NDASignature {
  id: string;
  sessionId: string;
  sessionName: string;
  signerName: string;
  signerEmail: string;
  signerCompany: string;
  signerTitle?: string;
  templateId: string;
  templateName: string;
  status: 'pending' | 'signed' | 'expired' | 'declined';
  requestedAt: Date;
  signedAt?: Date;
  deadline?: Date;
  ipAddress?: string;
  documentUrl?: string;
}

interface NDATrackerProps {
  signatures: NDASignature[];
  onRefresh?: () => void;
  onViewDocument?: (signatureId: string) => void;
  onDownloadDocument?: (signatureId: string) => void;
  onResendRequest?: (signatureId: string) => void;
}

const NDATracker: React.FC<NDATrackerProps> = ({
  signatures,
  onRefresh,
  onViewDocument,
  onDownloadDocument,
  onResendRequest
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');

  // 통계 계산
  const stats = useMemo(() => {
    const total = signatures.length;
    const signed = signatures.filter(s => s.status === 'signed').length;
    const pending = signatures.filter(s => s.status === 'pending').length;
    const expired = signatures.filter(s => s.status === 'expired').length;
    const signedPercentage = total > 0 ? Math.round((signed / total) * 100) : 0;

    return { total, signed, pending, expired, signedPercentage };
  }, [signatures]);

  // 필터링 및 정렬
  const filteredSignatures = useMemo(() => {
    let filtered = signatures;

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(sig =>
        sig.signerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sig.signerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sig.signerCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sig.sessionName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sig => sig.status === filterStatus);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.signerName.localeCompare(b.signerName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      }
    });

    return filtered;
  }, [signatures, searchTerm, filterStatus, sortBy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            서명완료
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case 'expired':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            만료
          </span>
        );
      case 'declined':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            거절됨
          </span>
        );
      default:
        return null;
    }
  };

  const getDaysUntilDeadline = (deadline?: Date) => {
    if (!deadline) return null;
    const now = new Date();
    const diff = new Date(deadline).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return '만료됨';
    if (days === 0) return '오늘 만료';
    if (days === 1) return '내일 만료';
    return `${days}일 남음`;
  };

  return (
    <div className="space-y-6">
      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">전체 요청</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileSignature className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">서명 완료</p>
              <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${stats.signedPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.signedPercentage}% 완료율</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">대기 중</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">만료됨</p>
              <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름, 이메일, 회사명으로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">모든 상태</option>
              <option value="signed">서명완료</option>
              <option value="pending">대기중</option>
              <option value="expired">만료</option>
              <option value="declined">거절됨</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">날짜순</option>
              <option value="name">이름순</option>
              <option value="status">상태순</option>
            </select>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NDA 서명 목록 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">서명자 정보</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">공유 세션</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">서명일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">기한</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSignatures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <FileSignature className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">NDA 서명 요청이 없습니다</p>
                  </td>
                </tr>
              ) : (
                filteredSignatures.map((signature) => (
                  <tr key={signature.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {getStatusBadge(signature.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{signature.signerName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{signature.signerEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{signature.signerCompany}</span>
                          {signature.signerTitle && (
                            <span className="text-xs text-gray-400">· {signature.signerTitle}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">{signature.sessionName}</p>
                        <p className="text-xs text-gray-500">{signature.templateName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(signature.requestedAt).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(signature.requestedAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {signature.signedAt ? (
                        <div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {new Date(signature.signedAt).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(signature.signedAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {signature.ipAddress && (
                            <div className="text-xs text-gray-400 mt-1">
                              IP: {signature.ipAddress}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {signature.deadline ? (
                        <div>
                          <div className="text-xs text-gray-500">
                            {new Date(signature.deadline).toLocaleDateString('ko-KR')}
                          </div>
                          {signature.status === 'pending' && (
                            <div className={`text-xs font-medium ${
                              getDaysUntilDeadline(signature.deadline) === '오늘 만료' ||
                              getDaysUntilDeadline(signature.deadline) === '내일 만료'
                                ? 'text-orange-600'
                                : 'text-gray-500'
                            }`}>
                              {getDaysUntilDeadline(signature.deadline)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">무제한</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {signature.status === 'signed' && signature.documentUrl && (
                          <>
                            <button
                              onClick={() => onViewDocument && onViewDocument(signature.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="문서 보기"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => onDownloadDocument && onDownloadDocument(signature.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="다운로드"
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          </>
                        )}
                        {signature.status === 'pending' && (
                          <button
                            onClick={() => onResendRequest && onResendRequest(signature.id)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            재발송
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NDATracker;