import React, { useState, useRef, DragEvent } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // bytes
  maxFiles?: number;
  className?: string;
  category?: string; // 카테고리별 제한 표시용
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  accept = '*',
  maxSize = 100 * 1024 * 1024, // 100MB default
  maxFiles = 10,
  className = '',
  category
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 검증
  const validateFiles = (files: File[]): { valid: File[], errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    if (files.length > maxFiles) {
      errors.push(`최대 ${maxFiles}개의 파일만 업로드 가능합니다.`);
      return { valid: [], errors };
    }

    for (const file of files) {
      // 크기 검증
      if (file.size > maxSize) {
        errors.push(`${file.name}: 파일 크기가 ${(maxSize / 1048576).toFixed(0)}MB를 초과합니다.`);
        continue;
      }

      // 타입 검증 (accept가 지정된 경우)
      if (accept !== '*') {
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const mimeType = file.type;

        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type.toLowerCase();
          }
          if (type.includes('*')) {
            return mimeType.startsWith(type.replace('*', ''));
          }
          return mimeType === type;
        });

        if (!isAccepted) {
          errors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`);
          continue;
        }
      }

      valid.push(file);
    }

    return { valid, errors };
  };

  // 드래그 이벤트 핸들러
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    setError('');

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors.join('\n'));
      setTimeout(() => setError(''), 5000);
    }

    if (valid.length > 0) {
      onFilesSelected(valid);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors.join('\n'));
      setTimeout(() => setError(''), 5000);
    }

    if (valid.length > 0) {
      onFilesSelected(valid);
    }

    // 입력 초기화 (같은 파일 재선택 가능)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 드롭존 영역 */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        {/* 아이콘 */}
        <div className={`mb-4 transition-transform ${isDragging ? 'scale-110' : ''}`}>
          {isDragging ? (
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Upload className="w-12 h-12 text-blue-500 opacity-30" />
              </div>
              <Upload className="w-12 h-12 text-blue-500" />
            </div>
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {/* 안내 문구 */}
        <div className="space-y-2">
          <p className={`text-lg font-medium ${isDragging ? 'text-blue-600' : 'text-gray-700'}`}>
            {isDragging ? '파일을 놓아주세요' : '파일을 드래그하거나 클릭하여 선택'}
          </p>
          <p className="text-sm text-gray-500">
            최대 {maxFiles}개 파일, 각 {(maxSize / 1048576).toFixed(0)}MB까지
          </p>
          {accept !== '*' && (
            <p className="text-xs text-gray-400">
              지원 형식: {accept}
            </p>
          )}
        </div>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 드래그 중 오버레이 */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <p className="text-blue-600 font-medium">파일을 여기에 놓으세요</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">업로드 오류</p>
              <p className="text-xs text-red-700 whitespace-pre-line mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 추가 안내 */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <File className="w-4 h-4" />
          <span>문서, 이미지, 압축 파일</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          <span>자동 바이러스 검사</span>
        </div>
      </div>
    </div>
  );
};

export default FileDropZone;