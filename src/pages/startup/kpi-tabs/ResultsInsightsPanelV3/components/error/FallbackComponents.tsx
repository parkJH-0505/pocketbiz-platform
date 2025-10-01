/**
 * Fallback UI Components
 * 에러 발생 시 표시되는 폴백 컴포넌트들
 */

import React from 'react';
import {
  AlertTriangle,
  WifiOff,
  Database,
  RefreshCw,
  Loader,
  FileQuestion,
  ServerCrash,
  ShieldOff
} from 'lucide-react';

/**
 * 폴백 컴포넌트 Props
 */
interface FallbackProps {
  error?: Error;
  retry?: () => void;
  className?: string;
}

/**
 * 차트 폴백 컴포넌트
 */
export const ChartFallback: React.FC<FallbackProps> = ({ error, retry, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
      <div className="text-gray-400 mb-4">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <rect x="20" y="150" width="30" height="30" fill="#E5E7EB" />
          <rect x="60" y="120" width="30" height="60" fill="#E5E7EB" />
          <rect x="100" y="100" width="30" height="80" fill="#E5E7EB" />
          <rect x="140" y="130" width="30" height="50" fill="#E5E7EB" />
          <text x="100" y="190" textAnchor="middle" fill="#9CA3AF" fontSize="12">
            차트 로드 실패
          </text>
        </svg>
      </div>
      <p className="text-sm text-gray-600 mb-4">차트를 표시할 수 없습니다</p>
      {retry && (
        <button
          onClick={retry}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          다시 로드
        </button>
      )}
    </div>
  );
};

/**
 * 데이터 테이블 폴백
 */
export const TableFallback: React.FC<FallbackProps> = ({ error, retry, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-8">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Database size={48} className="mb-4" />
          <p className="text-sm font-medium mb-2">데이터를 불러올 수 없습니다</p>
          <p className="text-xs text-gray-500 mb-4">
            {error?.message || '일시적인 문제가 발생했습니다'}
          </p>
          {retry && (
            <button
              onClick={retry}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              다시 시도 →
            </button>
          )}
        </div>

        {/* 스켈레톤 테이블 */}
        <div className="mt-6 animate-pulse">
          <div className="h-10 bg-gray-100 rounded mb-2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 인사이트 카드 폴백
 */
export const InsightCardFallback: React.FC<FallbackProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-100 rounded w-5/6"></div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 bg-gray-100 rounded px-8"></div>
          <div className="h-8 bg-gray-100 rounded px-8"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * 네트워크 에러 폴백
 */
export const NetworkErrorFallback: React.FC<FallbackProps> = ({ retry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <WifiOff size={64} className="text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        네트워크 연결 실패
      </h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md">
        서버와 연결할 수 없습니다. 인터넷 연결을 확인하고 다시 시도해주세요.
      </p>
      {retry && (
        <button
          onClick={retry}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          다시 연결
        </button>
      )}
    </div>
  );
};

/**
 * 데이터 없음 폴백
 */
export const NoDataFallback: React.FC<{ message?: string }> = ({
  message = '표시할 데이터가 없습니다'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <FileQuestion size={64} className="text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 없음</h3>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
};

/**
 * 로딩 폴백
 */
export const LoadingFallback: React.FC<{ message?: string }> = ({
  message = '데이터를 불러오는 중...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <Loader className="animate-spin text-indigo-600 mb-4" size={32} />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
};

/**
 * 권한 에러 폴백
 */
export const PermissionErrorFallback: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50 rounded-lg">
      <ShieldOff size={64} className="text-red-400 mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        접근 권한 없음
      </h3>
      <p className="text-sm text-red-700 mb-6 max-w-md">
        이 콘텐츠에 접근할 권한이 없습니다. 관리자에게 문의하세요.
      </p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        홈으로 이동
      </button>
    </div>
  );
};

/**
 * 서버 에러 폴백
 */
export const ServerErrorFallback: React.FC<FallbackProps> = ({ retry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <ServerCrash size={64} className="text-orange-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        서버 오류
      </h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md">
        서버에서 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="flex gap-3">
        {retry && (
          <button
            onClick={retry}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            다시 시도
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          페이지 새로고침
        </button>
      </div>
    </div>
  );
};

/**
 * 일반 에러 폴백
 */
export const GenericErrorFallback: React.FC<FallbackProps> = ({ error, retry }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
      <div className="flex items-start">
        <AlertTriangle className="text-red-500 mt-1" size={20} />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            문제가 발생했습니다
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error?.message || '예상치 못한 오류가 발생했습니다.'}</p>
          </div>

          {error?.stack && (
            <div className="mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-red-600 hover:text-red-500 underline"
              >
                {showDetails ? '상세 정보 숨기기' : '상세 정보 보기'}
              </button>

              {showDetails && (
                <pre className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800 overflow-auto max-h-32">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {retry && (
              <button
                onClick={retry}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
              >
                다시 시도
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 스켈레톤 로더
 */
export const SkeletonLoader: React.FC<{
  type?: 'text' | 'card' | 'chart' | 'table';
  rows?: number;
}> = ({ type = 'text', rows = 3 }) => {
  if (type === 'text') {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${100 - i * 15}%` }}></div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="animate-pulse bg-white p-6 rounded-lg border">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="animate-pulse bg-white p-6 rounded-lg border">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="animate-pulse bg-white rounded-lg border">
        <div className="h-12 bg-gray-100 rounded-t"></div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-50"></div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

/**
 * 적응형 폴백 컴포넌트
 * 에러 타입에 따라 적절한 폴백 UI를 자동 선택
 */
export const AdaptiveFallback: React.FC<{
  error?: Error;
  retry?: () => void;
  type?: 'chart' | 'table' | 'card' | 'generic';
}> = ({ error, retry, type = 'generic' }) => {
  // 에러 타입 분석
  const isNetworkError = error?.message.toLowerCase().includes('network') ||
                         error?.message.toLowerCase().includes('fetch');
  const isPermissionError = error?.message.toLowerCase().includes('permission') ||
                           error?.message.toLowerCase().includes('unauthorized');
  const isServerError = error?.message.toLowerCase().includes('500') ||
                       error?.message.toLowerCase().includes('server');

  // 에러 타입별 폴백 선택
  if (isNetworkError) {
    return <NetworkErrorFallback retry={retry} />;
  }
  if (isPermissionError) {
    return <PermissionErrorFallback />;
  }
  if (isServerError) {
    return <ServerErrorFallback retry={retry} />;
  }

  // 컴포넌트 타입별 폴백
  switch (type) {
    case 'chart':
      return <ChartFallback error={error} retry={retry} />;
    case 'table':
      return <TableFallback error={error} retry={retry} />;
    case 'card':
      return <InsightCardFallback />;
    default:
      return <GenericErrorFallback error={error} retry={retry} />;
  }
};