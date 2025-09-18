import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  File,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Eye,
  Play,
  Volume2,
  Film
} from 'lucide-react';
import type { VDRDocument } from '../../contexts/VDRContext';

interface DocumentPreviewProps {
  document: VDRDocument;
  className?: string;
  onPreviewError?: (error: string) => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  className = '',
  onPreviewError
}) => {
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 파일 확장자 추출
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // 파일 타입 카테고리 결정
  const getFileCategory = (extension: string): 'image' | 'pdf' | 'text' | 'office' | 'video' | 'audio' | 'archive' | 'other' => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const pdfExtensions = ['pdf'];
    const textExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'log'];
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];

    if (imageExtensions.includes(extension)) return 'image';
    if (pdfExtensions.includes(extension)) return 'pdf';
    if (textExtensions.includes(extension)) return 'text';
    if (officeExtensions.includes(extension)) return 'office';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    if (archiveExtensions.includes(extension)) return 'archive';
    return 'other';
  };

  // Mock 이미지 생성 (실제 구현에서는 실제 파일 URL 사용)
  const generateMockImageUrl = (filename: string): string => {
    // 파일명을 기반으로 고정된 시드로 랜덤 이미지 생성
    const seed = filename.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageTypes = ['business', 'nature', 'tech', 'abstract', 'city'];
    const imageType = imageTypes[seed % imageTypes.length];
    return `https://picsum.photos/seed/${seed}/800/600?random=${imageType}`;
  };

  // Mock PDF 콘텐츠 생성
  const generateMockPdfContent = (): string => {
    return `
      <div class="pdf-mock">
        <div style="background: white; min-height: 800px; padding: 40px; font-family: Arial, sans-serif; line-height: 1.6;">
          <h1 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            ${document.name}
          </h1>
          <div style="color: #666; margin: 20px 0; font-size: 14px;">
            <p><strong>문서 유형:</strong> ${document.category}</p>
            <p><strong>생성일:</strong> ${new Date(document.uploadDate).toLocaleDateString('ko-KR')}</p>
            <p><strong>작성자:</strong> ${document.uploadedBy || '알 수 없음'}</p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

          <h2 style="color: #0066cc; margin-top: 30px;">문서 개요</h2>
          <p>이것은 ${document.name}의 샘플 미리보기입니다. 실제 문서 내용은 파일을 다운로드하여 확인하실 수 있습니다.</p>

          <h3 style="color: #0066cc; margin-top: 25px;">주요 내용</h3>
          <ul style="padding-left: 20px;">
            <li>문서 관리 시스템을 통한 안전한 보관</li>
            <li>접근 권한 기반 문서 공유</li>
            <li>실시간 접근 로그 추적</li>
            <li>버전 관리 및 승인 워크플로우</li>
          </ul>

          <h3 style="color: #0066cc; margin-top: 25px;">보안 정보</h3>
          <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
            <p><strong>공개 범위:</strong> ${document.visibility}</p>
            <p><strong>문서 ID:</strong> ${document.id}</p>
            <p><strong>체크섬:</strong> ${document.checksum || 'N/A'}</p>
          </div>

          <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; text-align: center;">
            © 2025 PocketBiz VDR System | 이 문서는 안전하게 관리되고 있습니다.
          </div>
        </div>
      </div>
    `;
  };

  // Mock 텍스트 콘텐츠 생성
  const generateMockTextContent = (): string => {
    return `${document.name}

파일 정보:
- 크기: ${(document.size / 1024).toFixed(2)} KB
- 업로드일: ${new Date(document.uploadDate).toLocaleString('ko-KR')}
- 카테고리: ${document.category}
- 업로더: ${document.uploadedBy || '알 수 없음'}

문서 내용:
${document.description || '이 문서에는 설명이 없습니다.'}

태그: ${document.tags?.join(', ') || '태그 없음'}

---
이것은 "${document.name}"의 샘플 텍스트 미리보기입니다.
실제 파일 내용을 보려면 다운로드하여 확인하세요.

문서 ID: ${document.id}
버전: ${document.version || 'v1.0'}
생성 시간: ${new Date().toISOString()}

© 2025 PocketBiz VDR System`;
  };

  const extension = getFileExtension(document.name);
  const fileCategory = getFileCategory(extension);

  // 이미지 미리보기
  const renderImagePreview = () => (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {/* 이미지 컨트롤 */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setImageScale(Math.max(0.5, imageScale - 0.25))}
          className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
          title="축소"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setImageScale(Math.min(3, imageScale + 0.25))}
          className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
          title="확대"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setImageRotation((imageRotation + 90) % 360)}
          className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
          title="회전"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* 이미지 */}
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <img
          src={generateMockImageUrl(document.name)}
          alt={document.name}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${imageScale}) rotate(${imageRotation}deg)`
          }}
          onError={() => {
            setPreviewError('이미지를 로드할 수 없습니다.');
            onPreviewError?.('이미지 로드 실패');
          }}
        />
      </div>

      {/* 이미지 정보 */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
        {Math.round(imageScale * 100)}% | {imageRotation}°
      </div>
    </div>
  );

  // PDF 미리보기
  const renderPdfPreview = () => (
    <div className="bg-gray-100 rounded-lg overflow-hidden">
      <div className="bg-white border border-gray-300 shadow-sm">
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: generateMockPdfContent() }}
        />
      </div>
      <div className="p-4 bg-gray-50 border-t text-center">
        <p className="text-sm text-gray-600">
          이것은 PDF 문서의 샘플 미리보기입니다. 실제 PDF를 보려면 다운로드하세요.
        </p>
      </div>
    </div>
  );

  // 텍스트 미리보기
  const renderTextPreview = () => (
    <div className="bg-gray-50 rounded-lg border">
      <div className="bg-white p-6 rounded-lg font-mono text-sm leading-relaxed">
        <pre className="whitespace-pre-wrap break-words">
          {generateMockTextContent()}
        </pre>
      </div>
      <div className="p-4 bg-gray-50 border-t text-center">
        <p className="text-sm text-gray-600">
          텍스트 파일 미리보기 | 실제 내용은 다운로드하여 확인하세요.
        </p>
      </div>
    </div>
  );

  // Office 문서 미리보기
  const renderOfficePreview = () => (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
      <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-blue-900 mb-2">{document.name}</h3>
      <p className="text-blue-700 mb-4">Microsoft Office 문서</p>
      <div className="bg-white p-4 rounded-lg mb-4 text-left max-w-md mx-auto">
        <h4 className="font-medium text-gray-900 mb-2">문서 정보</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p>파일 크기: {(document.size / 1024).toFixed(2)} KB</p>
          <p>업로드일: {new Date(document.uploadDate).toLocaleDateString('ko-KR')}</p>
          <p>카테고리: {document.category}</p>
        </div>
      </div>
      <p className="text-sm text-blue-600">
        Office 문서는 다운로드하여 Microsoft Office 또는 호환 프로그램에서 열어보세요.
      </p>
    </div>
  );

  // 비디오 미리보기
  const renderVideoPreview = () => (
    <div className="bg-gray-900 rounded-lg p-8 text-center">
      <Film className="w-16 h-16 text-white mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{document.name}</h3>
      <p className="text-gray-300 mb-4">비디오 파일</p>
      <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4 text-left max-w-md mx-auto">
        <h4 className="font-medium text-white mb-2">파일 정보</h4>
        <div className="space-y-1 text-sm text-gray-300">
          <p>파일 크기: {(document.size / 1048576).toFixed(2)} MB</p>
          <p>형식: {extension.toUpperCase()}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Play className="w-4 h-4" />
          재생 (미구현)
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <Volume2 className="w-4 h-4" />
          오디오
        </button>
      </div>
    </div>
  );

  // 기본 파일 미리보기
  const renderDefaultPreview = () => (
    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
      <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{document.name}</h3>
      <p className="text-gray-600 mb-4">미리보기를 사용할 수 없는 파일 형식입니다</p>
      <div className="bg-white p-4 rounded-lg mb-4 text-left max-w-sm mx-auto">
        <h4 className="font-medium text-gray-900 mb-2">파일 정보</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p>파일 형식: {extension.toUpperCase() || '알 수 없음'}</p>
          <p>파일 크기: {(document.size / 1024).toFixed(2)} KB</p>
          <p>업로드일: {new Date(document.uploadDate).toLocaleDateString('ko-KR')}</p>
        </div>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto">
        <Download className="w-4 h-4" />
        다운로드하여 보기
      </button>
    </div>
  );

  // 에러 상태
  if (previewError) {
    return (
      <div className={`bg-red-50 rounded-lg border border-red-200 p-8 text-center ${className}`}>
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">미리보기 오류</h3>
        <p className="text-red-700">{previewError}</p>
      </div>
    );
  }

  // 파일 카테고리에 따른 미리보기 렌더링
  return (
    <div className={`${className}`}>
      {fileCategory === 'image' && renderImagePreview()}
      {fileCategory === 'pdf' && renderPdfPreview()}
      {fileCategory === 'text' && renderTextPreview()}
      {fileCategory === 'office' && renderOfficePreview()}
      {fileCategory === 'video' && renderVideoPreview()}
      {fileCategory === 'audio' && renderDefaultPreview()}
      {fileCategory === 'archive' && renderDefaultPreview()}
      {fileCategory === 'other' && renderDefaultPreview()}
    </div>
  );
};

export default DocumentPreview;