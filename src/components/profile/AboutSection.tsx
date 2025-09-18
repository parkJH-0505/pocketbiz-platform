import React, { useState } from 'react';
import {
  Target,
  Heart,
  Lightbulb,
  Users,
  TrendingUp,
  Globe,
  Award,
  Star,
  Edit3,
  Check,
  X,
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Rocket
} from 'lucide-react';

interface AboutItem {
  id: string;
  type: 'vision' | 'mission' | 'values' | 'story' | 'achievements';
  title: string;
  content: string;
  isExpanded?: boolean;
  visibility?: 'public' | 'investors' | 'team' | 'private';
  highlights?: string[]; // 중요 키워드
}

interface AboutSectionProps {
  viewMode: 'public' | 'investors' | 'team' | 'private';
  isEditing?: boolean;
}

const AboutSection: React.FC<AboutSectionProps> = ({ viewMode, isEditing = false }) => {
  const [localEditing, setLocalEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('vision');
  const [showAddSection, setShowAddSection] = useState(false);

  // 회사 소개 데이터
  const [aboutItems, setAboutItems] = useState<AboutItem[]>([
    {
      id: '1',
      type: 'vision',
      title: '우리의 비전',
      content: '기술을 통해 모든 사람이 더 나은 삶을 살 수 있는 세상을 만드는 것입니다. AI와 머신러닝을 활용하여 복잡한 문제를 단순하고 직관적인 솔루션으로 해결하고, 전 세계 사람들의 일상을 혁신적으로 개선하고자 합니다.',
      visibility: 'public',
      highlights: ['기술을 통한 혁신', 'AI/ML 솔루션', '일상의 개선']
    },
    {
      id: '2',
      type: 'mission',
      title: '우리의 미션',
      content: '사용자 중심의 혁신적인 제품을 개발하여 비즈니스 효율성을 극대화하고, 지속가능한 성장을 통해 사회에 긍정적인 영향을 미치는 것입니다. 우리는 고객의 니즈를 깊이 이해하고, 최고의 기술력으로 가치 있는 서비스를 제공합니다.',
      visibility: 'public',
      highlights: ['사용자 중심', '비즈니스 효율성', '지속가능한 성장']
    },
    {
      id: '3',
      type: 'values',
      title: '핵심 가치',
      content: '혁신(Innovation), 투명성(Transparency), 협업(Collaboration), 고객 중심(Customer Focus), 지속가능성(Sustainability)을 바탕으로 모든 의사결정을 내립니다. 이러한 가치들이 우리 팀의 DNA가 되어 제품과 서비스에 자연스럽게 녹아있습니다.',
      visibility: 'investors',
      highlights: ['혁신', '투명성', '협업', '고객 중심', '지속가능성']
    },
    {
      id: '4',
      type: 'story',
      title: '우리의 이야기',
      content: '2023년 초, 두 명의 창업자가 커피숍에서 시작한 작은 아이디어가 지금의 회사로 성장했습니다. 처음에는 단순한 업무 자동화 도구였지만, 고객들의 피드백을 통해 종합적인 비즈니스 솔루션으로 발전했습니다. 현재는 15명의 팀원과 함께 글로벌 시장에 도전하고 있습니다.',
      visibility: 'team',
      highlights: ['2023년 창업', '커피숍에서 시작', '15명 팀', '글로벌 진출']
    },
    {
      id: '5',
      type: 'achievements',
      title: '주요 성과',
      content: '- 2023.06: 시드 투자 5억원 유치\n- 2023.09: 사용자 1만명 돌파\n- 2023.12: 글로벌 어워드 수상\n- 2024.01: 일본 시장 진출',
      visibility: 'private',
      highlights: ['시드 투자', '1만명 사용자', '글로벌 어워드', '일본 진출']
    }
  ]);

  const [editingItems, setEditingItems] = useState<AboutItem[]>([...aboutItems]);
  const [newItem, setNewItem] = useState<Partial<AboutItem>>({
    type: 'story',
    title: '',
    content: '',
    visibility: 'public'
  });

  // 타입별 아이콘과 색상
  const getTypeStyle = (type: AboutItem['type']) => {
    const styles = {
      vision: { icon: Target, color: 'text-blue-600', bgColor: 'bg-blue-100', gradient: 'from-blue-500 to-indigo-600' },
      mission: { icon: Rocket, color: 'text-purple-600', bgColor: 'bg-purple-100', gradient: 'from-purple-500 to-pink-600' },
      values: { icon: Heart, color: 'text-red-600', bgColor: 'bg-red-100', gradient: 'from-red-500 to-rose-600' },
      story: { icon: Lightbulb, color: 'text-yellow-600', bgColor: 'bg-yellow-100', gradient: 'from-yellow-500 to-orange-600' },
      achievements: { icon: Award, color: 'text-green-600', bgColor: 'bg-green-100', gradient: 'from-green-500 to-emerald-600' }
    };
    return styles[type] || styles.story;
  };

  // 보기 모드에 따른 필터링
  const getVisibleItems = () => {
    return aboutItems.filter(item => {
      if (!item.visibility) return true;
      if (viewMode === 'private') return true;
      if (viewMode === 'team') return item.visibility !== 'private';
      if (viewMode === 'investors') return item.visibility === 'public' || item.visibility === 'investors';
      if (viewMode === 'public') return item.visibility === 'public';
      return false;
    });
  };

  const visibleItems = getVisibleItems();

  // 아이템 업데이트
  const handleItemUpdate = (id: string, field: keyof AboutItem, value: any) => {
    setEditingItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  // 저장
  const handleSave = () => {
    setAboutItems([...editingItems]);
    setLocalEditing(false);
  };

  // 취소
  const handleCancel = () => {
    setEditingItems([...aboutItems]);
    setLocalEditing(false);
  };

  // 새 섹션 추가
  const handleAddSection = () => {
    if (newItem.title && newItem.content) {
      const item: AboutItem = {
        id: Date.now().toString(),
        type: newItem.type as AboutItem['type'],
        title: newItem.title,
        content: newItem.content,
        visibility: newItem.visibility as any
      };
      setAboutItems([...aboutItems, item]);
      setNewItem({
        type: 'story',
        title: '',
        content: '',
        visibility: 'public'
      });
      setShowAddSection(false);
    }
  };

  // 섹션 삭제
  const handleDeleteSection = (id: string) => {
    setEditingItems(prev => prev.filter(item => item.id !== id));
  };

  // 하이라이트 키워드 렌더링
  const renderContentWithHighlights = (content: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) {
      return content;
    }

    let highlightedContent = content;
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi');
      highlightedContent = highlightedContent.replace(
        regex,
        `<mark class="bg-yellow-200 px-1 rounded">$1</mark>`
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">회사 소개</h3>
              <p className="text-sm text-gray-600">
                {visibleItems.length}개 섹션 표시 중
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {localEditing && (
              <button
                onClick={() => setShowAddSection(true)}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                섹션 추가
              </button>
            )}
            {localEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  title="저장"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  title="취소"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setLocalEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="편집"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 섹션 목록 */}
      <div className="p-6">
        {visibleItems.length === 0 ? (
          <div className="py-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">표시할 섹션이 없습니다</p>
            {localEditing && (
              <button
                onClick={() => setShowAddSection(true)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                첫 섹션 추가하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(localEditing ? editingItems.filter(item => getVisibleItems().some(v => v.id === item.id)) : visibleItems).map((item, index) => {
              const typeStyle = getTypeStyle(item.type);
              const Icon = typeStyle.icon;
              const isExpanded = expandedSection === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all duration-300 ${
                    isExpanded
                      ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* 섹션 헤더 */}
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedSection(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-gradient-to-br ${typeStyle.gradient} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        {localEditing ? (
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleItemUpdate(item.id, 'title', e.target.value)}
                            className="font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeStyle.bgColor} ${typeStyle.color} font-medium`}>
                            {item.type}
                          </span>
                          {item.visibility && item.visibility !== 'public' && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {item.visibility === 'private' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {item.visibility}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {localEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(item.id);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* 섹션 내용 (확장됨) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="pt-4">
                        {localEditing ? (
                          <div className="space-y-4">
                            <textarea
                              value={item.content}
                              onChange={(e) => handleItemUpdate(item.id, 'content', e.target.value)}
                              className="w-full p-3 border rounded-lg text-sm text-gray-700 resize-none focus:ring-2 focus:ring-blue-500"
                              rows={4}
                              placeholder="내용을 입력하세요..."
                            />
                            <div className="flex gap-4">
                              <select
                                value={item.type}
                                onChange={(e) => handleItemUpdate(item.id, 'type', e.target.value)}
                                className="px-3 py-1.5 border rounded-lg text-sm"
                              >
                                <option value="vision">비전</option>
                                <option value="mission">미션</option>
                                <option value="values">가치</option>
                                <option value="story">스토리</option>
                                <option value="achievements">성과</option>
                              </select>
                              <select
                                value={item.visibility}
                                onChange={(e) => handleItemUpdate(item.id, 'visibility', e.target.value)}
                                className="px-3 py-1.5 border rounded-lg text-sm"
                              >
                                <option value="public">공개</option>
                                <option value="investors">투자자만</option>
                                <option value="team">팀만</option>
                                <option value="private">비공개</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {renderContentWithHighlights(item.content, item.highlights)}
                            </div>

                            {/* 하이라이트 키워드 */}
                            {item.highlights && item.highlights.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                <span className="text-xs text-gray-500">핵심 키워드:</span>
                                {item.highlights.map((highlight, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                                  >
                                    {highlight}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 섹션 추가 모달 */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 섹션 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 우리의 비전"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value as AboutItem['type'] })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vision">비전</option>
                  <option value="mission">미션</option>
                  <option value="values">가치</option>
                  <option value="story">스토리</option>
                  <option value="achievements">성과</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
                <textarea
                  value={newItem.content}
                  onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="내용을 입력하세요..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공개 범위</label>
                <select
                  value={newItem.visibility}
                  onChange={(e) => setNewItem({ ...newItem, visibility: e.target.value as any })}
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
                onClick={handleAddSection}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowAddSection(false);
                  setNewItem({
                    type: 'story',
                    title: '',
                    content: '',
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

export default AboutSection;