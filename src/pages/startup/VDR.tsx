import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Share2,
  Eye,
  Shield,
  Search,
  Filter,
  FolderOpen,
  Calendar,
  Building,
  ChevronRight,
  Star,
  Lock,
  Globe,
  Users,
  Check,
  X,
  Upload
} from 'lucide-react';
import { useVDRContext } from '../../contexts/VDRContext';
import type { VDRDocument } from '../../contexts/VDRContext';

const VDR: React.FC = () => {
  const {
    documents,
    representativeDocs,
    aggregateDocuments,
    uploadDocument,
    updateDocumentVisibility,
    setRepresentativeDocument,
    createShareSession,
    searchDocuments,
    loading
  } = useVDRContext();

  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'representative' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareName, setShareName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 초기 로드 시 문서 집계
  useEffect(() => {
    aggregateDocuments();
  }, []);

  const handleSelectDoc = (docId: string) => {
    const newSelection = new Set(selectedDocs);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocs(newSelection);
  };

  const handleShare = async () => {
    if (selectedDocs.size === 0) return;
    setShowShareModal(true);
  };

  const handleCreateShareSession = async () => {
    if (!shareName) return;

    const shareLink = await createShareSession(shareName, Array.from(selectedDocs));

    alert(`공유함 "${shareName}"이 생성되었습니다.\n링크가 클립보드에 복사되었습니다.`);
    setShowShareModal(false);
    setShareName('');
    setSelectedDocs(new Set());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await uploadDocument(file, 'vdr_upload');
    }

    // 파일 업로드 후 문서 목록 새로고침
    await aggregateDocuments();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getVisibilityIcon = (visibility: VDRVDRDocument['visibility']) => {
    switch(visibility) {
      case 'private': return <Lock className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'investors': return <Eye className="w-4 h-4" />;
      case 'public': return <Globe className="w-4 h-4" />;
    }
  };

  const getVisibilityColor = (visibility: VDRDocument['visibility']) => {
    switch(visibility) {
      case 'private': return 'text-red-600 bg-red-50';
      case 'team': return 'text-blue-600 bg-blue-50';
      case 'investors': return 'text-purple-600 bg-purple-50';
      case 'public': return 'text-green-600 bg-green-50';
    }
  };

  const getCategoryLabel = (category: VDRDocument['category']) => {
    const labels = {
      buildup_deliverable: '빌드업 산출물',
      kpi_report: 'KPI 보고서',
      vdr_upload: 'VDR 업로드',
      contract: '계약서',
      ir_deck: 'IR Deck',
      business_plan: '사업계획서',
      financial: '재무제표',
      marketing: '마케팅 지표'
    };
    return labels[category] || category;
  };

  const filteredDocs = (searchQuery ? searchDocuments(searchQuery) : documents).filter(doc => {
    const matchesFilter = filterCategory === 'all' || doc.category === filterCategory;
    const matchesTab = activeTab === 'all' ||
                       (activeTab === 'representative' && doc.isRepresentative) ||
                       (activeTab === 'shared' && doc.sharedSessions && doc.sharedSessions.length > 0);
    return matchesFilter && matchesTab;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Virtual Data Room</h1>
              <p className="text-sm text-gray-500 mt-1">모든 문서를 한 곳에서 관리하고 안전하게 공유하세요</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              문서 업로드
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              전체 문서
            </button>
            <button
              onClick={() => setActiveTab('representative')}
              className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === 'representative'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Star className="w-4 h-4" />
              대표 문서
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === 'shared'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Share2 className="w-4 h-4" />
              공유 중
            </button>
          </div>
        </div>

        {/* Representative Documents Section */}
        {activeTab === 'representative' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">대표 문서 지정</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {representativeDocs.map(type => {
                const doc = documents.find(d => d.category === type.type && d.isRepresentative);
                return (
                  <div key={type.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{type.label}</span>
                      {doc && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    {doc ? (
                      <div className="text-sm text-gray-600">
                        <p className="truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">미지정</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="문서 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 카테고리</option>
              <option value="buildup_deliverable">빌드업 산출물</option>
              <option value="kpi_report">KPI 보고서</option>
              <option value="ir_deck">IR Deck</option>
              <option value="business_plan">사업계획서</option>
              <option value="financial">재무제표</option>
              <option value="marketing">마케팅 지표</option>
            </select>
          </div>
        </div>

        {/* Document List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {filteredDocs.length}개 문서 {selectedDocs.size > 0 && `(${selectedDocs.size}개 선택됨)`}
            </span>
            {selectedDocs.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Share2 className="w-4 h-4" />
                  공유
                </button>
                <button className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Download className="w-4 h-4" />
                  다운로드
                </button>
              </div>
            )}
          </div>

          <div className="divide-y">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={() => handleSelectDoc(doc.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  
                  <FileText className="w-5 h-5 text-gray-400" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doc.name}</span>
                      {doc.isRepresentative && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {getCategoryLabel(doc.category)}
                      </span>
                      {doc.projectName && (
                        <span className="flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" />
                          {doc.projectName}
                        </span>
                      )}
                      <span>{(doc.size / 1048576).toFixed(2)} MB</span>
                      <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={doc.visibility}
                      onChange={(e) => updateDocumentVisibility(doc.id, e.target.value as VDRDocument['visibility'])}
                      className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                        getVisibilityColor(doc.visibility)
                      }`}
                    >
                      <option value="private">비공개</option>
                      <option value="team">팀</option>
                      <option value="investors">투자자</option>
                      <option value="public">공개</option>
                    </select>
                    
                    {doc.sharedSessions && doc.sharedSessions.length > 0 && (
                      <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm">
                        {doc.sharedSessions.length}개 공유중
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">파일 링크 공유</h3>
            <input
              type="text"
              placeholder="공유함 명을 입력하세요 (예: 포켓전자 IR - YS캐피탈)"
              value={shareName}
              onChange={(e) => setShareName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleCreateShareSession}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                공유하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VDR;