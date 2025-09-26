/**
 * ScenarioManager Component
 * 시나리오 관리 시스템 - 저장, 불러오기, 비교
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Upload, Trash2, Copy, Share, Star, Calendar,
  TrendingUp, TrendingDown, BarChart3, Eye, EyeOff,
  Filter, Search, Plus, Download, Archive
} from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import type { SimulationAdjustments } from '../types';

interface SavedScenario {
  id: string;
  name: string;
  description?: string;
  adjustments: SimulationAdjustments;
  score: number;
  timestamp: string;
  tags: string[];
  isFavorite: boolean;
  metadata: {
    confidence: number;
    expectedImpact: number;
    difficulty: 'low' | 'medium' | 'high';
    category: 'growth' | 'optimization' | 'recovery' | 'innovation';
  };
}

export const ScenarioManager: React.FC = () => {
  const { simulation, loadScenario, saveScenario } = useV2Store();
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // localStorage에서 시나리오 로드
  useEffect(() => {
    const loadSavedScenarios = () => {
      const saved = localStorage.getItem('v2_scenarios');
      if (saved) {
        try {
          const parsedScenarios = JSON.parse(saved);
          // 메타데이터가 없는 기존 시나리오들에 기본값 추가
          const enhancedScenarios = parsedScenarios.map((scenario: any) => ({
            ...scenario,
            tags: scenario.tags || [],
            isFavorite: scenario.isFavorite || false,
            description: scenario.description || '',
            metadata: scenario.metadata || {
              confidence: 75,
              expectedImpact: Math.min(20, Math.abs(scenario.score - 68)),
              difficulty: Math.abs(scenario.score - 68) > 15 ? 'high' : 'medium',
              category: scenario.score > 68 ? 'growth' : 'recovery'
            }
          }));
          setScenarios(enhancedScenarios);
        } catch (error) {
          console.error('Failed to load scenarios:', error);
          setScenarios([]);
        }
      }
    };

    loadSavedScenarios();
    // localStorage 변경사항 감지
    window.addEventListener('storage', loadSavedScenarios);
    return () => window.removeEventListener('storage', loadSavedScenarios);
  }, []);

  // 필터링 및 정렬된 시나리오
  const filteredAndSortedScenarios = useMemo(() => {
    let filtered = scenarios.filter((scenario) => {
      const matchesSearch = scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (scenario.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' ||
                             selectedCategory === 'favorites' && scenario.isFavorite ||
                             scenario.metadata.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

    return filtered;
  }, [scenarios, searchTerm, selectedCategory, sortBy]);

  // 시나리오 저장 (향상된 버전)
  const handleSaveScenario = (name: string, description?: string, tags?: string[]) => {
    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name,
      description: description || '',
      adjustments: simulation.adjustments,
      score: simulation.calculatedScore,
      timestamp: new Date().toISOString(),
      tags: tags || [],
      isFavorite: false,
      metadata: {
        confidence: simulation.confidence || 75,
        expectedImpact: Math.abs(simulation.calculatedScore - 68),
        difficulty: Math.abs(simulation.calculatedScore - 68) > 15 ? 'high' : 'medium',
        category: simulation.calculatedScore > 68 ? 'growth' : 'recovery'
      }
    };

    const updatedScenarios = [...scenarios, newScenario];
    setScenarios(updatedScenarios);
    localStorage.setItem('v2_scenarios', JSON.stringify(updatedScenarios));

    // 원래 saveScenario도 호출 (호환성)
    saveScenario(name);
  };

  // 시나리오 삭제
  const handleDeleteScenario = (scenarioId: string) => {
    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
    setScenarios(updatedScenarios);
    localStorage.setItem('v2_scenarios', JSON.stringify(updatedScenarios));
  };

  // 즐겨찾기 토글
  const toggleFavorite = (scenarioId: string) => {
    const updatedScenarios = scenarios.map(s =>
      s.id === scenarioId ? { ...s, isFavorite: !s.isFavorite } : s
    );
    setScenarios(updatedScenarios);
    localStorage.setItem('v2_scenarios', JSON.stringify(updatedScenarios));
  };

  // 시나리오 복제
  const duplicateScenario = (scenario: SavedScenario) => {
    const duplicated = {
      ...scenario,
      id: Date.now().toString(),
      name: `${scenario.name} (사본)`,
      timestamp: new Date().toISOString()
    };
    const updatedScenarios = [...scenarios, duplicated];
    setScenarios(updatedScenarios);
    localStorage.setItem('v2_scenarios', JSON.stringify(updatedScenarios));
  };

  // 내보내기
  const handleExport = () => {
    const selectedData = scenarios.filter(s => selectedScenarios.has(s.id));
    const dataToExport = selectedData.length > 0 ? selectedData : scenarios;

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scenarios_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'csv') {
      const csvContent = [
        'Name,Description,Score,Date,Category,Difficulty,Price,Churn,Team,Growth',
        ...dataToExport.map(s =>
          `"${s.name}","${s.description}",${s.score},${s.timestamp},${s.metadata.category},${s.metadata.difficulty},${s.adjustments.price},${s.adjustments.churn},${s.adjustments.team},${s.adjustments.growth}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scenarios_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 시나리오 선택 토글
  const toggleScenarioSelection = (scenarioId: string) => {
    const newSelection = new Set(selectedScenarios);
    if (newSelection.has(scenarioId)) {
      newSelection.delete(scenarioId);
    } else {
      newSelection.add(scenarioId);
    }
    setSelectedScenarios(newSelection);
  };

  // 카테고리별 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'growth': return 'bg-green-100 text-green-700';
      case 'optimization': return 'bg-blue-100 text-blue-700';
      case 'recovery': return 'bg-red-100 text-red-700';
      case 'innovation': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 난이도별 색상
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
            <Archive size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">시나리오 관리</h3>
            <p className="text-sm text-gray-600">
              {scenarios.length}개의 저장된 시나리오
            </p>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Download size={14} />
            내보내기
          </button>

          <button
            onClick={() => setShowComparison(!showComparison)}
            disabled={selectedScenarios.size < 2}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedScenarios.size >= 2
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <BarChart3 size={14} />
            비교 ({selectedScenarios.size})
          </button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex items-center gap-4">
        {/* 검색 */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="시나리오 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 카테고리 필터 */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">모든 카테고리</option>
          <option value="favorites">즐겨찾기</option>
          <option value="growth">성장</option>
          <option value="optimization">최적화</option>
          <option value="recovery">회복</option>
          <option value="innovation">혁신</option>
        </select>

        {/* 정렬 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="date">날짜순</option>
          <option value="score">점수순</option>
          <option value="name">이름순</option>
        </select>

        {/* 뷰 모드 */}
        <div className="flex items-center border border-gray-200 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      {/* 시나리오 목록 */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
        <AnimatePresence>
          {filteredAndSortedScenarios.map((scenario, index) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-xl transition-all hover:shadow-md ${
                selectedScenarios.has(scenario.id)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="p-4">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={selectedScenarios.has(scenario.id)}
                        onChange={() => toggleScenarioSelection(scenario.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <h4 className="font-medium text-gray-900 text-sm">
                        {scenario.name}
                      </h4>
                      {scenario.isFavorite && (
                        <Star size={14} className="text-yellow-500 fill-current" />
                      )}
                    </div>
                    {scenario.description && (
                      <p className="text-xs text-gray-600 mb-2">
                        {scenario.description}
                      </p>
                    )}
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavorite(scenario.id)}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        scenario.isFavorite ? 'text-yellow-500' : 'text-gray-400'
                      }`}
                    >
                      <Star size={14} className={scenario.isFavorite ? 'fill-current' : ''} />
                    </button>

                    <button
                      onClick={() => duplicateScenario(scenario)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500"
                      title="복제"
                    >
                      <Copy size={14} />
                    </button>

                    <button
                      onClick={() => handleDeleteScenario(scenario.id)}
                      className="p-1 rounded hover:bg-red-100 text-red-500"
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* 메트릭스 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {scenario.score.toFixed(1)}점
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(scenario.metadata.category)}`}>
                      {scenario.metadata.category === 'growth' ? '성장' :
                       scenario.metadata.category === 'optimization' ? '최적화' :
                       scenario.metadata.category === 'recovery' ? '회복' : '혁신'}
                    </span>
                  </div>
                </div>

                {/* 조정값 미리보기 */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">가격:</span>
                    <span className={`font-medium ${scenario.adjustments.price > 0 ? 'text-green-600' : scenario.adjustments.price < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {scenario.adjustments.price > 0 ? '+' : ''}{scenario.adjustments.price}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">유지율:</span>
                    <span className={`font-medium ${scenario.adjustments.churn > 0 ? 'text-green-600' : scenario.adjustments.churn < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {scenario.adjustments.churn > 0 ? '+' : ''}{scenario.adjustments.churn}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">팀:</span>
                    <span className={`font-medium ${scenario.adjustments.team > 0 ? 'text-green-600' : scenario.adjustments.team < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {scenario.adjustments.team > 0 ? '+' : ''}{scenario.adjustments.team}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">성장:</span>
                    <span className={`font-medium ${scenario.adjustments.growth > 0 ? 'text-green-600' : scenario.adjustments.growth < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {scenario.adjustments.growth > 0 ? '+' : ''}{scenario.adjustments.growth}
                    </span>
                  </div>
                </div>

                {/* 푸터 */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{new Date(scenario.timestamp).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      loadScenario(scenario.id);
                      Object.entries(scenario.adjustments).forEach(([key, value]) => {
                        // Store 업데이트는 loadScenario에서 처리됨
                      });
                    }}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                  >
                    불러오기
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 빈 상태 */}
      {filteredAndSortedScenarios.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Archive size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-lg mb-1">저장된 시나리오가 없습니다</p>
          <p className="text-sm">시뮬레이션을 실행한 후 결과를 저장해보세요</p>
        </div>
      )}

      {/* 시나리오 비교 패널 */}
      <AnimatePresence>
        {showComparison && selectedScenarios.size >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 size={16} />
                시나리오 비교
              </h4>
              <button
                onClick={() => setShowComparison(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <EyeOff size={16} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">시나리오</th>
                    <th className="text-center py-2">점수</th>
                    <th className="text-center py-2">가격</th>
                    <th className="text-center py-2">유지율</th>
                    <th className="text-center py-2">팀</th>
                    <th className="text-center py-2">성장</th>
                    <th className="text-center py-2">카테고리</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios
                    .filter(s => selectedScenarios.has(s.id))
                    .map((scenario) => (
                      <tr key={scenario.id} className="border-b">
                        <td className="py-2 font-medium">{scenario.name}</td>
                        <td className="text-center py-2">{scenario.score.toFixed(1)}</td>
                        <td className="text-center py-2">{scenario.adjustments.price}</td>
                        <td className="text-center py-2">{scenario.adjustments.churn}</td>
                        <td className="text-center py-2">{scenario.adjustments.team}</td>
                        <td className="text-center py-2">{scenario.adjustments.growth}</td>
                        <td className="text-center py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(scenario.metadata.category)}`}>
                            {scenario.metadata.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};