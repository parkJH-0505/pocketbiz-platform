/**
 * ScenarioManager Component
 * 시나리오 저장/불러오기 관리
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Upload,
  Download,
  Trash2,
  Copy,
  Star,
  StarOff,
  FolderOpen,
  Settings,
  Plus,
  Search,
  X,
  Share2,
  Link,
  FileText,
  QrCode,
  Globe,
  Info
} from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface Scenario {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  author: string;
  tags: string[];
  isFavorite: boolean;
  isPublic: boolean;
  data: {
    scores: Record<AxisKey, number>;
    overall: number;
    simulationAdjustments?: any;
    viewState?: any;
  };
  metadata: {
    version: string;
    source: 'manual' | 'simulation' | 'import';
    notes?: string;
  };
}

interface ScenarioManagerProps {
  className?: string;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({ className = '' }) => {
  const { data, simulation, exportForSync, loadFromSync } = useV2Store();

  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'manage' | 'share'>('save');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'favorite'>('date');

  // 공유 관련 상태
  const [shareMethod, setShareMethod] = useState<'json' | 'url' | 'qr'>('json');
  const [selectedForShare, setSelectedForShare] = useState<string[]>([]);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [importData, setImportData] = useState<string>('');

  // 새 시나리오 저장 상태
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    isPublic: false,
    newTag: ''
  });

  // 로컬 스토리지에서 시나리오 불러오기
  const loadScenariosFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('v2-scenarios');
      if (stored) {
        const parsed = JSON.parse(stored);
        setScenarios(parsed);
      }
    } catch (error) {
      console.error('시나리오 불러오기 실패:', error);
    }
  }, []);

  // 시나리오를 로컬 스토리지에 저장
  const saveScenariosToStorage = useCallback((scenarios: Scenario[]) => {
    try {
      localStorage.setItem('v2-scenarios', JSON.stringify(scenarios));
    } catch (error) {
      console.error('시나리오 저장 실패:', error);
    }
  }, []);

  // 현재 상태를 시나리오로 저장
  const handleSaveScenario = useCallback(async () => {
    if (!newScenario.name.trim() || !data) return;

    const scenario: Scenario = {
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newScenario.name.trim(),
      description: newScenario.description.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'Current User',
      tags: newScenario.tags,
      isFavorite: false,
      isPublic: newScenario.isPublic,
      data: {
        scores: data.current.scores,
        overall: data.current.overall,
        simulationAdjustments: simulation.isActive ? simulation.adjustments : undefined,
        viewState: exportForSync()?.viewState
      },
      metadata: {
        version: '1.0',
        source: simulation.isActive ? 'simulation' : 'manual',
        notes: newScenario.description
      }
    };

    const updatedScenarios = [scenario, ...scenarios];
    setScenarios(updatedScenarios);
    saveScenariosToStorage(updatedScenarios);

    // 폼 초기화
    setNewScenario({
      name: '',
      description: '',
      tags: [],
      isPublic: false,
      newTag: ''
    });

    alert('시나리오가 성공적으로 저장되었습니다!');
  }, [newScenario, data, simulation, scenarios, exportForSync, saveScenariosToStorage]);

  // 시나리오 불러오기
  const handleLoadScenario = useCallback((scenario: Scenario) => {
    try {
      loadFromSync({
        data: {
          current: {
            scores: scenario.data.scores,
            overall: scenario.data.overall,
            timestamp: new Date().toISOString()
          },
          changes: {}
        },
        viewState: scenario.data.viewState,
        simulation: scenario.data.simulationAdjustments ? {
          isActive: true,
          adjustments: scenario.data.simulationAdjustments
        } : undefined,
        timestamp: Date.now()
      });

      alert(`"${scenario.name}" 시나리오가 성공적으로 로드되었습니다!`);
      setIsVisible(false);
    } catch (error) {
      console.error('시나리오 로드 실패:', error);
      alert('시나리오 로드에 실패했습니다.');
    }
  }, [loadFromSync]);

  // 시나리오 즐겨찾기 토글
  const toggleFavorite = useCallback((scenarioId: string) => {
    const updatedScenarios = scenarios.map(scenario =>
      scenario.id === scenarioId
        ? { ...scenario, isFavorite: !scenario.isFavorite }
        : scenario
    );
    setScenarios(updatedScenarios);
    saveScenariosToStorage(updatedScenarios);
  }, [scenarios, saveScenariosToStorage]);

  // 시나리오 삭제
  const deleteScenario = useCallback((scenarioId: string) => {
    if (confirm('이 시나리오를 삭제하시겠습니까?')) {
      const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
      setScenarios(updatedScenarios);
      saveScenariosToStorage(updatedScenarios);
    }
  }, [scenarios, saveScenariosToStorage]);

  // 시나리오 복제
  const duplicateScenario = useCallback((scenario: Scenario) => {
    const duplicated: Scenario = {
      ...scenario,
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${scenario.name} (복사본)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false
    };

    const updatedScenarios = [duplicated, ...scenarios];
    setScenarios(updatedScenarios);
    saveScenariosToStorage(updatedScenarios);
  }, [scenarios, saveScenariosToStorage]);

  // 태그 추가
  const addTag = useCallback(() => {
    if (newScenario.newTag.trim() && !newScenario.tags.includes(newScenario.newTag.trim())) {
      setNewScenario(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  }, [newScenario.newTag, newScenario.tags]);

  // 태그 제거
  const removeTag = useCallback((tagToRemove: string) => {
    setNewScenario(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  // 시나리오 공유 기능
  const exportScenariosAsJSON = useCallback(() => {
    const selectedScenarios = selectedForShare.length > 0
      ? scenarios.filter(s => selectedForShare.includes(s.id))
      : scenarios;

    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      scenarios: selectedScenarios,
      metadata: {
        source: 'PocketBiz-Platform',
        totalScenarios: selectedScenarios.length
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `scenarios-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [scenarios, selectedForShare]);

  const importScenariosFromJSON = useCallback(() => {
    try {
      const parsed = JSON.parse(importData);

      if (!parsed.scenarios || !Array.isArray(parsed.scenarios)) {
        alert('올바르지 않은 시나리오 파일 형식입니다.');
        return;
      }

      const importedScenarios = parsed.scenarios.map((scenario: any) => ({
        ...scenario,
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: 'imported',
        metadata: {
          ...scenario.metadata,
          source: 'import'
        }
      }));

      const updatedScenarios = [...scenarios, ...importedScenarios];
      setScenarios(updatedScenarios);
      saveScenariosToStorage(updatedScenarios);

      alert(`${importedScenarios.length}개 시나리오를 성공적으로 가져왔습니다.`);
      setImportData('');
    } catch (error) {
      alert('파일을 파싱하는 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  }, [importData, scenarios, saveScenariosToStorage]);

  const generateShareURL = useCallback((scenario: Scenario) => {
    const encodedData = btoa(JSON.stringify({
      scenario,
      timestamp: Date.now()
    }));

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?scenario=${encodedData}`;
    setShareUrl(shareUrl);

    // 클립보드에 복사
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('공유 링크가 클립보드에 복사되었습니다!');
    }).catch(() => {
      alert('클립보드 복사에 실패했습니다. 링크를 수동으로 복사해주세요.');
    });
  }, []);

  const generateQRCode = useCallback((scenario: Scenario) => {
    const qrData = JSON.stringify({
      type: 'pocketbiz-scenario',
      data: scenario,
      timestamp: Date.now()
    });

    // QR 코드 생성 로직 (여기서는 간단한 구현)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    const qrWindow = window.open('', '_blank', 'width=300,height=300');
    if (qrWindow) {
      qrWindow.document.write(`
        <html>
          <head><title>시나리오 QR 코드</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;padding:20px;">
            <h3>시나리오: ${scenario.name}</h3>
            <img src="${qrUrl}" alt="QR Code" />
            <p style="text-align:center;margin-top:10px;font-size:12px;">
              QR 코드를 스캔하여 시나리오를 공유하세요
            </p>
          </body>
        </html>
      `);
    }
  }, []);

  // 선택된 시나리오 토글
  const toggleScenarioSelection = useCallback((scenarioId: string) => {
    setSelectedForShare(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  }, []);

  // 필터링된 시나리오 목록
  const filteredScenarios = useMemo(() => {
    let filtered = scenarios;

    if (searchQuery.trim()) {
      filtered = filtered.filter(scenario =>
        scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(scenario =>
        selectedTags.every(tag => scenario.tags.includes(tag))
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.updatedAt - a.updatedAt;
        case 'favorite':
          if (a.isFavorite === b.isFavorite) {
            return b.updatedAt - a.updatedAt;
          }
          return a.isFavorite ? -1 : 1;
        default:
          return 0;
      }
    });

    return filtered;
  }, [scenarios, searchQuery, selectedTags, sortBy]);

  // 모든 태그 목록
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    scenarios.forEach(scenario => {
      scenario.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [scenarios]);

  // 컴포넌트 마운트 시 시나리오 로드
  React.useEffect(() => {
    loadScenariosFromStorage();
  }, [loadScenariosFromStorage]);

  return (
    <div className={`relative ${className}`}>
      {/* 시나리오 관리 버튼 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        title="시나리오 관리"
      >
        <FolderOpen size={20} />
      </button>

      {/* 시나리오 관리 패널 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-hidden"
          >
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">시나리오 관리</h3>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {/* 탭 메뉴 */}
              <div className="flex mt-3 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'save', label: '저장', icon: Save },
                  { key: 'load', label: '불러오기', icon: Upload },
                  { key: 'manage', label: '관리', icon: Settings },
                  { key: 'share', label: '공유', icon: Share2 }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {/* 저장 탭 */}
              {activeTab === 'save' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시나리오 이름 *
                    </label>
                    <input
                      type="text"
                      value={newScenario.name}
                      onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="예: 성장 전략 시나리오"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명
                    </label>
                    <textarea
                      value={newScenario.description}
                      onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="시나리오에 대한 간단한 설명..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* 태그 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      태그
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newScenario.newTag}
                        onChange={(e) => setNewScenario(prev => ({ ...prev, newTag: e.target.value }))}
                        placeholder="태그 입력"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <button
                        onClick={addTag}
                        className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {newScenario.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-purple-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 현재 상태 미리보기 */}
                  {data && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">현재 상태</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>전체 점수: {data.current.overall}</div>
                        <div>시뮬레이션: {simulation.isActive ? '활성' : '비활성'}</div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveScenario}
                    disabled={!newScenario.name.trim() || !data}
                    className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    시나리오 저장
                  </button>
                </div>
              )}

              {/* 불러오기 탭 */}
              {activeTab === 'load' && (
                <div className="space-y-4">
                  {/* 검색 및 필터 */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="시나리오 검색..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="date">최신순</option>
                      <option value="name">이름순</option>
                      <option value="favorite">즐겨찾기</option>
                    </select>
                  </div>

                  {/* 시나리오 목록 */}
                  <div className="space-y-2">
                    {filteredScenarios.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
                        <p>저장된 시나리오가 없습니다</p>
                      </div>
                    ) : (
                      filteredScenarios.map((scenario) => (
                        <motion.div
                          key={scenario.id}
                          layout
                          className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm text-gray-900 truncate">
                                  {scenario.name}
                                </h4>
                                {scenario.isFavorite && (
                                  <Star size={12} className="text-yellow-500 fill-current" />
                                )}
                              </div>
                              {scenario.description && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {scenario.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(scenario.updatedAt).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  전체: {scenario.data.overall}점
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 ml-2">
                              <button
                                onClick={() => handleLoadScenario(scenario)}
                                className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                                title="불러오기"
                              >
                                <Upload size={14} />
                              </button>
                              <button
                                onClick={() => toggleFavorite(scenario.id)}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                title="즐겨찾기"
                              >
                                {scenario.isFavorite ? (
                                  <Star size={14} className="text-yellow-500 fill-current" />
                                ) : (
                                  <StarOff size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 관리 탭 */}
              {activeTab === 'manage' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">시나리오 관리</h4>
                    <div className="text-sm text-gray-500">
                      총 {scenarios.length}개
                    </div>
                  </div>

                  {/* 시나리오 목록 (관리용) */}
                  <div className="space-y-2">
                    {scenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className="flex items-center justify-between p-2 border border-gray-200 rounded-md"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {scenario.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(scenario.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => duplicateScenario(scenario)}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            title="복제"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => deleteScenario(scenario.id)}
                            className="p-1 text-red-400 hover:bg-red-100 rounded"
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 공유 탭 */}
              {activeTab === 'share' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">시나리오 공유</h4>
                    <div className="text-sm text-gray-500">
                      {selectedForShare.length > 0 ? `${selectedForShare.length}개 선택됨` : '공유 방법 선택'}
                    </div>
                  </div>

                  {/* 공유 방법 선택 */}
                  <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
                    {[
                      { key: 'json', label: 'JSON 파일', icon: FileText, desc: '파일로 내보내기' },
                      { key: 'url', label: 'URL 링크', icon: Link, desc: '링크로 공유' },
                      { key: 'qr', label: 'QR 코드', icon: QrCode, desc: 'QR 코드 생성' }
                    ].map(({ key, label, icon: Icon, desc }) => (
                      <button
                        key={key}
                        onClick={() => setShareMethod(key as any)}
                        className={`flex flex-col items-center p-3 rounded-md text-xs transition-colors ${
                          shareMethod === key
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Icon size={16} className="mb-1" />
                        <span className="font-medium">{label}</span>
                        <span className="text-gray-400 text-xs">{desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* JSON 파일 공유 */}
                  {shareMethod === 'json' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium text-sm">내보낼 시나리오 선택</h5>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setSelectedForShare(scenarios.map(s => s.id))}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            전체 선택
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => setSelectedForShare([])}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            선택 해제
                          </button>
                        </div>
                      </div>

                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {scenarios.map((scenario) => (
                          <label
                            key={scenario.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedForShare.includes(scenario.id)}
                              onChange={() => toggleScenarioSelection(scenario.id)}
                              className="rounded border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {scenario.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(scenario.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>

                      <button
                        onClick={exportScenariosAsJSON}
                        disabled={selectedForShare.length === 0 && scenarios.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <Download size={16} />
                        JSON 파일로 내보내기
                      </button>

                      {/* JSON 가져오기 */}
                      <div className="border-t pt-3">
                        <h5 className="font-medium text-sm mb-2">JSON 파일에서 가져오기</h5>
                        <textarea
                          value={importData}
                          onChange={(e) => setImportData(e.target.value)}
                          placeholder="JSON 데이터를 여기에 붙여넣기..."
                          className="w-full h-20 p-2 border border-gray-300 rounded-md text-xs resize-none"
                        />
                        <button
                          onClick={importScenariosFromJSON}
                          disabled={!importData.trim()}
                          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <Upload size={16} />
                          JSON에서 가져오기
                        </button>
                      </div>
                    </div>
                  )}

                  {/* URL 링크 공유 */}
                  {shareMethod === 'url' && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">링크로 공유할 시나리오 선택</h5>
                      <div className="space-y-2">
                        {scenarios.map((scenario) => (
                          <div
                            key={scenario.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {scenario.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {scenario.description || '설명 없음'}
                              </div>
                            </div>
                            <button
                              onClick={() => generateShareURL(scenario)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                            >
                              <Link size={12} />
                              링크 생성
                            </button>
                          </div>
                        ))}
                      </div>

                      {shareUrl && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe size={16} className="text-green-600" />
                            <span className="font-medium text-sm text-green-800">공유 링크가 생성되었습니다!</span>
                          </div>
                          <div className="text-xs text-green-700 break-all bg-white p-2 rounded border">
                            {shareUrl}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR 코드 공유 */}
                  {shareMethod === 'qr' && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">QR 코드로 공유할 시나리오 선택</h5>
                      <div className="space-y-2">
                        {scenarios.map((scenario) => (
                          <div
                            key={scenario.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {scenario.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {scenario.description || '설명 없음'}
                              </div>
                            </div>
                            <button
                              onClick={() => generateQRCode(scenario)}
                              className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors"
                            >
                              <QrCode size={12} />
                              QR 생성
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-sm text-blue-800 mb-1">QR 코드 사용법</div>
                            <div className="text-xs text-blue-700">
                              • QR 코드 생성 버튼을 클릭하면 새 창에서 QR 코드가 표시됩니다<br/>
                              • 모바일 기기로 QR 코드를 스캔하여 시나리오를 공유할 수 있습니다<br/>
                              • QR 코드는 시나리오 데이터를 포함하고 있어 즉시 사용 가능합니다
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};