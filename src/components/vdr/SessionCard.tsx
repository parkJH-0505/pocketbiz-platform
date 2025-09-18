import React from 'react';
import {
  Link2,
  Calendar,
  Clock,
  FileText,
  Users,
  Copy,
  Edit,
  Trash2,
  Pause,
  Play,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  ExternalLink
} from 'lucide-react';
import type { SharedSession, VDRDocument } from '../../contexts/VDRContext';

type SessionStatus = 'active' | 'expired' | 'paused' | 'expiring';

interface SessionCardProps {
  session: SharedSession;
  documents: VDRDocument[];
  onEdit?: (sessionId: string) => void;
  onCopyLink?: (link: string) => void;
  isSelected?: boolean;
  onSelect?: (sessionId: string, selected: boolean) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  documents,
  onEdit,
  onCopyLink,
  isSelected = false,
  onSelect
}) => {
  // 세션 상태 계산
  const getSessionStatus = (session: SharedSession): SessionStatus => {
    if (!session.expiresAt) return 'active';

    const now = new Date();
    const expiryDate = new Date(session.expiresAt);
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (expiryDate < now) return 'expired';
    if (hoursUntilExpiry <= 24) return 'expiring';
    return 'active';
  };

  // 세션 상태별 스타일
  const getStatusStyle = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          borderColor: 'border-green-200',
          icon: <CheckCircle className="w-4 h-4" />,
          label: '활성'
        };
      case 'expiring':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          icon: <AlertCircle className="w-4 h-4" />,
          label: '만료 임박'
        };
      case 'expired':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          borderColor: 'border-red-200',
          icon: <XCircle className="w-4 h-4" />,
          label: '만료됨'
        };
      case 'paused':
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          borderColor: 'border-gray-200',
          icon: <Pause className="w-4 h-4" />,
          label: '일시정지'
        };
    }
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

  // 세션의 문서 정보
  const sessionDocuments = documents.filter(doc => session.documentIds.includes(doc.id));
  const status = getSessionStatus(session);
  const statusStyle = getStatusStyle(status);

  return (
    <div className={`
      relative bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer
      ${isSelected
        ? 'border-blue-500 shadow-lg shadow-blue-100'
        : `${statusStyle.borderColor} hover:shadow-md`
      }
      ${status === 'expired' ? 'opacity-75' : ''}
    `}>
      {/* 체크박스 (선택 모드일 때) */}
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(session.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>
      )}

      {/* 카드 내용 */}
      <div className="p-6">
        {/* 헤더 섹션 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {session.name}
              </h3>
            </div>

            {/* 상태 배지 */}
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
              {statusStyle.icon}
              {statusStyle.label}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopyLink?.(session.link);
              }}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="링크 복사"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(session.link, '_blank');
              }}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="새 탭에서 열기"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(session.id);
                }}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="수정"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="더보기"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {sessionDocuments.length}
              </div>
              <div className="text-xs text-gray-500">문서</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {session.accessCount}
              </div>
              <div className="text-xs text-gray-500">접근</div>
            </div>
          </div>
        </div>

        {/* 시간 정보 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">생성일</span>
            <span className="text-gray-900">
              {new Date(session.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">만료일</span>
            <div className="text-right">
              {session.expiresAt ? (
                <>
                  <div className="text-gray-900">
                    {new Date(session.expiresAt).toLocaleDateString('ko-KR')}
                  </div>
                  <div className={`text-xs ${
                    status === 'expiring' ? 'text-yellow-600' :
                    status === 'expired' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {getTimeRemaining(session.expiresAt)}
                  </div>
                </>
              ) : (
                <span className="text-gray-400">무제한</span>
              )}
            </div>
          </div>
        </div>

        {/* 문서 미리보기 */}
        {sessionDocuments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-2">포함된 문서</div>
            <div className="space-y-1">
              {sessionDocuments.slice(0, 3).map(doc => (
                <div key={doc.id} className="flex items-center gap-2 text-xs">
                  <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 truncate">{doc.name}</span>
                </div>
              ))}
              {sessionDocuments.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{sessionDocuments.length - 3}개 더
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionCard;