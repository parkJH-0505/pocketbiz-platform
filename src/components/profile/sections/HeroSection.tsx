import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Globe,
  Edit3,
  Check,
  Star,
  Rocket,
  Target,
  Award
} from 'lucide-react';
import { useMyProfile } from '../../../contexts/MyProfileContext';

interface HeroSectionProps {
  viewMode: 'public' | 'investors' | 'team' | 'private';
  isEditing?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ viewMode, isEditing = false }) => {
  const { profile, updateCompany, updateBusiness } = useMyProfile();
  const [localEditing, setLocalEditing] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [editData, setEditData] = useState({
    name: profile?.company.name || '',
    description: profile?.company.description || '',
    tagline: '혁신을 통해 더 나은 세상을 만듭니다', // 새로운 필드
    industry: profile?.business.industry || '',
    location: `${profile?.company.address.city || '서울'}, ${profile?.company.address.country || '한국'}`
  });

  // 스크롤 패럴랙스 효과
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 포켓비즈 디자인 시스템 색상
  const colors = {
    primary: "rgb(15, 82, 222)",
    primaryHover: "rgb(12, 66, 178)",
    primaryLight: "rgba(15, 82, 222, 0.1)",
    GO: "rgb(112, 46, 220)", // 보라
    EC: "rgb(76, 206, 148)", // 초록
    PT: "rgb(251, 146, 60)", // 주황
  };

  // 핵심 지표 (간단하게 표시)
  const quickStats = [
    {
      icon: Users,
      label: '팀 규모',
      value: profile?.company.employeeCount || '1-5명',
      color: colors.EC
    },
    {
      icon: Calendar,
      label: '설립',
      value: profile?.company.foundedYear ? `${profile.company.foundedYear}년` : '2023년',
      color: colors.PT
    },
    {
      icon: TrendingUp,
      label: '단계',
      value: profile?.funding.currentStage === 'pre-seed' ? 'Pre-Seed' :
             profile?.funding.currentStage === 'seed' ? 'Seed' : 'Series A+',
      color: colors.GO
    }
  ];

  const handleSave = async () => {
    await updateCompany({
      name: editData.name,
      description: editData.description
    });
    await updateBusiness({
      industry: editData.industry
    });
    setLocalEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: profile?.company.name || '',
      description: profile?.company.description || '',
      tagline: '혁신을 통해 더 나은 세상을 만듭니다',
      industry: profile?.business.industry || '',
      location: `${profile?.company.address.city || '서울'}, ${profile?.company.address.country || '한국'}`
    });
    setLocalEditing(false);
  };

  return (
    <div className="relative overflow-hidden">
      {/* 배경 그라데이션 - 패럴랙스 효과 */}
      <div
        className="absolute inset-0 bg-gradient-to-br opacity-5 transition-transform duration-75"
        style={{
          backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.GO} 100%)`,
          transform: `translateY(${scrollY * 0.3}px)`
        }}
      />

      {/* 배경 기하학적 패턴 - 깔끔하고 전문적 */}
      <div
        className="absolute inset-0 opacity-5 transition-transform duration-75"
        style={{ transform: `translateY(${scrollY * 0.05}px)` }}
      >
        <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: colors.GO, stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>

          {/* 대각선 그리드 라인 */}
          <g stroke="url(#grid-gradient)" strokeWidth="1" fill="none">
            {/* 수직선 */}
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={i * 100}
                y1="0"
                x2={i * 100}
                y2="1000"
                opacity={0.3}
              />
            ))}
            {/* 수평선 */}
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1="0"
                y1={i * 100}
                x2="1000"
                y2={i * 100}
                opacity={0.2}
              />
            ))}
          </g>

          {/* 기하학적 도형들 */}
          <g fill="url(#grid-gradient)" opacity="0.1">
            <circle cx="150" cy="200" r="30" />
            <rect x="700" y="100" width="50" height="50" transform="rotate(45 725 125)" />
            <circle cx="850" cy="400" r="20" />
            <rect x="100" y="600" width="40" height="40" transform="rotate(45 120 620)" />
            <circle cx="600" cy="750" r="25" />
          </g>
        </svg>
      </div>

      {/* 추가 장식 요소 - 오른쪽 상단 */}
      <div
        className="absolute top-0 right-0 w-96 h-96 opacity-5 transition-transform duration-75"
        style={{ transform: `translateY(${scrollY * -0.1}px) translateX(${scrollY * 0.05}px)` }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <defs>
            <radialGradient id="radial-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{ stopColor: colors.GO, stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: colors.primary, stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="200" fill="url(#radial-gradient)" />
        </svg>
      </div>

      <div
        className="relative px-4 py-16 sm:py-24 transition-transform duration-75"
        style={{ transform: `translateY(${scrollY * 0.05}px)` }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* 편집 버튼 */}
          {isEditing && (
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              {localEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="p-2 bg-white text-green-600 rounded-lg shadow-sm hover:shadow-md transition-all"
                    title="저장"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 bg-white text-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all"
                    title="취소"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setLocalEditing(true)}
                  className="p-2 bg-white text-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all"
                  title="편집"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* 회사 로고/아이콘 */}
          <div className="mb-8">
            <div
              className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.GO} 100%)`
              }}
            >
              <Building2 className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* 회사명 */}
          <div className="mb-4">
            {localEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-4xl sm:text-5xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-200 focus:border-blue-500 outline-none text-center px-4 py-2"
                placeholder="회사명을 입력하세요"
              />
            ) : (
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                {profile?.company.name || '회사명을 입력하세요'}
              </h1>
            )}
          </div>

          {/* 한 줄 소개 */}
          <div className="mb-8">
            {localEditing ? (
              <textarea
                value={editData.tagline}
                onChange={(e) => setEditData({ ...editData, tagline: e.target.value })}
                className="text-xl text-gray-600 bg-transparent border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none text-center px-4 py-3 w-full max-w-2xl mx-auto resize-none"
                rows={2}
                placeholder="회사의 한 줄 소개를 작성해주세요"
              />
            ) : (
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {editData.tagline}
              </p>
            )}
          </div>

          {/* 기본 정보 */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {localEditing ? (
                <input
                  type="text"
                  value={editData.industry}
                  onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                  className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                  placeholder="업종"
                />
              ) : (
                <span>{profile?.business.industry || '업종 미입력'}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{editData.location}</span>
            </div>

            {viewMode !== 'public' && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>{profile?.company.website || 'www.company.com'}</span>
              </div>
            )}
          </div>

          {/* 핵심 지표 (간단하게) */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-12">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div
                    className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA 버튼들 (보기 모드별) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {viewMode === 'public' && (
              <>
                <button
                  className="px-6 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                  style={{ backgroundColor: colors.primary }}
                >
                  <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    더 알아보기
                  </div>
                </button>
                <button className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    연락하기
                  </div>
                </button>
              </>
            )}

            {viewMode === 'investors' && (
              <button
                className="px-6 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                style={{ backgroundColor: colors.GO }}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  투자 제안서 보기
                </div>
              </button>
            )}
          </div>

          {/* 보기 모드 인디케이터 */}
          <div className="mt-8 flex justify-center">
            <div
              className="px-4 py-2 rounded-full text-sm font-medium border-2"
              style={{
                borderColor: colors.primaryLight,
                backgroundColor: colors.primaryLight,
                color: colors.primary
              }}
            >
              {viewMode === 'public' && '🌐 공개 프로필'}
              {viewMode === 'investors' && '🔒 투자자 전용'}
              {viewMode === 'team' && '👥 팀 내부'}
              {viewMode === 'private' && '🔐 비공개'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;