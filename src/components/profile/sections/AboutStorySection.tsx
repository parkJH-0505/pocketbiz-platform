import React, { useState } from 'react';
import {
  Target,
  Heart,
  Lightbulb,
  Rocket,
  Edit3,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Zap,
  Star
} from 'lucide-react';

interface StoryItem {
  id: string;
  type: 'vision' | 'mission' | 'values' | 'story';
  title: string;
  content: string;
  highlights?: string[];
}

interface AboutStorySectionProps {
  viewMode: 'public' | 'investors' | 'team' | 'private';
  isEditing?: boolean;
}

const AboutStorySection: React.FC<AboutStorySectionProps> = ({ viewMode, isEditing = false }) => {
  const [selectedStory, setSelectedStory] = useState<string>('story');
  const [localEditing, setLocalEditing] = useState(false);

  // 포켓비즈 디자인 시스템 색상
  const colors = {
    primary: "rgb(15, 82, 222)",
    GO: "rgb(112, 46, 220)", // 보라
    EC: "rgb(76, 206, 148)", // 초록
    PT: "rgb(251, 146, 60)", // 주황
    PF: "rgb(15, 82, 222)", // 파랑
  };

  // 스토리 데이터 (보기 모드별 필터링)
  const [stories] = useState<StoryItem[]>([
    {
      id: 'story',
      type: 'story',
      title: '우리의 시작',
      content: '2023년, 스타트업들이 체계적으로 성장할 수 있는 플랫폼의 필요성을 느낀 두 창업자가 만나 포켓비즈를 시작했습니다. 작은 아이디어에서 시작된 여정이 지금은 수많은 스타트업의 성장을 돕는 플랫폼으로 발전했습니다.\n\n매일 만나는 창업자들의 고민과 어려움을 보며, 우리는 단순한 도구가 아닌 진정한 성장 파트너가 되고자 합니다.',
      highlights: ['체계적 성장', '진정한 파트너', '창업자 중심']
    },
    {
      id: 'vision',
      type: 'vision',
      title: '우리가 꿈꾸는 미래',
      content: '모든 스타트업이 아이디어 단계부터 글로벌 진출까지 체계적이고 효율적으로 성장할 수 있는 생태계를 만드는 것입니다.\n\nAI와 데이터를 활용해 개인화된 성장 전략을 제공하고, 창업자들이 본질적인 가치 창조에 집중할 수 있도록 돕겠습니다.',
      highlights: ['체계적 성장', '글로벌 진출', 'AI 기반 전략']
    },
    {
      id: 'mission',
      type: 'mission',
      title: '우리가 하는 일',
      content: '스타트업의 성장 여정에서 필요한 모든 것을 하나의 플랫폼에서 해결할 수 있도록 돕습니다.\n\n• 빌드업 프로그램으로 단계별 성장 가이드\n• 스마트 매칭으로 최적의 기회 발견\n• VDR 시스템으로 투자 유치 지원\n• 데이터 기반 인사이트 제공',
      highlights: ['원스톱 플랫폼', '단계별 가이드', '데이터 인사이트']
    },
    {
      id: 'values',
      type: 'values',
      title: '우리의 가치',
      content: '혁신(Innovation) - 기존의 방식에 안주하지 않고 더 나은 방법을 찾습니다\n\n투명성(Transparency) - 모든 과정과 결과를 투명하게 공유합니다\n\n성장(Growth) - 고객과 함께 성장하며, 서로의 성공을 응원합니다\n\n협업(Collaboration) - 혼자가 아닌 함께할 때 더 큰 가치를 만들 수 있습니다',
      highlights: ['혁신', '투명성', '성장', '협업']
    }
  ]);

  // 타입별 스타일
  const getTypeStyle = (type: string) => {
    const styles = {
      story: { icon: Lightbulb, color: colors.PT, bg: `${colors.PT}15` },
      vision: { icon: Target, color: colors.PF, bg: `${colors.PF}15` },
      mission: { icon: Rocket, color: colors.GO, bg: `${colors.GO}15` },
      values: { icon: Heart, color: colors.EC, bg: `${colors.EC}15` }
    };
    return styles[type as keyof typeof styles] || styles.story;
  };

  // 보기 모드별 표시할 스토리 필터링
  const getVisibleStories = () => {
    if (viewMode === 'public') {
      return stories.filter(s => ['story', 'vision'].includes(s.type));
    }
    return stories;
  };

  const visibleStories = getVisibleStories();
  const currentStory = stories.find(s => s.id === selectedStory);

  // 하이라이트 키워드 렌더링
  const renderContentWithHighlights = (content: string, highlights?: string[]) => {
    if (!highlights) return content;

    let highlightedContent = content;
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi');
      highlightedContent = highlightedContent.replace(
        regex,
        `<mark style="background-color: ${colors.PT}20; color: ${colors.PT}; padding: 2px 4px; border-radius: 4px; font-weight: 600;">$1</mark>`
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.GO + '15' }}
            >
              <Sparkles className="w-6 h-6" style={{ color: colors.GO }} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">우리의 이야기</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            포켓비즈가 걸어온 길과 앞으로 나아갈 방향을 소개합니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 스토리 네비게이션 */}
          <div className="lg:col-span-1">
            <div className="space-y-2 lg:sticky lg:top-8">
              {visibleStories.map((story) => {
                const style = getTypeStyle(story.type);
                const Icon = style.icon;
                const isActive = selectedStory === story.id;

                return (
                  <button
                    key={story.id}
                    onClick={() => setSelectedStory(story.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 group hover:bg-gray-50 ${
                      isActive
                        ? 'shadow-lg transform scale-105'
                        : 'hover:shadow-md hover:transform hover:scale-102'
                    }`}
                    style={{
                      backgroundColor: isActive ? style.bg : 'transparent',
                      border: `2px solid ${isActive ? style.color : '#e5e7eb'}`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-all ${
                          isActive ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                        style={{ backgroundColor: style.bg }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: style.color }}
                        />
                      </div>
                      <div>
                        <h3
                          className={`font-semibold transition-colors ${
                            isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                          }`}
                        >
                          {story.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-gray-500 capitalize">{story.type}</span>
                          {isActive && (
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 우측: 선택된 스토리 내용 */}
          <div className="lg:col-span-2">
            {currentStory && (
              <div className="bg-gray-50 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
                {/* 배경 패턴 */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                  <div
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: getTypeStyle(currentStory.type).color }}
                  />
                </div>

                {/* 편집 버튼 */}
                {isEditing && (
                  <button
                    onClick={() => setLocalEditing(!localEditing)}
                    className="absolute top-6 right-6 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </button>
                )}

                {/* 내용 */}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: getTypeStyle(currentStory.type).bg }}
                    >
                      {React.createElement(getTypeStyle(currentStory.type).icon, {
                        className: "w-6 h-6",
                        style: { color: getTypeStyle(currentStory.type).color }
                      })}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {currentStory.title}
                    </h3>
                  </div>

                  <div className="prose prose-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {renderContentWithHighlights(currentStory.content, currentStory.highlights)}
                  </div>

                  {/* 하이라이트 키워드 */}
                  {currentStory.highlights && currentStory.highlights.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">핵심 키워드</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentStory.highlights.map((highlight, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: colors.PT + '20',
                              color: colors.PT
                            }}
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 CTA (공개 모드에서만) */}
        {viewMode === 'public' && (
          <div className="mt-16 text-center">
            <div
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
              style={{ backgroundColor: colors.primary + '15', color: colors.primary }}
            >
              <Zap className="w-4 h-4" />
              더 자세한 이야기가 궁금하다면 연락주세요
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutStorySection;