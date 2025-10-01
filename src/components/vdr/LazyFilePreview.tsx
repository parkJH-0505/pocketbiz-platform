/**
 * Phase 5.2: 파일 미리보기 지연 로딩 컴포넌트
 * Intersection Observer를 활용하여 보이는 영역의 파일만 로드
 */

import React, { useState, useEffect, useRef } from 'react';
import { VDRDocument } from '../../contexts/VDRContext';
import { fileStorage, FileStorageService } from '../../services/fileStorage';
import { FileText, Image, File, Loader2, AlertCircle } from 'lucide-react';

interface LazyFilePreviewProps {
  document: VDRDocument;
  className?: string;
  fallback?: React.ReactNode;
}

export const LazyFilePreview: React.FC<LazyFilePreviewProps> = ({
  document,
  className = '',
  fallback
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer로 뷰포트 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect(); // 한 번 로드되면 observer 해제
          }
        });
      },
      {
        rootMargin: '100px', // 100px 전에 미리 로드 시작
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 뷰포트에 들어오면 미리보기 로드
  useEffect(() => {
    if (!isInView || previewUrl || isLoading) return;

    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let url: string | null = null;

        // 이미지 파일인 경우
        if (isImageFile(document)) {
          if (document.storageType === 'base64' && document.fileContent) {
            // Base64 이미지 직접 사용
            url = document.fileContent;
          } else if (document.storageType === 'indexedDB' && document.storageKey) {
            // IndexedDB에서 이미지 로드
            const storedFile = await fileStorage.getFile(document.storageKey);
            if (storedFile) {
              url = URL.createObjectURL(storedFile.blob);
            }
          }
        }
        // PDF 파일인 경우 (향후 PDF.js 통합 가능)
        else if (isPdfFile(document)) {
          // 현재는 아이콘만 표시, 향후 PDF 미리보기 구현
          url = null;
        }

        setPreviewUrl(url);
      } catch (err) {
        console.error('[LazyFilePreview] Failed to load preview:', err);
        setError('미리보기를 로드할 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [isInView, document, previewUrl, isLoading]);

  // 컴포넌트 언마운트시 URL 해제
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isImageFile = (doc: VDRDocument): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    return imageExtensions.includes(doc.fileType?.toLowerCase() || '');
  };

  const isPdfFile = (doc: VDRDocument): boolean => {
    return doc.fileType?.toLowerCase() === '.pdf';
  };

  const getFileIcon = () => {
    if (isImageFile(document)) {
      return <Image className="w-16 h-16 text-blue-400" />;
    }
    if (isPdfFile(document)) {
      return <FileText className="w-16 h-16 text-red-400" />;
    }
    return <File className="w-16 h-16 text-gray-400" />;
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-50 rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: '200px' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isInView && !isLoading && !error && (
        <div className="flex items-center justify-center h-full">
          {fallback || (
            <div className="text-center">
              {getFileIcon()}
              <p className="text-xs text-gray-500 mt-2">스크롤하여 미리보기</p>
            </div>
          )}
        </div>
      )}

      {previewUrl && isImageFile(document) && (
        <img
          src={previewUrl}
          alt={document.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      )}

      {isInView && !previewUrl && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center h-full">
          {getFileIcon()}
          <p className="text-sm font-medium text-gray-700 mt-2">{document.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {(document.size / 1024).toFixed(1)} KB
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * 미리보기 그리드 컴포넌트
 */
export const LazyPreviewGrid: React.FC<{
  documents: VDRDocument[];
  columns?: number;
}> = ({ documents, columns = 3 }) => {
  return (
    <div
      className={`grid gap-4`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {documents.map((doc) => (
        <div key={doc.id} className="relative group">
          <LazyFilePreview
            document={doc}
            className="aspect-square border border-gray-200 group-hover:border-blue-400 transition-colors"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs text-white truncate">{doc.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LazyFilePreview;