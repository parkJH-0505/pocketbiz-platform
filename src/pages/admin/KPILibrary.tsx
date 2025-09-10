import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Download, Upload, 
  Filter, ChevronDown, Eye, Copy, AlertCircle,
  Check, X, MoreVertical, Database, RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { KPIEditModal } from '../../components/admin/KPIEditModal';
import { loadKPIData } from '../../data/kpiLoader';
import type { KPIDefinition, AxisKey, StageType } from '../../types';
import { 
  exportAllCSVFiles, 
  importCSVFiles, 
  type ExtendedKPIDefinition 
} from '../../utils/csvManager';

const KPILibrary = () => {
  // 상태 관리
  const [kpiData, setKpiData] = useState<ExtendedKPIDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAxis, setSelectedAxis] = useState<AxisKey | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<StageType | 'all'>('all');
  const [selectedKPIs, setSelectedKPIs] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKPI, setEditingKPI] = useState<ExtendedKPIDefinition | null>(null);
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'axis' | 'type'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showImportModal, setShowImportModal] = useState(false);
  
  // 파일 업로드 ref
  const libraryFileRef = useRef<HTMLInputElement>(null);
  const rulesFileRef = useRef<HTMLInputElement>(null);
  const fieldsFileRef = useRef<HTMLInputElement>(null);

  // 축과 단계 정의
  const axes: { value: AxisKey | 'all'; label: string; color: string }[] = [
    { value: 'all', label: '전체', color: 'bg-neutral-gray' },
    { value: 'GO', label: 'Growth Orientation', color: 'bg-primary-main' },
    { value: 'EC', label: 'Efficiency & Capability', color: 'bg-secondary-main' },
    { value: 'PT', label: 'Product & Technology', color: 'bg-accent-blue' },
    { value: 'PF', label: 'Performance', color: 'bg-accent-purple' },
    { value: 'TO', label: 'Team & Organization', color: 'bg-accent-orange' }
  ];

  const stages: { value: StageType | 'all'; label: string }[] = [
    { value: 'all', label: '전체 단계' },
    { value: 'A-1', label: 'A-1: Pre-Seed' },
    { value: 'A-2', label: 'A-2: Seed' },
    { value: 'A-3', label: 'A-3: Series A' },
    { value: 'A-4', label: 'A-4: Series B+' },
    { value: 'A-5', label: 'A-5: Pre-IPO' }
  ];

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await loadKPIData('S1'); // 일단 S1 섹터 데이터 로드
        if (data?.libraries) {
          setKpiData(data.libraries);
        }
      } catch (error) {
        console.error('Failed to load KPI data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let filtered = [...kpiData];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(kpi => 
        kpi.kpi_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.question?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 축 필터
    if (selectedAxis !== 'all') {
      filtered = filtered.filter(kpi => kpi.axis === selectedAxis);
    }

    // 단계 필터
    if (selectedStage !== 'all') {
      filtered = filtered.filter(kpi => 
        kpi.applicable_stages?.includes(selectedStage)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'id':
          compareValue = a.kpi_id.localeCompare(b.kpi_id);
          break;
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'axis':
          compareValue = a.axis.localeCompare(b.axis);
          break;
        case 'type':
          compareValue = a.input_type.localeCompare(b.input_type);
          break;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [kpiData, searchTerm, selectedAxis, selectedStage, sortBy, sortOrder]);

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedKPIs.size === filteredData.length) {
      setSelectedKPIs(new Set());
    } else {
      setSelectedKPIs(new Set(filteredData.map(kpi => kpi.kpi_id)));
    }
  };

  // 개별 선택
  const handleSelectKPI = (kpiId: string) => {
    const newSelected = new Set(selectedKPIs);
    if (newSelected.has(kpiId)) {
      newSelected.delete(kpiId);
    } else {
      newSelected.add(kpiId);
    }
    setSelectedKPIs(newSelected);
  };

  // KPI 편집
  const handleEditKPI = (kpi: ExtendedKPIDefinition) => {
    setEditingKPI(kpi);
    setShowEditModal(true);
  };

  // KPI 삭제
  const handleDeleteKPI = (kpiId: string) => {
    if (confirm('이 KPI를 삭제하시겠습니까?')) {
      setKpiData(prev => prev.filter(kpi => kpi.kpi_id !== kpiId));
    }
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    exportAllCSVFiles(kpiData);
  };

  // CSV 가져오기
  const handleImportCSV = async () => {
    const files: any = {};
    
    if (libraryFileRef.current?.files?.[0]) {
      files.library = libraryFileRef.current.files[0];
    }
    if (rulesFileRef.current?.files?.[0]) {
      files.stageRules = rulesFileRef.current.files[0];
    }
    if (fieldsFileRef.current?.files?.[0]) {
      files.inputFields = fieldsFileRef.current.files[0];
    }
    
    if (Object.keys(files).length > 0) {
      try {
        const importedKPIs = await importCSVFiles(files);
        setKpiData(importedKPIs);
        setShowImportModal(false);
        // 파일 입력 초기화
        if (libraryFileRef.current) libraryFileRef.current.value = '';
        if (rulesFileRef.current) rulesFileRef.current.value = '';
        if (fieldsFileRef.current) fieldsFileRef.current.value = '';
      } catch (error) {
        console.error('CSV 가져오기 실패:', error);
        alert('CSV 파일 가져오기에 실패했습니다.');
      }
    } else {
      alert('최소 하나의 CSV 파일을 선택해주세요.');
    }
  };

  // 입력 타입별 색상
  const getInputTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Numeric': 'bg-blue-100 text-blue-700',
      'Rubric': 'bg-green-100 text-green-700',
      'MultiSelect': 'bg-purple-100 text-purple-700',
      'Calculation': 'bg-orange-100 text-orange-700',
      'Stage': 'bg-pink-100 text-pink-700',
      'Checklist': 'bg-indigo-100 text-indigo-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-primary-main" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-dark">KPI 라이브러리</h1>
            <p className="text-sm text-neutral-gray mt-1">
              총 {kpiData.length}개의 KPI • {filteredData.length}개 표시
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              가져오기
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              내보내기
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={() => {
                setEditingKPI(null);
                setShowEditModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              KPI 추가
            </Button>
          </div>
        </div>

        {/* 필터 바 */}
        <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-neutral-border">
          {/* 검색 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-gray" size={20} />
            <input
              type="text"
              placeholder="KPI ID, 제목, 질문으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
            />
          </div>

          {/* 축 필터 */}
          <select
            value={selectedAxis}
            onChange={(e) => setSelectedAxis(e.target.value as AxisKey | 'all')}
            className="px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
          >
            {axes.map(axis => (
              <option key={axis.value} value={axis.value}>
                {axis.label}
              </option>
            ))}
          </select>

          {/* 단계 필터 */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as StageType | 'all')}
            className="px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
          >
            {stages.map(stage => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>

          {/* 정렬 */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
            >
              <option value="id">ID</option>
              <option value="title">제목</option>
              <option value="axis">축</option>
              <option value="type">타입</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-neutral-border rounded-lg hover:bg-neutral-light transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* 선택된 항목 액션 */}
        {selectedKPIs.size > 0 && (
          <div className="mt-4 p-3 bg-primary-light bg-opacity-10 rounded-lg flex items-center justify-between">
            <span className="text-sm text-primary-dark">
              {selectedKPIs.size}개 선택됨
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="small">
                <Copy size={16} className="mr-1" />
                복사
              </Button>
              <Button variant="danger" size="small">
                <Trash2 size={16} className="mr-1" />
                삭제
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-neutral-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-light border-b border-neutral-border">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedKPIs.size === filteredData.length && filteredData.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-neutral-border"
                />
              </th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-dark">KPI ID</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-dark">제목</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-dark">축</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-dark">입력 타입</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-dark">적용 단계</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-dark">액션</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((kpi, index) => (
              <tr 
                key={kpi.kpi_id}
                className={`border-b border-neutral-border hover:bg-neutral-light transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedKPIs.has(kpi.kpi_id)}
                    onChange={() => handleSelectKPI(kpi.kpi_id)}
                    className="rounded border-neutral-border"
                  />
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm text-neutral-dark">{kpi.kpi_id}</span>
                </td>
                <td className="p-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-dark">{kpi.title}</p>
                    <p className="text-xs text-neutral-gray mt-1 truncate max-w-xs">
                      {kpi.question}
                    </p>
                    {kpi.stage_rules && kpi.stage_rules.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {kpi.stage_rules.map(rule => (
                          <span 
                            key={rule.stage}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700"
                            title={`가중치: ${rule.weight}`}
                          >
                            {rule.weight}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    axes.find(a => a.value === kpi.axis)?.color || 'bg-gray-100'
                  } text-white`}>
                    {kpi.axis}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    getInputTypeColor(kpi.input_type)
                  }`}>
                    {kpi.input_type}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {kpi.applicable_stages?.map(stage => (
                      <span 
                        key={stage}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-neutral-light text-neutral-dark"
                      >
                        {stage}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditKPI(kpi)}
                      className="p-1.5 text-neutral-gray hover:text-primary-main hover:bg-primary-light rounded transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteKPI(kpi.kpi_id)}
                      className="p-1.5 text-neutral-gray hover:text-accent-red hover:bg-accent-red-light rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="p-1.5 text-neutral-gray hover:text-neutral-dark hover:bg-neutral-light rounded transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="p-12 text-center">
            <Database className="mx-auto text-neutral-lighter mb-4" size={48} />
            <p className="text-neutral-gray">검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      {/* KPI 편집 모달 */}
      <KPIEditModal
        kpi={editingKPI}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingKPI(null);
        }}
        onSave={(savedKPI) => {
          if (editingKPI) {
            // 수정
            setKpiData(prev => prev.map(k => 
              k.kpi_id === savedKPI.kpi_id ? savedKPI : k
            ));
          } else {
            // 추가
            setKpiData(prev => [...prev, savedKPI]);
          }
          setShowEditModal(false);
          setEditingKPI(null);
        }}
      />

      {/* CSV 가져오기 모달 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-neutral-dark flex items-center gap-2">
                <FileSpreadsheet size={24} />
                CSV 파일 가져오기
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-neutral-light rounded-lg transition-colors"
              >
                <X size={20} className="text-neutral-gray" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <AlertCircle size={16} className="inline mr-1" />
                  세 개의 CSV 파일을 모두 선택하거나, KPI Library 파일만 선택할 수 있습니다.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  KPI Library (필수)
                </label>
                <input
                  ref={libraryFileRef}
                  type="file"
                  accept=".csv"
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  Stage Rules (선택)
                </label>
                <input
                  ref={rulesFileRef}
                  type="file"
                  accept=".csv"
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  Input Fields (선택)
                </label>
                <input
                  ref={fieldsFileRef}
                  type="file"
                  accept=".csv"
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImportCSV}
                >
                  가져오기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPILibrary;