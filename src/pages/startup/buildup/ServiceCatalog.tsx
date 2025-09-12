import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  TrendingUp,
  Clock,
  Users,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
  Info,
  Sparkles,
  Zap,
  Award,
  Tag,
  Package,
  ArrowRight,
  FileText,
  Code,
  Palette,
  Megaphone,
  DollarSign,
  Shield,
  Rocket,
  Target,
  BarChart3,
  Heart,
  Eye,
  ShoppingBag,
  Percent,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import { useKPIDiagnosis } from '../../../contexts/KPIDiagnosisContext';
import ContractFlowModal from '../../../components/buildup/ContractFlowModal';
import ServiceDetailModal from '../../../components/buildup/ServiceDetailModal';

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
  improvement: {
    axis: string;
    delta: string;
    confidence: number;
  };
  price: {
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
  const { createProject } = useBuildupContext();
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
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'kpi' | 'similar' | 'trending'>('kpi');

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

  // Mock service data
  const services: ServiceItem[] = [
    {
      id: '1',
      badge: 'HOT',
      title: 'IR 덱 전문 컨설팅',
      provider: '포켓',
      category: 'document',
      subcategory: 'ir',
      description: '투자자의 마음을 사로잡는 완벽한 IR 덱 제작',
      deliverables: ['IR Deck 20P', '피칭 스크립트', '예상 Q&A 50개'],
      improvement: {
        axis: 'PF',
        delta: '+15점',
        confidence: 92
      },
      price: {
        original: 500,
        discounted: 400,
        unit: '프로젝트'
      },
      duration: '3주',
      rating: 4.8,
      reviews: 127,
      recentClient: 'A스타트업',
      tags: ['Series A', 'Pre-A', 'Seed'],
      targetStage: ['초기', '성장'],
      bundleWith: ['2', '3']
    },
    {
      id: '2',
      badge: '추천',
      title: '피칭 트레이닝',
      provider: '포켓',
      category: 'consulting',
      description: '실전 같은 모의 피칭으로 발표 실력 향상',
      deliverables: ['1:1 코칭 5회', '모의 피칭 3회', '피드백 리포트'],
      improvement: {
        axis: 'PT',
        delta: '+10점',
        confidence: 88
      },
      price: {
        original: 200,
        unit: '프로젝트'
      },
      duration: '2주',
      rating: 4.9,
      reviews: 89,
      tags: ['발표', '커뮤니케이션'],
      targetStage: ['초기', '성장'],
      bundleWith: ['1']
    },
    {
      id: '3',
      badge: '신규',
      title: 'MVP 개발 패키지',
      provider: '포켓',
      category: 'development',
      subcategory: 'mvp',
      description: '빠른 시장 검증을 위한 MVP 구축',
      deliverables: ['웹앱 MVP', '관리자 페이지', '기술 문서'],
      improvement: {
        axis: 'EC',
        delta: '+20점',
        confidence: 85
      },
      price: {
        original: 1200,
        discounted: 999,
        unit: '프로젝트'
      },
      duration: '8주',
      rating: 4.7,
      reviews: 56,
      recentClient: 'B테크',
      tags: ['NoCode', 'LowCode', 'FullStack'],
      targetStage: ['예비', '초기'],
      bundleWith: ['4']
    },
    {
      id: '4',
      badge: '할인',
      title: '디지털 마케팅 스타터',
      provider: '포켓',
      category: 'marketing',
      subcategory: 'digital',
      description: '초기 스타트업을 위한 마케팅 전략 수립 및 실행',
      deliverables: ['마케팅 전략서', '3개월 실행 계획', '광고 세팅'],
      improvement: {
        axis: 'GO',
        delta: '+12점',
        confidence: 90
      },
      price: {
        original: 300,
        discounted: 250,
        unit: '월'
      },
      duration: '3개월',
      rating: 4.6,
      reviews: 102,
      tags: ['페이스북', '구글', '인스타그램'],
      targetStage: ['초기', '성장']
    },
    {
      id: '5',
      title: '재무모델링 & 밸류에이션',
      provider: '포켓',
      category: 'document',
      description: '정교한 재무 모델 구축 및 기업가치 평가',
      deliverables: ['재무모델 엑셀', '밸류에이션 리포트', '시나리오 분석'],
      improvement: {
        axis: 'PF',
        delta: '+18점',
        confidence: 94
      },
      price: {
        original: 400,
        unit: '프로젝트'
      },
      duration: '2주',
      rating: 4.9,
      reviews: 73,
      tags: ['DCF', 'Revenue Model', 'Unit Economics'],
      targetStage: ['성장', 'M&A']
    },
    {
      id: '6',
      badge: 'HOT',
      title: '정부지원사업 컨설팅',
      provider: '포켓',
      category: 'consulting',
      description: 'TIPS, 창업지원사업 선정을 위한 전문 컨설팅',
      deliverables: ['사업계획서', '발표자료', '인터뷰 코칭'],
      improvement: {
        axis: 'TO',
        delta: '+25점',
        confidence: 87
      },
      price: {
        original: 600,
        unit: '프로젝트'
      },
      duration: '4주',
      rating: 4.8,
      reviews: 234,
      recentClient: 'C바이오',
      tags: ['TIPS', '창업지원', '정부과제'],
      targetStage: ['예비', '초기']
    }
  ];

  // Get recommended services based on KPI gaps
  const getRecommendedServices = () => {
    if (!axisScores) return services;
    
    // Find lowest scoring axes
    const weakAxes = Object.entries(axisScores)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2)
      .map(([axis]) => axis);
    
    // Recommend services that improve weak axes
    return services.filter(service => 
      weakAxes.includes(service.improvement.axis)
    ).slice(0, 3);
  };

  // Calculate bundle discount
  const calculateBundleDiscount = (items: CartItem[]) => {
    let discount = 0;
    const itemIds = items.map(item => item.id);
    
    // Check for bundle combinations
    items.forEach(item => {
      if (item.bundleWith) {
        const bundleMatch = item.bundleWith.some(bundleId => itemIds.includes(bundleId));
        if (bundleMatch) {
          discount += item.price.original * 0.2; // 20% bundle discount
        }
      }
    });
    
    return discount;
  };

  // Add to cart
  const addToCart = (service: ServiceItem, options?: CartItem['options']) => {
    const existingItem = cart.find(item => item.id === service.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === service.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...service, quantity: 1, options }]);
    }
    
    setIsCartOpen(true);
  };

  // Remove from cart
  const removeFromCart = (serviceId: string) => {
    setCart(cart.filter(item => item.id !== serviceId));
  };

  // Update quantity
  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId);
    } else {
      setCart(cart.map(item => 
        item.id === serviceId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  // Calculate cart total
  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
      const price = item.price.discounted || item.price.original;
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
  const recommendedServices = getRecommendedServices();
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.icon}
                    {category.label}
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
            {/* Smart Recommendations */}
            {recommendedServices.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      KPI 기반 맞춤 추천
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      귀사의 KPI 진단 결과를 바탕으로 추천드립니다
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                    <div key={service.id} className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {service.title}
                        </h4>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          {service.improvement.axis} {service.improvement.delta}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          {service.price.discounted || service.price.original}만원
                        </span>
                        <button
                          onClick={() => addToCart(service)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          담기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Grid */}
            <div className="grid grid-cols-3 gap-4">
              {filteredServices.map(service => (
                <div
                  key={service.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedService(service);
                    setShowDetailModal(true);
                  }}
                >
                  
                  {/* Thumbnail or Icon */}
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-gray-400">
                      {getCategoryIcon(service.category)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    {/* Title & Provider */}
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {service.provider} · {service.category}
                      </p>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                    
                    {/* Deliverables */}
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">주요 산출물</p>
                      <div className="flex flex-wrap gap-1">
                        {service.deliverables.slice(0, 2).map((item, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {item}
                          </span>
                        ))}
                        {service.deliverables.length > 2 && (
                          <span className="text-xs text-gray-500">+{service.deliverables.length - 2}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Improvement Effect */}
                    <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">KPI 개선 효과</p>
                        <p className="text-sm font-semibold text-green-700">
                          {service.improvement.axis}축 {service.improvement.delta}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">성공률</p>
                        <p className="text-sm font-medium text-gray-900">{service.improvement.confidence}%</p>
                      </div>
                    </div>
                    
                    {/* Price & Duration */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          {service.price.discounted || service.price.original}만원
                        </span>
                        <span className="text-xs text-gray-500 ml-1">/{service.price.unit}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">소요기간</p>
                        <p className="text-sm font-medium text-gray-900">{service.duration}</p>
                      </div>
                    </div>
                    
                    {/* Rating & Reviews */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-900">{service.rating}</span>
                        <span className="text-xs text-gray-500">({service.reviews})</span>
                      </div>
                      {service.recentClient && (
                        <span className="text-xs text-gray-500">
                          최근: {service.recentClient}
                        </span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                          setShowDetailModal(true);
                        }}
                        className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Info className="w-4 h-4" />
                        상세보기
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(service);
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        title="장바구니 추가"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
            <div className="flex items-center justify-between">
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
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{item.provider} · {item.duration}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
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
                        {((item.price.discounted || item.price.original) * item.quantity).toLocaleString()}만원
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
                  onClick={() => setShowContractModal(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  계약 진행
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

      {/* Service Detail Modal */}
      {showDetailModal && selectedService && (
        <ServiceDetailModal
          service={{
            service_id: selectedService.id,
            category: selectedService.category as any,
            name: selectedService.title,
            subtitle: selectedService.description,
            description: selectedService.description,
            target_axis: ['product', 'sales'] as any[],
            expected_improvement: selectedService.improvement.delta ? parseInt(selectedService.improvement.delta) : 30,
            target_stage: ['A1', 'A2', 'A3'] as any[],
            duration_weeks: parseInt(selectedService.duration.replace(/[^0-9]/g, '')) || 4,
            price_base: (selectedService.price.discounted || selectedService.price.original) * 10000,
            price_urgent: (selectedService.price.discounted || selectedService.price.original) * 13000,
            price_package: (selectedService.price.discounted || selectedService.price.original) * 8000,
            provider: selectedService.provider as any,
            format: 'online' as any,
            deliverables: selectedService.deliverables,
            process_steps: [
              { name: '킥오프 미팅', duration: '1일', description: '요구사항 분석 및 목표 설정' },
              { name: '기획 및 설계', duration: '3일', description: '서비스 구조 설계 및 와이어프레임 작성' },
              { name: '개발/제작', duration: '10일', description: '실제 서비스 구현 및 개발' },
              { name: '테스트 및 수정', duration: '3일', description: '품질 검증 및 피드백 반영' },
              { name: '최종 납품', duration: '1일', description: '완성된 산출물 전달 및 문서화' }
            ],
            portfolio_count: 42,
            avg_rating: selectedService.rating,
            review_count: selectedService.reviews,
            completion_rate: 95,
            status: 'active' as any
          }}
          onClose={() => setShowDetailModal(false)}
          onAddToCart={() => {
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