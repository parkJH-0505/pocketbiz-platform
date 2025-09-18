import React, { useState } from 'react';
import {
  Eye,
  Lock,
  Globe,
  Users,
  Shield,
  Edit3,
  CheckCircle,
  Building2,
  FileText,
  Pen,
  X,
  AlertCircle,
  Check
} from 'lucide-react';
import { useMyProfile } from '../../contexts/MyProfileContext';
import { useVDRContext } from '../../contexts/VDRContext';

// 새로운 스토리텔링 섹션들 import
import HeroSection from './sections/HeroSection';
import AboutStorySection from './sections/AboutStorySection';
import JourneySection from './sections/JourneySection';

// 기존 컴포넌트들 (나중에 새 섹션으로 교체 예정)
import MetricsCard from './MetricsCard';
import TeamSection from './TeamSection';
import ContactInfo from './ContactInfo';

// 보기 모드 타입
type ViewMode = 'public' | 'investors' | 'team' | 'private';

const MyProfileTab: React.FC = () => {
  const { profile, loading, calculateCompleteness } = useMyProfile();
  const { getRepresentativeDocumentsForProfile } = useVDRContext();
  const [viewMode, setViewMode] = useState<ViewMode>('public');
  const [isGlobalEditing, setIsGlobalEditing] = useState(false);
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [ndaStatus, setNDAStatus] = useState<'not_signed' | 'signed'>('not_signed');

  // 프로필 완성도
  const completeness = calculateCompleteness();

  // 포켓비즈 디자인 시스템 색상
  const colors = {
    primary: "rgb(15, 82, 222)",
    GO: "rgb(112, 46, 220)", // 보라
    EC: "rgb(76, 206, 148)", // 초록
    PT: "rgb(251, 146, 60)", // 주황
  };

  // 보기 모드별 문서 필터링
  const getVisibleDocuments = () => {
    try {
      switch(viewMode) {
        case 'public':
          return getRepresentativeDocumentsForProfile('public');
        case 'investors':
          return getRepresentativeDocumentsForProfile('investors');
        case 'team':
          return getRepresentativeDocumentsForProfile('team');
        case 'private':
          // private 모드에서는 모든 대표 문서를 표시
          return getRepresentativeDocumentsForProfile('investors'); // 가장 많은 문서를 보여주는 모드
        default:
          return [];
      }
    } catch (error) {
      console.error('Error getting visible documents:', error);
      return [];
    }
  };

  const visibleDocs = getVisibleDocuments();

  // 보기 모드별 스타일
  const getViewModeStyle = () => {
    switch(viewMode) {
      case 'public':
        return {
          bg: 'from-blue-500 to-indigo-600',
          text: 'text-blue-700',
          border: 'border-blue-300',
          bgLight: 'bg-blue-50'
        };
      case 'investors':
        return {
          bg: 'from-purple-500 to-pink-600',
          text: 'text-purple-700',
          border: 'border-purple-300',
          bgLight: 'bg-purple-50'
        };
      case 'team':
        return {
          bg: 'from-green-500 to-emerald-600',
          text: 'text-green-700',
          border: 'border-green-300',
          bgLight: 'bg-green-50'
        };
      case 'private':
        return {
          bg: 'from-gray-500 to-slate-600',
          text: 'text-gray-700',
          border: 'border-gray-300',
          bgLight: 'bg-gray-50'
        };
    }
  };

  const viewStyle = getViewModeStyle();

  // 카테고리 라벨
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'ir_deck': 'IR 덱',
      'business_plan': '사업계획서',
      'financial': '재무제표',
      'marketing': '마케팅',
      'technical': '기술문서',
      'legal': '법무문서',
      'other': '기타'
    };
    return labels[category] || category;
  };

  // 공개 범위 라벨
  const getVisibilityLabel = (visibility: string) => {
    const labels: Record<string, string> = {
      'public': '전체 공개',
      'investors': '투자자 공개',
      'team': '팀 공개',
      'private': '비공개'
    };
    return labels[visibility] || visibility;
  };

  // 공개 범위 스타일
  const getVisibilityStyle = (visibility: string) => {
    const styles: Record<string, string> = {
      'public': 'bg-green-100 text-green-700',
      'investors': 'bg-purple-100 text-purple-700',
      'team': 'bg-blue-100 text-blue-700',
      'private': 'bg-gray-100 text-gray-700'
    };
    return styles[visibility] || 'bg-gray-100 text-gray-700';
  };

  // 보기 모드별 아이콘
  const getViewModeIcon = () => {
    switch(viewMode) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'investors':
        return <Lock className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      case 'private':
        return <Shield className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">프로필을 불러올 수 없습니다</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white rounded-lg hover:opacity-90"
          style={{ backgroundColor: colors.primary }}
        >
          새로고침
        </button>
      </div>
    );
  }

  // 섹션 간 스무스 네비게이션
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 컨트롤 바 - 고정 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 좌측: 프로필 완성도 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">마이프로필</h1>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${completeness}%`,
                          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.EC} 100%)`
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{completeness}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 중앙: 섹션 네비게이션 */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { id: 'hero', label: '소개', icon: '🏠' },
                { id: 'about', label: '스토리', icon: '📖' },
                { id: 'journey', label: '여정', icon: '🚀' },
                { id: 'impact', label: '성과', icon: '📊' },
                { id: 'team', label: '팀', icon: '👥' },
                { id: 'contact', label: '연락', icon: '📞' }
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-all hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900"
                  title={label}
                >
                  <span className="mr-1">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* 우측: 보기 모드 및 편집 */}
            <div className="flex items-center gap-3">
              {/* 편집 모드 토글 */}
              <button
                onClick={() => setIsGlobalEditing(!isGlobalEditing)}
                className={`px-2 py-1 rounded-md flex items-center gap-1.5 text-sm transition-colors ${
                  isGlobalEditing
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ backgroundColor: isGlobalEditing ? colors.primary : undefined }}
              >
                <Edit3 className="w-3 h-3" />
                편집
              </button>

              {/* 보기 모드 선택 */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {[
                  { key: 'public', label: '공개', icon: Globe },
                  { key: 'investors', label: '투자자', icon: Lock },
                  { key: 'team', label: '팀', icon: Users },
                  { key: 'private', label: '비공개', icon: Shield }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key as ViewMode)}
                    className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                      viewMode === key
                        ? `text-white`
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    style={{
                      backgroundColor: viewMode === key ? colors.primary : undefined
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - 스토리텔링 구조 */}
      <div>
        {/* 1. Hero Section - 큰 임팩트 */}
        <section id="hero" className="scroll-mt-20">
          <HeroSection
            viewMode={viewMode}
            isEditing={isGlobalEditing}
          />
        </section>

        {/* 2. About Story - 우리의 이야기 */}
        <section id="about" className="scroll-mt-20">
          <AboutStorySection
            viewMode={viewMode}
            isEditing={isGlobalEditing}
          />
        </section>

        {/* 3. Journey - 우리의 여정 */}
        <section id="journey" className="scroll-mt-20">
          <JourneySection
            viewMode={viewMode}
            isEditing={isGlobalEditing}
          />
        </section>

        {/* 4. Impact & Metrics - 우리의 성과 (임시로 기존 컴포넌트 사용) */}
        <section id="impact" className="py-20 bg-white scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: colors.PT + '15' }}
                >
                  <CheckCircle className="w-6 h-6" style={{ color: colors.PT }} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">우리의 성과</h2>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                데이터로 증명하는 포켓비즈의 성장과 임팩트
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <MetricsCard viewMode={viewMode} isEditing={isGlobalEditing} />

              {/* VDR 문서 섹션 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: colors.GO + '15' }}
                    >
                      <Shield className="w-5 h-5" style={{ color: colors.GO }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">주요 문서</h3>
                      <p className="text-sm text-gray-600">
                        {visibleDocs.length}개 문서 표시
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {visibleDocs.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm mb-2">
                        이 보기 모드에서 표시할 문서가 없습니다.
                      </p>
                      <p className="text-gray-400 text-xs">
                        VDR에서 문서 공개 범위를 설정해주세요.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visibleDocs.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: colors.primary + '15' }}
                            >
                              <Shield className="w-4 h-4" style={{ color: colors.primary }} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* NDA 버튼 섹션 */}
                  {visibleDocs.length > 0 && ndaStatus === 'not_signed' && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => setShowNDAModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Pen className="w-4 h-4" />
                        간편 NDA 작성하고 확인하기
                      </button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        NDA 체결 후 모든 문서에 접근하실 수 있습니다
                      </p>
                    </div>
                  )}

                  {ndaStatus === 'signed' && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        열람 가능 - NDA 체결 완료
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. People - 우리 팀 (임시로 기존 컴포넌트 사용) */}
        <section id="team" className="py-20 bg-gray-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: colors.EC + '15' }}
                >
                  <Users className="w-6 h-6" style={{ color: colors.EC }} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">우리 팀</h2>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                포켓비즈를 함께 만들어가는 사람들을 소개합니다
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <TeamSection viewMode={viewMode} isEditing={isGlobalEditing} />
            </div>
          </div>
        </section>

        {/* 6. Connect - 연락하기 (임시로 기존 컴포넌트 사용) */}
        <section id="contact" className="py-20 bg-white scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <Building2 className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">함께 하기</h2>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                포켓비즈와 함께 성장하고 싶다면 언제든 연락주세요
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <ContactInfo viewMode={viewMode} isEditing={isGlobalEditing} />
            </div>
          </div>
        </section>
      </div>

      {/* 보기 모드 플로팅 인디케이터 */}
      <div className="fixed bottom-6 right-6 z-40">
        <div
          className={`px-4 py-2 rounded-full text-sm font-medium border-2 shadow-lg backdrop-blur-sm ${viewStyle.border} ${viewStyle.bgLight}`}
        >
          <div className="flex items-center gap-2">
            {getViewModeIcon()}
            <span className={viewStyle.text}>
              {viewMode === 'public' && '공개 프로필'}
              {viewMode === 'investors' && '투자자 전용'}
              {viewMode === 'team' && '팀 내부용'}
              {viewMode === 'private' && '비공개 모드'}
            </span>
          </div>
        </div>
      </div>

      {/* 편집 모드 알림 */}
      {isGlobalEditing && (
        <div className="fixed bottom-6 left-6 z-40">
          <div
            className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              편집 모드 활성화
            </div>
          </div>
        </div>
      )}

      {/* 간편 NDA 모달 */}
      {showNDAModal && (
        <SimpleNDAModal
          onClose={() => setShowNDAModal(false)}
          onComplete={() => {
            setNDAStatus('signed');
            setShowNDAModal(false);
          }}
        />
      )}
    </div>
  );
};

// 간편 NDA 모달 컴포넌트
interface SimpleNDAModalProps {
  onClose: () => void;
  onComplete: () => void;
}

const SimpleNDAModal: React.FC<SimpleNDAModalProps> = ({ onClose, onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    position: '',
    purpose: '',
    agreed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.company || !formData.agreed) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    // 2초 후 완료 처리 (실제로는 API 호출)
    setTimeout(() => {
      console.log('NDA 체결 완료:', formData);
      setIsSubmitting(false);
      onComplete();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">간편 NDA 체결</h3>
                <p className="text-sm text-gray-600">정보 보호를 위한 비밀유지약정서</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">기본 정보</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="성명을 입력해주세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="이메일 주소"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    소속 기관/회사 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="소속을 입력해주세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="직책 (선택사항)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">열람 목적</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="문서 열람 목적을 간략히 설명해주세요 (선택사항)"
                  rows={3}
                />
              </div>
            </div>

            {/* NDA 조항 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                비밀유지약정 주요 조항
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 제공받은 모든 정보는 기밀로 취급하며 제3자에게 공개하지 않습니다.</p>
                <p>• 정보는 오직 검토 목적으로만 사용하며 다른 용도로 활용하지 않습니다.</p>
                <p>• 문서의 복사, 배포, 저장을 금지합니다.</p>
                <p>• 본 약정은 문서 열람 종료 후에도 유효합니다.</p>
              </div>
            </div>

            {/* 동의 체크박스 */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="nda-agreement"
                checked={formData.agreed}
                onChange={(e) => setFormData({...formData, agreed: e.target.checked})}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                required
              />
              <label htmlFor="nda-agreement" className="text-sm text-gray-700">
                <span className="text-red-500">*</span> 위 비밀유지약정 조항에 동의하며,
                제공받은 정보의 기밀성을 보장할 것을 서약합니다.
              </label>
            </div>

            {/* 버튼 */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.agreed}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    NDA 체결하고 문서 열람하기
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyProfileTab;