import React, { useState, useEffect } from 'react';
import {
  Flag,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Target,
  Trophy,
  Rocket,
  Star,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  Check,
  X
} from 'lucide-react';

// 마일스톤 타입 정의
type MilestoneStatus = 'completed' | 'in-progress' | 'upcoming' | 'delayed';
type MilestoneCategory = 'product' | 'business' | 'funding' | 'team' | 'achievement';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  date: string;
  status: MilestoneStatus;
  category: MilestoneCategory;
  isHighlight?: boolean; // 중요 마일스톤
  metrics?: {
    label: string;
    value: string | number;
  }[];
  visibility?: 'public' | 'investors' | 'team' | 'private';
}

interface MilestoneTimelineProps {
  viewMode: 'public' | 'investors' | 'team' | 'private';
  isEditing?: boolean;
}

const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ viewMode, isEditing = false }) => {
  // 상태 관리
  const [localEditing, setLocalEditing] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);

  // 애니메이션 상태
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [animateStats, setAnimateStats] = useState(false);

  // 샘플 마일스톤 데이터
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: '1',
      title: '회사 설립',
      description: '법인 설립 및 초기 팀 구성',
      date: '2023-01',
      status: 'completed',
      category: 'business',
      isHighlight: true,
      visibility: 'public'
    },
    {
      id: '2',
      title: 'MVP 출시',
      description: '첫 번째 제품 버전 런칭',
      date: '2023-03',
      status: 'completed',
      category: 'product',
      metrics: [
        { label: '초기 사용자', value: '100명' }
      ],
      visibility: 'public'
    },
    {
      id: '3',
      title: 'Seed 투자 유치',
      description: '5억원 규모 시드 라운드 완료',
      date: '2023-06',
      status: 'completed',
      category: 'funding',
      isHighlight: true,
      metrics: [
        { label: '투자금액', value: '5억원' },
        { label: '투자사', value: '3개사' }
      ],
      visibility: 'investors'
    },
    {
      id: '4',
      title: '사용자 1만명 달성',
      description: '월간 활성 사용자 10,000명 돌파',
      date: '2023-09',
      status: 'completed',
      category: 'achievement',
      isHighlight: true,
      metrics: [
        { label: 'MAU', value: '10,000명' }
      ],
      visibility: 'public'
    },
    {
      id: '5',
      title: '글로벌 진출',
      description: '일본 시장 진출 준비',
      date: '2024-03',
      status: 'in-progress',
      category: 'business',
      visibility: 'investors'
    },
    {
      id: '6',
      title: 'Series A 라운드',
      description: '30억원 규모 투자 유치 목표',
      date: '2024-06',
      status: 'upcoming',
      category: 'funding',
      isHighlight: true,
      visibility: 'private'
    }
  ]);

  // 새 마일스톤 추가용 상태
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    title: '',
    description: '',
    date: '',
    status: 'upcoming',
    category: 'business',
    visibility: 'public'
  });

  // 카테고리별 아이콘과 색상
  const getCategoryStyle = (category: MilestoneCategory) => {
    const styles = {
      product: { icon: Rocket, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      business: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
      funding: { icon: Trophy, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      team: { icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      achievement: { icon: Target, color: 'text-orange-600', bgColor: 'bg-orange-100' }
    };
    return styles[category] || styles.business;
  };

  // 상태별 아이콘
  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'upcoming':
        return <Circle className="w-5 h-5 text-gray-400" />;
      case 'delayed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  // 보기 모드에 따른 필터링
  const getVisibleMilestones = () => {
    const filtered = milestones.filter(m => {
      if (!m.visibility) return true;
      if (viewMode === 'private') return true;
      if (viewMode === 'team') return m.visibility !== 'private';
      if (viewMode === 'investors') return m.visibility === 'public' || m.visibility === 'investors';
      if (viewMode === 'public') return m.visibility === 'public';
      return false;
    });

    // 날짜순 정렬
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const visibleMilestones = getVisibleMilestones();

  // 마운트 시 애니메이션 효과
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateStats(true);
    }, 300);

    // 순차적으로 마일스톤 표시
    visibleMilestones.forEach((milestone, index) => {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, milestone.id]));
      }, 500 + index * 150); // 150ms 간격으로 순차 표시
    });

    return () => clearTimeout(timer);
  }, [visibleMilestones]);

  // 날짜 포맷팅
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  };

  // 마일스톤 추가
  const handleAddMilestone = () => {
    if (newMilestone.title && newMilestone.date) {
      const milestone: Milestone = {
        id: Date.now().toString(),
        title: newMilestone.title,
        description: newMilestone.description,
        date: newMilestone.date,
        status: newMilestone.status as MilestoneStatus,
        category: newMilestone.category as MilestoneCategory,
        visibility: newMilestone.visibility as any
      };
      setMilestones([...milestones, milestone]);
      setNewMilestone({
        title: '',
        description: '',
        date: '',
        status: 'upcoming',
        category: 'business',
        visibility: 'public'
      });
      setShowAddMilestone(false);
    }
  };

  // 마일스톤 삭제
  const handleDeleteMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">주요 마일스톤</h3>
              <p className="text-sm text-gray-600">
                {visibleMilestones.length}개의 마일스톤
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {localEditing && (
              <button
                onClick={() => setShowAddMilestone(true)}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            )}
            {localEditing ? (
              <button
                onClick={() => setLocalEditing(false)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setLocalEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 애니메이션이 적용된 통계 요약 */}
        <div className={`mt-4 flex gap-4 text-sm transition-all duration-500 ${
          animateStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="flex items-center gap-2 transform transition-all duration-300 hover:scale-105">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">
              완료 <span className={`font-medium text-gray-900 transition-all duration-700 ${
                animateStats ? 'animate-pulse' : ''
              }`}>
                {milestones.filter(m => m.status === 'completed').length}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 transform transition-all duration-300 hover:scale-105">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">
              진행중 <span className={`font-medium text-gray-900 transition-all duration-700 ${
                animateStats ? 'animate-pulse' : ''
              }`}>
                {milestones.filter(m => m.status === 'in-progress').length}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 transform transition-all duration-300 hover:scale-105">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              예정 <span className={`font-medium text-gray-900 transition-all duration-700 ${
                animateStats ? 'animate-pulse' : ''
              }`}>
                {milestones.filter(m => m.status === 'upcoming').length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="p-6">
        {visibleMilestones.length === 0 ? (
          <div className="py-12 text-center">
            <Flag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">표시할 마일스톤이 없습니다</p>
            {localEditing && (
              <button
                onClick={() => setShowAddMilestone(true)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                첫 마일스톤 추가하기
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* 진보된 세로 라인 - 그라데이션 효과 */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-gray-200"></div>

            {/* 마일스톤 목록 */}
            <div className="space-y-8">
              {visibleMilestones.map((milestone, index) => {
                const categoryStyle = getCategoryStyle(milestone.category);
                const Icon = categoryStyle.icon;
                const isLast = index === visibleMilestones.length - 1;

                return (
                  <div key={milestone.id} className={`relative group transition-all duration-500 ${
                    visibleItems.has(milestone.id)
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 -translate-x-8'
                  }`}>
                    {/* 개선된 타임라인 포인트 */}
                    <div className="absolute left-4 flex flex-col items-center">
                      {/* 상태별 원형 배경 */}
                      <div className={`relative z-10 w-6 h-6 rounded-full border-4 bg-white flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
                        milestone.status === 'completed'
                          ? 'border-green-500 shadow-green-200'
                          : milestone.status === 'in-progress'
                          ? 'border-blue-500 shadow-blue-200'
                          : milestone.status === 'delayed'
                          ? 'border-red-500 shadow-red-200'
                          : 'border-gray-300 shadow-gray-200'
                      } shadow-lg ${visibleItems.has(milestone.id) ? 'scale-100' : 'scale-0'}`}>
                        {/* 내부 작은 상태 아이콘 - 펄스 애니메이션 */}
                        <div className={`w-2 h-2 rounded-full bg-current transition-all duration-300 ${
                          milestone.status === 'in-progress' ? 'animate-pulse' : ''
                        }`}></div>
                      </div>

                      {/* 하이라이트 마일스톤용 특별 효과 */}
                      {milestone.isHighlight && visibleItems.has(milestone.id) && (
                        <div className="absolute inset-0 w-6 h-6 rounded-full border-2 border-yellow-400 animate-ping"></div>
                      )}
                    </div>

                    {/* 개선된 마일스톤 카드 */}
                    <div className="ml-16 group-hover:translate-x-2 transition-all duration-300">
                      <div className={`p-5 rounded-xl border-2 transition-all duration-500 cursor-pointer ${
                        selectedMilestone === milestone.id
                          ? 'border-blue-300 bg-blue-50 shadow-lg scale-[1.02] transform'
                          : milestone.isHighlight
                          ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300 hover:shadow-md hover:scale-[1.01]'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'
                      } ${visibleItems.has(milestone.id) ? 'translate-y-0' : 'translate-y-4'}`}
                      onClick={() => setSelectedMilestone(selectedMilestone === milestone.id ? null : milestone.id)}
                      >
                        {/* 카드 헤더 - 날짜와 카테고리 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {formatDate(milestone.date)}
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${categoryStyle.bgColor} ${categoryStyle.color} border border-current border-opacity-20`}>
                              <Icon className="w-3 h-3" />
                              {milestone.category}
                            </div>
                          </div>

                          {/* 상태 표시 */}
                          <div className="flex items-center gap-2">
                            {milestone.isHighlight && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                <Star className="w-3 h-3 fill-current" />
                                <span>중요</span>
                              </div>
                            )}
                            {getStatusIcon(milestone.status)}
                          </div>
                        </div>

                        {/* 카드 본문 - 제목과 설명 */}
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {milestone.title}
                          </h4>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {milestone.description}
                            </p>
                          )}
                        </div>

                        {/* 메트릭 표시 - 개선된 디자인 */}
                        {milestone.metrics && milestone.metrics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {milestone.metrics.map((metric, idx) => (
                              <div key={idx} className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">{metric.label}</span>
                                  <span className="text-sm font-bold text-gray-900">{metric.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 편집/삭제 버튼 */}
                        {localEditing && (
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMilestone(milestone.id);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-60 hover:opacity-100"
                              title="마일스톤 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* 확장 영역 - 선택된 마일스톤의 추가 정보 */}
                        {selectedMilestone === milestone.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center gap-4">
                                <span>카테고리: {milestone.category}</span>
                                <span>상태: {milestone.status}</span>
                                {milestone.visibility && (
                                  <span>공개범위: {milestone.visibility}</span>
                                )}
                              </div>
                            </div>

                            {/* 진행률 표시 (진행중 마일스톤용) */}
                            {milestone.status === 'in-progress' && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">진행률</span>
                                  <span className="font-medium text-blue-600">75%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 마일스톤 추가 모달 */}
      {showAddMilestone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 마일스톤 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
                <input
                  type="month"
                  value={newMilestone.date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  value={newMilestone.status}
                  onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value as MilestoneStatus })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="upcoming">예정</option>
                  <option value="in-progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="delayed">지연</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={newMilestone.category}
                  onChange={(e) => setNewMilestone({ ...newMilestone, category: e.target.value as MilestoneCategory })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="product">제품</option>
                  <option value="business">비즈니스</option>
                  <option value="funding">펀딩</option>
                  <option value="team">팀</option>
                  <option value="achievement">성과</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공개 범위</label>
                <select
                  value={newMilestone.visibility}
                  onChange={(e) => setNewMilestone({ ...newMilestone, visibility: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">공개</option>
                  <option value="investors">투자자만</option>
                  <option value="team">팀만</option>
                  <option value="private">비공개</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleAddMilestone}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowAddMilestone(false);
                  setNewMilestone({
                    title: '',
                    description: '',
                    date: '',
                    status: 'upcoming',
                    category: 'business',
                    visibility: 'public'
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneTimeline;