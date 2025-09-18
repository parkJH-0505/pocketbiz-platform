import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  Users,
  ChevronRight,
  Plus,
  Minus,
  X,
  FileText,
  Code,
  Palette,
  Megaphone,
  DollarSign,
  Package,
  ShoppingBag,
  Sparkles,
  Award,
  TrendingUp,
  Shield,
  CheckCircle,
  Eye,
  Heart,
  Zap,
  Clock,
  Percent
} from 'lucide-react';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import { useKPIDiagnosis } from '../../../contexts/KPIDiagnosisContext';
import { useLoading } from '../../../contexts/LoadingContext';
import ContractFlowModal from '../../../components/buildup/ContractFlowModal';
import ServiceDetailModal from '../../../components/buildup/ServiceDetailModal';
import { ServiceCardSkeleton } from '../../../components/ui/SkeletonLoader';
import type { BuildupService } from '../../../types/buildup.types';
import { PHASE_INFO, ALL_PHASES } from '../../../utils/projectPhaseUtils';

interface ServiceItem {
  id: string;
  badge?: 'HOT' | '신규' | '할인' | '추천';
  title: string;
  provider: '포켓' | string;
  category: string;
  subcategory?: string;
  thumbnail?: string;
  description: string;
  deliverables: string[];
  benefits: {
    targetAreas: string[];  // 지원 영역
    description: string;    // 효과 설명
    experience?: string;    // 지원 경험 (예: "50개 기업 지원")
  };
  price: {
    type?: 'consultation' | 'fixed';
    original: number;
    discounted?: number;
    unit: '프로젝트' | '월' | '회';
  };
  duration: string;
  rating: number;
  reviews: number;
  recentClient?: string;
  tags: string[];
  targetStage: string[];
  bundleWith?: string[];
}

interface CartItem extends ServiceItem {
  quantity: number;
  options?: {
    scope: '기본' | '프리미엄' | '커스텀';
    rushDelivery?: boolean;
    addOns?: string[];
  };
}

interface FilterState {
  category: string;
  priceRange: [number, number];
  duration: string;
  targetAxis: string[];
  urgency: string;
  searchQuery: string;
}

export default function ServiceCatalog() {
  const navigate = useNavigate();
  const {
    createProject,
    services: buildupServices,
    loadingServices: servicesLoading,
    searchServices,
    filterByCategory,
    getFeaturedServices,
    getRecommendedServices,
    cart: contextCart,
    addToCart: contextAddToCart,
    removeFromCart: contextRemoveFromCart,
    updateCartItem,
    clearCart,
    projects // 🔥 Sprint 3 Phase 2: 프로젝트 정보 가져오기
  } = useBuildupContext();
  const { currentStage, axisScores } = useKPIDiagnosis();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: [0, 5000],
    duration: 'all',
    targetAxis: [],
    urgency: 'all',
    searchQuery: ''
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cart = contextCart; // BuildupContext의 cart 사용
  const [selectedService, setSelectedService] = useState<BuildupService | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'kpi' | 'similar' | 'trending' | 'phase'>('phase'); // 🔥 Sprint 3 Phase 2: phase 추천 추가
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [favoriteServices, setFavoriteServices] = useState<string[]>([]);
  const [quickViewService, setQuickViewService] = useState<BuildupService | null>(null);

  // Service categories
  const categories = [
    { id: 'all', label: '전체', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'document', label: '문서작업', icon: <FileText className="w-4 h-4" /> },
    { id: 'development', label: '개발', icon: <Code className="w-4 h-4" /> },
    { id: 'marketing', label: '마케팅', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'design', label: '디자인', icon: <Palette className="w-4 h-4" /> },
    { id: 'investment', label: '투자', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'consulting', label: '컨설팅', icon: <Users className="w-4 h-4" /> }
  ];

  const subcategories: Record<string, { id: string; label: string }[]> = {
    document: [
      { id: 'ir', label: 'IR' },
      { id: 'business-plan', label: '사업계획서' },
      { id: 'tips', label: 'TIPS' },
      { id: 'rnd', label: 'R&D제안서' }
    ],
    development: [
      { id: 'mvp', label: 'MVP' },
      { id: 'website', label: '웹사이트' },
      { id: 'app', label: '앱' },
      { id: 'backend', label: '백엔드' }
    ],
    marketing: [
      { id: 'digital', label: '디지털마케팅' },
      { id: 'content', label: '콘텐츠' },
      { id: 'pr', label: 'PR' },
      { id: 'growth', label: '그로스해킹' }
    ]
  };

  // Convert BuildupService to ServiceItem format
  const mapBuildupServiceToServiceItem = (service: BuildupService): ServiceItem => {
    // Category mapping
    const categoryMap: Record<string, string> = {
      '문서작업': 'document',
      '개발': 'development',
      '마케팅': 'marketing',
      '디자인': 'design',
      '투자': 'investment',
      '컨설팅': 'consulting'
    };

    // Use badge from service or determine based on metadata
    let badge = service.badge;
    if (!badge) {
      if (service.reviews?.avg_rating >= 4.8) badge = 'HOT';
      else if (service.reviews?.total_count < 20) badge = '신규';
      else if (service.price?.discounted && service.price.discounted < service.price.original * 0.8) badge = '할인';
    }

    // Extract target areas from benefits or map from KPI improvements
    const targetAreas = service.benefits?.target_areas || [];
    if (targetAreas.length === 0 && service.benefits?.kpi_improvement) {
      const kpiImprovements = service.benefits.kpi_improvement;
      const significantAxes = Object.entries(kpiImprovements)
        .filter(([_, value]) => value > 0)
        .map(([axis]) => {
          const axisNames: Record<string, string> = {
            'GO': '고객',
            'EC': '경제성',
            'PT': '제품',
            'PF': '팀',
            'TO': '운영'
          };
          return axisNames[axis] || axis;
        });
      targetAreas.push(...significantAxes);
    }

    return {
      id: service.service_id,
      badge: badge as any,
      title: service.name,
      provider: service.provider?.name || '포켓',
      category: categoryMap[service.category] || service.category.toLowerCase(),
      subcategory: service.subcategory,
      description: service.subtitle,
      deliverables: service.deliverables?.main || [],
      benefits: {
        targetAreas: targetAreas,
        description: service.description,
        experience: service.provider?.experience || `${service.portfolio?.total_count || 0}개 프로젝트 완료`
      },
      price: {
        type: service.price?.type,
        original: Math.round((service.price?.original || 0) / 10000), // Convert to 만원
        discounted: service.price?.discounted ? Math.round(service.price.discounted / 10000) : undefined,
        unit: (service.price?.unit || '프로젝트') as any
      },
      duration: service.duration?.display || `${service.duration?.weeks || 0}주`,
      rating: Math.round((service.reviews?.avg_rating || 0) * 10) / 10,
      reviews: service.reviews?.total_count || 0,
      recentClient: service.portfolio?.highlights?.[0]?.client_type,
      tags: service.tags || [],
      targetStage: service.target?.stage || []
    };
  };

  // Get services from context or use empty array
  const services: ServiceItem[] = buildupServices.map(mapBuildupServiceToServiceItem);

  // Get recommended services based on KPI gaps (local wrapper)
  const getLocalRecommendedServices = () => {
    // 🔥 Sprint 3 Phase 2: 단계별 추천 로직 추가
    if (recommendationType === 'phase') {
      // 현재 활성 프로젝트의 단계 가져오기
      const activeProject = projects.find(p => p.status === 'active');
      if (!activeProject) return services.slice(0, 3);

      const currentPhase = activeProject.phase || 'planning';

      // 단계별 추천 서비스 매핑
      const phaseRecommendations: Record<string, string[]> = {
        'contract_pending': ['consulting', 'support'], // 계약 대기: 컨설팅, 지원
        'contract_signed': ['planning', 'consulting'], // 계약 체결: 기획, 컨설팅
        'planning': ['branding', 'development', 'support'], // 기획: 브랜딩, 개발, 지원
        'design': ['branding', 'development'], // 디자인: 브랜딩, 개발
        'execution': ['marketing', 'support', 'investment'], // 실행: 마케팅, 지원, 투자
        'review': ['marketing', 'investment'], // 검토: 마케팅, 투자
        'completed': ['marketing', 'investment'] // 완료: 마케팅, 투자
      };

      const recommendedCategories = phaseRecommendations[currentPhase] || [];
      return services.filter(service =>
        recommendedCategories.includes(service.category)
      ).slice(0, 3);
    }

    if (!axisScores) return services;

    // Find lowest scoring axes
    const weakAxes = Object.entries(axisScores)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2)
      .map(([axis]) => axis);

    // Map axes to relevant service categories
    const axisToCategory: Record<string, string[]> = {
      'GO': ['consulting', 'document'],
      'EC': ['development', 'marketing'],
      'PT': ['development', 'marketing'],
      'PF': ['document', 'consulting'],
      'TO': ['consulting', 'document']
    };

    // Recommend services that match weak axis categories
    const relevantCategories = weakAxes.flatMap(axis => axisToCategory[axis] || []);
    return services.filter(service =>
      relevantCategories.includes(service.category)
    ).slice(0, 3);
  };

  // Calculate bundle discount
  const calculateBundleDiscount = (items: CartItem[]) => {
    let discount = 0;
    const itemIds = items.map(item => item.service.service_id);

    // Check for bundle combinations
    items.forEach(item => {
      if (item.service.bundle?.recommended_with) {
        const bundleMatch = item.service.bundle.recommended_with.some(bundleId => itemIds.includes(bundleId));
        if (bundleMatch) {
          const price = (item.service.price?.original || 0) / 10000;
          discount += price * (item.service.bundle.bundle_discount / 100);
        }
      }
    });

    return discount;
  };

  // Add to cart - BuildupService를 직접 사용
  const addToCart = (service: BuildupService, options?: CartItem['options']) => {
    contextAddToCart(service, options);
    setIsCartOpen(true);

    // 장바구니 추가 피드백 애니메이션
    const button = document.getElementById(`cart-btn-${service.service_id}`);
    if (button) {
      button.classList.add('animate-bounce');
      setTimeout(() => button.classList.remove('animate-bounce'), 500);
    }
  };

  const toggleFavorite = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleQuickView = (service: ServiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewService(service);
  };

  // Remove from cart
  const removeFromCart = (serviceId: string) => {
    contextRemoveFromCart(serviceId);
  };

  // Update quantity
  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId);
    } else {
      // BuildupContext에는 quantity 개념이 없으므로 현재는 동작하지 않음
      // 추후 필요시 updateCartItem으로 구현 가능
    }
  };

  // Calculate cart total
  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
      const price = (item.service.price?.original || 0) / 10000; // 만원 단위
      return sum + (price * item.quantity);
    }, 0);
    
    const bundleDiscount = calculateBundleDiscount(cart);
    
    return {
      subtotal,
      bundleDiscount,
      total: subtotal - bundleDiscount
    };
  };

  // Filter services
  const getFilteredServices = () => {
    let filtered = [...services];
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    
    // Subcategory filter
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(s => s.subcategory === selectedSubcategory);
    }
    
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Price filter
    filtered = filtered.filter(s => {
      const price = s.price.discounted || s.price.original;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });
    
    return filtered;
  };

  const filteredServices = getFilteredServices();
  const recommendedServices = getLocalRecommendedServices();
  const cartTotal = getCartTotal();

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'HOT': return 'bg-red-500 text-white';
      case '신규': return 'bg-green-500 text-white';
      case '할인': return 'bg-orange-500 text-white';
      case '추천': return 'bg-blue-500 text-white';
      default: return '';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'development': return <Code className="w-4 h-4" />;
      case 'marketing': return <Megaphone className="w-4 h-4" />;
      case 'design': return <Palette className="w-4 h-4" />;
      case 'investment': return <DollarSign className="w-4 h-4" />;
      case 'consulting': return <Users className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  // 카테고리별 컬러 테마
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'document': 
        return {
          gradient: 'from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          icon: 'bg-blue-100 text-blue-600',
          accent: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700'
        };
      case 'development': 
        return {
          gradient: 'from-purple-50 to-pink-50',
          border: 'border-purple-200',
          icon: 'bg-purple-100 text-purple-600',
          accent: 'text-purple-600',
          badge: 'bg-purple-100 text-purple-700'
        };
      case 'marketing': 
        return {
          gradient: 'from-orange-50 to-red-50',
          border: 'border-orange-200',
          icon: 'bg-orange-100 text-orange-600',
          accent: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700'
        };
      case 'design': 
        return {
          gradient: 'from-pink-50 to-rose-50',
          border: 'border-pink-200',
          icon: 'bg-pink-100 text-pink-600',
          accent: 'text-pink-600',
          badge: 'bg-pink-100 text-pink-700'
        };
      case 'investment': 
        return {
          gradient: 'from-green-50 to-emerald-50',
          border: 'border-green-200',
          icon: 'bg-green-100 text-green-600',
          accent: 'text-green-600',
          badge: 'bg-green-100 text-green-700'
        };
      case 'consulting': 
        return {
          gradient: 'from-cyan-50 to-sky-50',
          border: 'border-cyan-200',
          icon: 'bg-cyan-100 text-cyan-600',
          accent: 'text-cyan-600',
          badge: 'bg-cyan-100 text-cyan-700'
        };
      default: 
        return {
          gradient: 'from-gray-50 to-gray-100',
          border: 'border-gray-200',
          icon: 'bg-gray-100 text-gray-600',
          accent: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  // 신뢰 뱃지 생성
  const getTrustBadge = (service: ServiceItem) => {
    if (service.reviews >= 100) return { text: '베스트셀러', color: 'bg-yellow-100 text-yellow-800' };
    if (service.rating >= 4.8) return { text: '최고평점', color: 'bg-green-100 text-green-800' };
    if (service.benefits.experience?.includes('100')) return { text: '검증된 파트너', color: 'bg-blue-100 text-blue-800' };
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">서비스 카탈로그</h1>
              <p className="text-sm text-gray-600 mt-1">필요한 서비스를 쇼핑하듯 탐색하고 구매하세요</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="서비스 검색..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Categories & Filters */}
          <div className="w-64 space-y-4">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">카테고리</h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedSubcategory('all');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 ${
                      selectedCategory === category.id
                        ? `${getCategoryTheme(category.id).badge} font-medium shadow-sm`
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={selectedCategory === category.id ? getCategoryTheme(category.id).accent : ''}>
                      {category.icon}
                    </span>
                    {category.label}
                    {selectedCategory === category.id && (
                      <CheckCircle className="w-3 h-3 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Subcategories */}
              {selectedCategory !== 'all' && subcategories[selectedCategory] && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">세부 카테고리</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedSubcategory('all')}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs ${
                        selectedSubcategory === 'all'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      전체
                    </button>
                    {subcategories[selectedCategory].map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubcategory(sub.id)}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs ${
                          selectedSubcategory === sub.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">가격대</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {filters.priceRange[0]}만원
                    </span>
                    <span className="text-gray-600">
                      {filters.priceRange[1]}만원
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters({
                      ...filters,
                      priceRange: [filters.priceRange[0], parseInt(e.target.value)]
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Duration Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">소요 기간</h3>
              <div className="space-y-2">
                {['전체', '1주', '2주', '1개월', '3개월+'].map(duration => (
                  <label key={duration} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="duration"
                      checked={filters.duration === duration}
                      onChange={() => setFilters({ ...filters, duration })}
                      className="text-blue-600"
                    />
                    <span className="text-gray-700">{duration}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Favorites Section */}
            {favoriteServices.length > 0 && (
              <div className="mb-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    찜한 서비스 ({favoriteServices.length})
                  </h2>
                  <button 
                    onClick={() => setFavoriteServices([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    모두 해제
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {services.filter(s => favoriteServices.includes(s.id)).map(service => (
                    <div key={service.id} className="flex-shrink-0 bg-white rounded-lg p-3 border border-red-200 min-w-[200px]">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{service.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{service.price.discounted || service.price.original}만원</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Recommendations */}
            {recommendedServices.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      {recommendationType === 'phase' && '현재 단계 맞춤 추천'}
                      {recommendationType === 'kpi' && 'KPI 기반 맞춤 추천'}
                      {recommendationType === 'similar' && '유사 기업이 선택한 서비스'}
                      {recommendationType === 'trending' && '이번 주 인기 서비스'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {recommendationType === 'phase' && (() => {
                        const activeProject = projects.find(p => p.status === 'active');
                        const phaseLabel = activeProject ? PHASE_INFO[activeProject.phase]?.label : '기획';
                        return `${phaseLabel} 단계에 필요한 서비스를 추천해드려요`;
                      })()}
                      {recommendationType === 'kpi' && `낮은 KPI 영역: ${axisScores?.GO < 3 ? '목표설정 ' : ''}${axisScores?.EC < 3 ? '고객관리 ' : ''}${axisScores?.PT < 3 ? '제품개발' : ''}`}
                      {recommendationType === 'similar' && '같은 업종의 스타트업이 많이 선택했어요'}
                      {recommendationType === 'trending' && '최근 7일간 가장 많이 선택된 서비스'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRecommendationType('phase')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        recommendationType === 'phase'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600'
                      }`}
                    >
                      현재 단계
                    </button>
                    <button
                      onClick={() => setRecommendationType('kpi')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        recommendationType === 'kpi'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600'
                      }`}
                    >
                      KPI 기반
                    </button>
                    <button
                      onClick={() => setRecommendationType('similar')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        recommendationType === 'similar'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600'
                      }`}
                    >
                      유사 기업
                    </button>
                    <button
                      onClick={() => setRecommendationType('trending')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        recommendationType === 'trending'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600'
                      }`}
                    >
                      인기
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {recommendedServices.map(service => (
                    <div 
                      key={service.id} 
                      className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => {
                        // 실제 BuildupService 데이터 찾기
                        const buildupService = buildupServices.find(s => s.service_id === service.id);
                        if (buildupService) {
                          setSelectedService(buildupService);
                          setShowDetailModal(true);
                        }
                      }}
                    >
                      {/* Compact Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 border-b border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">
                            {categories.find(c => c.id === service.category)?.label}
                          </span>
                          {service.badge && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-600 rounded-full">
                              맞춤
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Body */}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-1 group-hover:text-blue-600">
                          {service.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {service.description}
                        </p>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            {service.price?.type === 'consultation' ? (
                              <span className="text-base font-bold text-blue-600">
                                상담 문의
                              </span>
                            ) : (
                              <span className="text-base font-bold text-gray-900">
                                {service.price.discounted || service.price.original}만원
                              </span>
                            )}
                            <span className="text-xs text-gray-500 ml-1">
                              {service.duration}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">후기 {service.reviews}개</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {servicesLoading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <ServiceCardSkeleton key={index} />
                ))
              ) : (
                filteredServices.map(service => (
                <div
                  key={service.id}
                  className={`relative bg-white rounded-xl shadow-md ${getCategoryTheme(service.category).border} border hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col h-[380px] hover:-translate-y-1`}
                  onMouseEnter={() => setHoveredCard(service.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => {
                    // 실제 BuildupService 데이터 찾기
                    const buildupService = buildupServices.find(s => s.service_id === service.id);
                    if (buildupService) {
                      setSelectedService(buildupService);
                      setShowDetailModal(true);
                    }
                  }}
                >
                  {/* 프리미엄 효과 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  
                  {/* 빠른 액션 버튼들 */}
                  <div className={`absolute bottom-4 right-4 flex flex-col gap-2 transition-all duration-300 z-10 ${
                    hoveredCard === service.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}>
                    <button
                      onClick={(e) => toggleFavorite(service.id, e)}
                      className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Heart className={`w-4 h-4 ${
                        favoriteServices.includes(service.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-gray-400'
                      }`} />
                    </button>
                    <button
                      onClick={(e) => handleQuickView(service, e)}
                      className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      id={`cart-btn-${service.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // ServiceItem이 아닌 실제 BuildupService를 찾아서 전달
                        const buildupService = buildupServices.find(s => s.service_id === service.id);
                        if (buildupService) {
                          addToCart(buildupService);
                        }
                      }}
                      className="w-8 h-8 bg-blue-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* TIER 1: Header - Category & Trust Signals */}
                  <div className={`relative h-24 bg-gradient-to-br ${getCategoryTheme(service.category).gradient} px-4 py-3`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${getCategoryTheme(service.category).icon}`}>
                          {getCategoryIcon(service.category)}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {categories.find(c => c.id === service.category)?.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {service.provider} · {service.benefits.experience || '전문 파트너'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 7단계 진행 예시 - 미니 프로그레스 바 */}
                    <div className="absolute bottom-2 left-4 right-4">
                      <div className="flex items-center gap-1">
                        {ALL_PHASES.map((phase, idx) => (
                          <div
                            key={phase}
                            className={`flex-1 h-1 rounded-full transition-all ${
                              idx <= 3 // 보통 서비스는 설계-실행 단계까지
                                ? getCategoryTheme(service.category).icon.split(' ')[1]
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* TIER 2: Body - Core Value Proposition */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Service Title */}
                    <h3 className={`font-bold text-gray-900 text-lg mb-2 line-clamp-1 transition-colors group-hover:${getCategoryTheme(service.category).accent}`}>
                      {service.title}
                    </h3>
                    
                    {/* Main Description - 핵심 가치 제안 */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                    
                    {/* 성과 지표 */}
                    {service.benefits.experience && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-medium text-gray-700">{service.benefits.experience}</span>
                        </div>
                        {service.reviews >= 30 && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs font-medium text-gray-700">만족도 95%</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Key Deliverables - 주요 산출물 2개만 */}
                    <div className="space-y-1.5 mb-3 flex-grow">
                      {service.deliverables.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 group/item">
                          <div className={`w-1.5 h-1.5 ${getCategoryTheme(service.category).icon.split(' ')[1]} rounded-full mt-1.5 flex-shrink-0`}></div>
                          <span className="text-xs text-gray-700 line-clamp-1 group-hover/item:text-gray-900 transition-colors">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* TIER 3: Footer - Price, Duration & Trust */}
                  <div className="px-5 pb-4 pt-3 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      {/* Price & Duration */}
                      <div>
                        <div className="flex items-baseline gap-2">
                          {service.price?.type === 'consultation' ? (
                            <span className="text-base font-semibold text-blue-600">
                              상담 문의
                            </span>
                          ) : (
                            <span className="text-base font-semibold text-gray-900">
                              {service.price.discounted || service.price.original}만원
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            · {service.duration}
                          </span>
                        </div>
                      </div>
                      
                      {/* Trust Indicators */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">
                          후기 {service.reviews}개
                        </p>
                        {service.reviews >= 50 && (
                          <div className="flex items-center gap-0.5 justify-end mt-1">
                            <Shield className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-600">검증완료</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform z-30 ${
        isCartOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                장바구니
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">장바구니가 비어있습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.service.service_id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{item.service.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {item.service.provider?.name || '포켓'} · {item.service.duration?.display || `${item.service.duration?.weeks}주`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.service.service_id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {Math.round((item.service.price?.original || 0) / 10000).toLocaleString()}만원
                      </span>
                    </div>
                    
                    {/* Options */}
                    {item.options && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          옵션: {item.options.scope}
                          {item.options.rushDelivery && ' · 긴급배송'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Bundle Discount Alert */}
                {cartTotal.bundleDiscount > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      번들 할인 적용
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      함께 구매하여 {cartTotal.bundleDiscount.toLocaleString()}만원 할인!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              {/* Total */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">소계</span>
                  <span>{cartTotal.subtotal.toLocaleString()}만원</span>
                </div>
                {cartTotal.bundleDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">번들 할인</span>
                    <span className="text-green-600">-{cartTotal.bundleDiscount.toLocaleString()}만원</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
                  <span>총액</span>
                  <span className="text-blue-600">{cartTotal.total.toLocaleString()}만원</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/startup/cart')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  장바구니 페이지로 이동
                </button>
                <button
                  onClick={() => setShowContractModal(true)}
                  className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  빠른 계약 진행
                </button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  계속 쇼핑
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewService && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
          onClick={() => setQuickViewService(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full p-6 relative animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQuickViewService(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex gap-6">
              {/* Left: Service Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryTheme(quickViewService.category).badge}`}>
                    {categories.find(c => c.id === quickViewService.category)?.label}
                  </span>
                  {quickViewService.badge && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                      {quickViewService.badge}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{quickViewService.title}</h3>
                <p className="text-gray-600 mb-4">{quickViewService.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">소요기간: {quickViewService.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{quickViewService.benefits.experience}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {quickViewService.reviews}개 리뷰
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">주요 산출물</h4>
                  <ul className="space-y-1">
                    {quickViewService.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Right: Action */}
              <div className="w-48 border-l pl-6">
                <div className="sticky top-0">
                  <div className="mb-4">
                    {quickViewService.price?.type === 'consultation' ? (
                      <p className="text-2xl font-bold text-blue-600">
                        상담 문의
                      </p>
                    ) : quickViewService.price.discounted ? (
                      <>
                        <p className="text-sm text-gray-500 line-through">
                          {quickViewService.price.original}만원
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {quickViewService.price.discounted}만원
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {quickViewService.price.original}만원
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {quickViewService.price.unit}당 가격
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (quickViewService) {
                          setSelectedService(quickViewService);
                          setShowDetailModal(true);
                          setQuickViewService(null);
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={() => {
                        addToCart(quickViewService);
                        setQuickViewService(null);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      장바구니 담기
                    </button>
                    <button
                      onClick={(e) => {
                        toggleFavorite(quickViewService.id, e);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <Heart className={`w-4 h-4 ${
                        favoriteServices.includes(quickViewService.id) 
                          ? 'fill-red-500 text-red-500' 
                          : ''
                      }`} />
                      {favoriteServices.includes(quickViewService.id) ? '찜 해제' : '찜하기'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {showDetailModal && selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setShowDetailModal(false)}
          onAddToCart={() => {
            // BuildupService를 직접 장바구니에 추가
            addToCart(selectedService);
            setShowDetailModal(false);
          }}
        />
      )}

      {/* Contract Flow Modal */}
      <ContractFlowModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        cartItems={cart}
        onComplete={(contractData) => {
          // Create projects from contract items
          contractData.items.forEach((item: any) => {
            createProject({
              title: item.title,
              category: item.category,
              created_from: 'catalog',
              service_id: item.id
            });
          });
          setCart([]);
          setShowContractModal(false);
          setIsCartOpen(false);
          navigate('/startup/buildup/projects');
        }}
      />
    </div>
  );
}