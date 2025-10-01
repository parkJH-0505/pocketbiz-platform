/**
 * Phase 5.1: 가상 스크롤링을 활용한 대량 문서 목록 표시
 * react-window를 사용하여 성능 최적화
 */

import React, { memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { VDRDocument } from '../../contexts/VDRContext';
import {
  FileText,
  Image,
  File,
  Download,
  Eye,
  Share2,
  MoreVertical,
  Lock,
  Users,
  Globe
} from 'lucide-react';

interface VirtualDocumentListProps {
  documents: VDRDocument[];
  height: number;
  onDocumentClick?: (doc: VDRDocument) => void;
  onDownload?: (doc: VDRDocument) => void;
  onShare?: (doc: VDRDocument) => void;
}

// 개별 문서 행 컴포넌트 (메모이제이션으로 최적화)
const DocumentRow = memo(({
  index,
  style,
  data
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    documents: VDRDocument[];
    onDocumentClick?: (doc: VDRDocument) => void;
    onDownload?: (doc: VDRDocument) => void;
    onShare?: (doc: VDRDocument) => void;
  };
}) => {
  const doc = data.documents[index];
  const { onDocumentClick, onDownload, onShare } = data;

  // 파일 아이콘 결정
  const getFileIcon = () => {
    const ext = doc.fileType?.toLowerCase();
    if (['.jpg', '.png', '.gif', '.jpeg'].includes(ext || '')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (['.pdf'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // 공개 범위 아이콘
  const getVisibilityIcon = () => {
    switch (doc.visibility) {
      case 'private':
        return <Lock className="w-4 h-4 text-gray-500" />;
      case 'team':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'public':
        return <Globe className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // 날짜 포맷
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div
      style={style}
      className="flex items-center px-4 py-2 border-b border-gray-200 hover:bg-gray-50 transition-colors"
    >
      {/* 파일 아이콘 */}
      <div className="w-10 flex-shrink-0">
        {getFileIcon()}
      </div>

      {/* 파일명 및 정보 */}
      <div className="flex-1 min-w-0 mr-4">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onDocumentClick?.(doc)}
        >
          <span className="text-sm font-medium text-gray-900 truncate">
            {doc.name}
          </span>
          {doc.currentVersion && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {doc.currentVersion}
            </span>
          )}
          {doc.tags?.includes('orphaned') && (
            <span className="text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
              고아 문서
            </span>
          )}
          {doc.tags?.includes('trashed') && (
            <span className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
              휴지통
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500">
            {formatFileSize(doc.size)}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(doc.uploadDate)}
          </span>
          {doc.projectName && (
            <span className="text-xs text-blue-600">
              {doc.projectName}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {doc.uploadedBy}
          </span>
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="flex items-center gap-4 mr-4">
        {getVisibilityIcon()}
        {doc.downloadCount && doc.downloadCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Download className="w-3 h-3" />
            <span>{doc.downloadCount}</span>
          </div>
        )}
        {doc.viewCount && doc.viewCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Eye className="w-3 h-3" />
            <span>{doc.viewCount}</span>
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload?.(doc);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="다운로드"
        >
          <Download className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare?.(doc);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="공유"
        >
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
        <button
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="더보기"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
});

DocumentRow.displayName = 'DocumentRow';

/**
 * 가상 스크롤링 문서 목록 컴포넌트
 */
export const VirtualDocumentList: React.FC<VirtualDocumentListProps> = ({
  documents,
  height,
  onDocumentClick,
  onDownload,
  onShare
}) => {
  const itemData = {
    documents,
    onDocumentClick,
    onDownload,
    onShare
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            문서 목록 ({documents.length}개)
          </h3>
          <div className="text-xs text-gray-500">
            가상 스크롤링 적용 (최적화됨)
          </div>
        </div>
      </div>

      {/* 가상 스크롤 리스트 */}
      {documents.length > 0 ? (
        <List
          height={height}
          itemCount={documents.length}
          itemSize={64} // 각 행의 높이
          width="100%"
          itemData={itemData}
        >
          {DocumentRow}
        </List>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <File className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">문서가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default VirtualDocumentList;