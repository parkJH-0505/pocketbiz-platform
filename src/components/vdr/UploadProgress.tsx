import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, File } from 'lucide-react';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadProgressProps {
  uploads: UploadItem[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onClose?: () => void;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  uploads,
  onCancel,
  onRetry,
  onClose
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // 모든 업로드가 완료되면 자동으로 최소화
  useEffect(() => {
    const allCompleted = uploads.length > 0 &&
      uploads.every(u => u.status === 'completed' || u.status === 'error');

    if (allCompleted) {
      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploads]);

  if (uploads.length === 0) return null;

  const completedCount = uploads.filter(u => u.status === 'completed').length;
  const errorCount = uploads.filter(u => u.status === 'error').length;
  const totalProgress = uploads.reduce((sum, u) => sum + u.progress, 0) / uploads.length;

  // 파일 크기 포맷
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 상태별 아이콘
  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  // 상태별 색상
  const getProgressColor = (status: UploadItem['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              {errorCount > 0 ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : completedCount === uploads.length ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              )}
            </div>
            {/* 진행률 링 */}
            {totalProgress > 0 && totalProgress < 100 && (
              <svg className="absolute inset-0 w-8 h-8 -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-blue-500"
                  strokeDasharray={`${totalProgress * 0.88} 88`}
                />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {completedCount === uploads.length
                ? '업로드 완료'
                : `업로드 중 (${completedCount}/${uploads.length})`}
            </p>
            {errorCount > 0 && (
              <p className="text-xs text-red-600">{errorCount}개 실패</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 파일 목록 */}
      {!isMinimized && (
        <div className="max-h-96 overflow-y-auto">
          {uploads.map((upload) => (
            <div key={upload.id} className="p-4 border-b last:border-b-0">
              <div className="flex items-start gap-3">
                {getStatusIcon(upload.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {upload.file.name}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatSize(upload.file.size)}
                    </span>
                  </div>

                  {/* 진행률 바 */}
                  {upload.status === 'uploading' && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          {upload.progress}% 완료
                        </span>
                        {onCancel && (
                          <button
                            onClick={() => onCancel(upload.id)}
                            className="text-xs text-gray-500 hover:text-red-600"
                          >
                            취소
                          </button>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getProgressColor(upload.status)}`}
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 에러 메시지 */}
                  {upload.status === 'error' && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-red-600">
                        {upload.error || '업로드 실패'}
                      </p>
                      {onRetry && (
                        <button
                          onClick={() => onRetry(upload.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          재시도
                        </button>
                      )}
                    </div>
                  )}

                  {/* 완료 메시지 */}
                  {upload.status === 'completed' && (
                    <p className="text-xs text-green-600">업로드 완료</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 전체 진행률 바 (최소화되지 않았을 때) */}
      {!isMinimized && uploads.some(u => u.status === 'uploading') && (
        <div className="p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">전체 진행률</span>
            <span className="text-xs font-medium text-gray-900">
              {Math.round(totalProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadProgress;