import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ArrowLeft,
  CreditCard,
  Building,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Shield,
  Clock,
  Package,
  Settings,
  Download,
  Calendar,
  Zap,
  Info,
  Edit,
  Plus,
  Minus,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';
import { useBuildupContext } from '../../contexts/BuildupContext';

interface ServiceOption {
  scope: 'basic' | 'premium' | 'custom';
  rushDelivery: boolean;
  startDate: string;
  additionalOptions: string[];
}

interface CheckoutData {
  // Step 1: 구매자 정보
  buyerInfo: {
    companyName: string;
    businessNumber: string;
    representative: string;
    contactPerson: string;
    contactRole: string;
    email: string;
    phone: string;
    address: string;
  };

  // Step 2: 서비스 옵션
  serviceOptions: Record<string, ServiceOption>;

  // Step 3: 견적서 데이터 (자동 생성)
  quoteData: {
    quoteNumber: string;
    issueDate: Date;
    validUntil: Date;
    subtotal: number;
    discount: number;
    rushFee: number;
    total: number;
    notes: string;
  };

  // Step 4: 약관 & 결제
  agreementData: {
    termsAgreed: boolean;
    privacyAgreed: boolean;
    marketingAgreed: boolean;
    paymentMethod: 'transfer' | 'card' | 'installment';
    installmentMonths: number;
  };

  // Step 5: 계약서 데이터 (자동 생성)
  contractData: {
    contractNumber: string;
    signedDate: Date;
    projectStartDate: Date;
    projectEndDate: Date;
  };
}

export default function CheckoutEnhanced() {
  const navigate = useNavigate();
  const quoteRef = useRef<HTMLDivElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);

  const {
    cart,
    clearCart,
    createProject
  } = useBuildupContext();

  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 초기 서비스 옵션 설정
  const initServiceOptions = (): Record<string, ServiceOption> => {
    const options: Record<string, ServiceOption> = {};
    cart.forEach(item => {
      options[item.service.service_id] = {
        scope: 'basic',
        rushDelivery: false,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        additionalOptions: []
      };
    });
    return options;
  };

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    buyerInfo: {
      companyName: '',
      businessNumber: '',
      representative: '',
      contactPerson: '',
      contactRole: '',
      email: '',
      phone: '',
      address: ''
    },
    serviceOptions: initServiceOptions(),
    quoteData: {
      quoteNumber: `Q${Date.now()}`,
      issueDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 0,
      discount: 0,
      rushFee: 0,
      total: 0,
      notes: ''
    },
    agreementData: {
      termsAgreed: false,
      privacyAgreed: false,
      marketingAgreed: false,
      paymentMethod: 'transfer',
      installmentMonths: 1
    },
    contractData: {
      contractNumber: `C${Date.now()}`,
      signedDate: new Date(),
      projectStartDate: new Date(),
      projectEndDate: new Date()
    }
  });

  // 단계별 제목
  const stepTitles = [
    { id: 1, name: '구매자 정보', icon: User },
    { id: 2, name: '옵션 선택', icon: Settings },
    { id: 3, name: '견적서 확인', icon: FileText },
    { id: 4, name: '약관 & 결제', icon: CreditCard },
    { id: 5, name: '계약 완료', icon: CheckCircle }
  ];

  // 가격 포맷
  const formatPrice = (price: number) => {
    return `${Math.round(price / 10000).toLocaleString()}만원`;
  };

  // 서비스 옵션에 따른 가격 계산
  const calculateServicePrice = (serviceId: string) => {
    const item = cart.find(i => i.service.service_id === serviceId);
    if (!item) return 0;

    const basePrice = item.service.price?.original || 0;
    const option = checkoutData.serviceOptions[serviceId];

    let price = basePrice;

    // Scope에 따른 가격 조정
    if (option.scope === 'premium') {
      price = basePrice * 1.5;
    } else if (option.scope === 'custom') {
      price = basePrice * 2;
    }

    // 긴급 처리 추가 요금 (20%)
    if (option.rushDelivery) {
      price = price * 1.2;
    }

    return price;
  };

  // 전체 가격 계산
  const calculateTotalPrice = () => {
    let subtotal = 0;
    let rushFee = 0;

    cart.forEach(item => {
      const serviceId = item.service.service_id;
      const basePrice = item.service.price?.original || 0;
      const calculatedPrice = calculateServicePrice(serviceId);

      subtotal += basePrice;

      // 긴급 처리 요금 별도 계산
      if (checkoutData.serviceOptions[serviceId]?.rushDelivery) {
        rushFee += basePrice * 0.2;
      }
    });

    // 번들 할인 계산 (추후 구현)
    const discount = 0;

    const total = subtotal + rushFee - discount;

    return { subtotal, rushFee, discount, total };
  };

  // Step 1: 구매자 정보 검증
  const validateBuyerInfo = () => {
    const newErrors: Record<string, string> = {};
    const { buyerInfo } = checkoutData;

    if (!buyerInfo.companyName) newErrors.companyName = '회사명을 입력해주세요';
    if (!buyerInfo.businessNumber) newErrors.businessNumber = '사업자등록번호를 입력해주세요';
    if (!buyerInfo.representative) newErrors.representative = '대표자명을 입력해주세요';
    if (!buyerInfo.contactPerson) newErrors.contactPerson = '담당자명을 입력해주세요';
    if (!buyerInfo.email) newErrors.email = '이메일을 입력해주세요';
    if (!buyerInfo.phone) newErrors.phone = '연락처를 입력해주세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 다음 단계로
  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateBuyerInfo()) return;
    } else if (currentStep === 2) {
      // 견적서 데이터 생성
      setIsGenerating(true);
      const { subtotal, rushFee, discount, total } = calculateTotalPrice();

      setCheckoutData(prev => ({
        ...prev,
        quoteData: {
          ...prev.quoteData,
          subtotal,
          rushFee,
          discount,
          total
        }
      }));

      // AI 생성 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsGenerating(false);
    } else if (currentStep === 4) {
      if (!checkoutData.agreementData.termsAgreed || !checkoutData.agreementData.privacyAgreed) {
        alert('필수 약관에 동의해주세요');
        return;
      }

      // 계약서 데이터 생성
      setIsGenerating(true);

      // 프로젝트 시작/종료일 계산
      const startDates = Object.values(checkoutData.serviceOptions).map(opt => new Date(opt.startDate));
      const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));

      const maxDuration = Math.max(...cart.map(item => item.service.duration?.weeks || 4));
      const endDate = new Date(earliestStart.getTime() + maxDuration * 7 * 24 * 60 * 60 * 1000);

      setCheckoutData(prev => ({
        ...prev,
        contractData: {
          ...prev.contractData,
          projectStartDate: earliestStart,
          projectEndDate: endDate
        }
      }));

      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsGenerating(false);
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 이전 단계로
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 완료 처리
  const handleComplete = async () => {
    // 프로젝트 생성
    for (const item of cart) {
      const option = checkoutData.serviceOptions[item.service.service_id];

      await createProject({
        title: item.service.name,
        service_id: item.service.service_id,
        category: item.service.category as any,
        status: 'preparing',
        created_from: 'catalog',
        contract: {
          id: checkoutData.contractData.contractNumber,
          value: calculateServicePrice(item.service.service_id),
          signed_date: checkoutData.contractData.signedDate,
          start_date: new Date(option.startDate),
          end_date: checkoutData.contractData.projectEndDate
        }
      });
    }

    // 장바구니 비우기
    clearCart();

    // 프로젝트 관리 페이지로 이동
    navigate('/startup/buildup/projects', {
      state: { orderComplete: true }
    });
  };

  // 견적서 다운로드
  const downloadQuote = async () => {
    if (!quoteRef.current) return;

    try {
      const canvas = await html2canvas(quoteRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`견적서_${checkoutData.quoteData.quoteNumber}.pdf`);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  // 계약서 다운로드
  const downloadContract = async () => {
    if (!contractRef.current) return;

    try {
      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`계약서_${checkoutData.contractData.contractNumber}.pdf`);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  if (cart.length === 0) {
    navigate('/startup/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/startup/cart')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            장바구니로 돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">포켓빌드업 서비스 구매</h1>
          <p className="text-gray-600 mt-2">
            안전하고 투명한 프로세스로 프로젝트를 시작하세요
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            {stepTitles.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div className={`flex items-center gap-3 ${
                    currentStep === step.id ? 'text-blue-600' :
                    currentStep > step.id ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step.id ? 'bg-blue-600 text-white' :
                      currentStep > step.id ? 'bg-green-600 text-white' : 'bg-gray-200'
                    }`}>
                      {currentStep > step.id ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="font-medium hidden sm:block">{step.name}</span>
                  </div>
                  {index < stepTitles.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Step 1: 구매자 정보 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">구매자 정보</h2>
                    <p className="text-gray-600 text-sm">
                      견적서와 계약서 발행을 위한 정보를 입력해주세요
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        회사명 *
                      </label>
                      <input
                        type="text"
                        value={checkoutData.buyerInfo.companyName}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          buyerInfo: { ...prev.buyerInfo, companyName: e.target.value }
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.companyName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="(주)포켓컴퍼니"
                      />
                      {errors.companyName && (
                        <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        사업자등록번호 *
                      </label>
                      <input
                        type="text"
                        value={checkoutData.buyerInfo.businessNumber}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          buyerInfo: { ...prev.buyerInfo, businessNumber: e.target.value }
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.businessNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="000-00-00000"
                      />
                      {errors.businessNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.businessNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        대표자명 *
                      </label>
                      <input
                        type="text"
                        value={checkoutData.buyerInfo.representative}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          buyerInfo: { ...prev.buyerInfo, representative: e.target.value }
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.representative ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="홍길동"
                      />
                      {errors.representative && (
                        <p className="text-red-500 text-xs mt-1">{errors.representative}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        담당자명 *
                      </label>
                      <input
                        type="text"
                        value={checkoutData.buyerInfo.contactPerson}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          buyerInfo: { ...prev.buyerInfo, contactPerson: e.target.value }
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.contactPerson ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="김담당"
                      />
                      {errors.contactPerson && (
                        <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        담당자 직책
                      </label>
                      <input
                        type="text"
                        value={checkoutData.buyerInfo.contactRole}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          buyerInfo: { ...prev.buyerInfo, contactRole: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="마케팅팀 과장"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이메일 *
                      </label>
                      <input
                        type="email"
                        value={checkoutData.buyerInfo.email}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          buyerInfo: { ...prev.buyerInfo, email: e.target.value }
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="contact@company.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        연락처 *
                      </label>
                      <input
                        type="tel"
                        value={checkoutData.buyerInfo.phone}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          buyerInfo: { ...prev.buyerInfo, phone: e.target.value }
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="010-0000-0000"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        주소
                      </label>
                      <input
                        type="text"
                        value={checkoutData.buyerInfo.address}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          buyerInfo: { ...prev.buyerInfo, address: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="서울특별시 강남구..."
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">입력하신 정보는 안전하게 보호됩니다</p>
                        <p className="text-blue-700">
                          견적서와 계약서 발행, 세금계산서 발급을 위해서만 사용됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: 서비스 옵션 선택 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">서비스 옵션 선택</h2>
                    <p className="text-gray-600 text-sm">
                      각 서비스별로 원하시는 옵션을 선택해주세요
                    </p>
                  </div>

                  {cart.map((item, index) => {
                    const serviceId = item.service.service_id;
                    const option = checkoutData.serviceOptions[serviceId];

                    return (
                      <div key={serviceId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.service.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.service.subtitle}</p>
                          </div>
                          <span className="text-sm font-medium text-blue-600">
                            {formatPrice(calculateServicePrice(serviceId))}
                          </span>
                        </div>

                        <div className="space-y-4">
                          {/* 범위 선택 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              서비스 범위
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {['basic', 'premium', 'custom'].map((scope) => (
                                <button
                                  key={scope}
                                  onClick={() => setCheckoutData(prev => ({
                                    ...prev,
                                    serviceOptions: {
                                      ...prev.serviceOptions,
                                      [serviceId]: { ...option, scope: scope as any }
                                    }
                                  }))}
                                  className={`p-3 rounded-lg border-2 transition-all ${
                                    option.scope === scope
                                      ? 'border-blue-600 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="font-medium text-sm">
                                    {scope === 'basic' ? '기본' :
                                     scope === 'premium' ? '프리미엄' : '커스텀'}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {scope === 'basic' ? '표준 범위' :
                                     scope === 'premium' ? '+50%' : '+100%'}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 긴급 처리 */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Zap className="w-5 h-5 text-orange-500" />
                              <div>
                                <p className="font-medium text-sm">긴급 처리</p>
                                <p className="text-xs text-gray-500">기간 30% 단축 (+20% 추가 요금)</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setCheckoutData(prev => ({
                                ...prev,
                                serviceOptions: {
                                  ...prev.serviceOptions,
                                  [serviceId]: { ...option, rushDelivery: !option.rushDelivery }
                                }
                              }))}
                              className={`w-12 h-6 rounded-full transition-all ${
                                option.rushDelivery ? 'bg-orange-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                option.rushDelivery ? 'translate-x-6' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </div>

                          {/* 시작 희망일 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              프로젝트 시작 희망일
                            </label>
                            <input
                              type="date"
                              value={option.startDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setCheckoutData(prev => ({
                                ...prev,
                                serviceOptions: {
                                  ...prev.serviceOptions,
                                  [serviceId]: { ...option, startDate: e.target.value }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step 3: 견적서 확인 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">견적서 확인</h2>
                      <p className="text-gray-600 text-sm">
                        자동 생성된 견적서를 확인하고 다운로드하세요
                      </p>
                    </div>
                    <button
                      onClick={downloadQuote}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      PDF 다운로드
                    </button>
                  </div>

                  {/* 견적서 미리보기 */}
                  <div ref={quoteRef} className="bg-white border-2 border-gray-200 rounded-lg p-8">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold text-gray-900">견 적 서</h1>
                      <p className="text-sm text-gray-600 mt-2">
                        견적번호: {checkoutData.quoteData.quoteNumber}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">공급자</h3>
                        <div className="text-sm space-y-1">
                          <p>상호: (주)포켓컴퍼니</p>
                          <p>사업자등록번호: 123-45-67890</p>
                          <p>대표: 김대표</p>
                          <p>주소: 서울특별시 강남구</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">수신</h3>
                        <div className="text-sm space-y-1">
                          <p>상호: {checkoutData.buyerInfo.companyName}</p>
                          <p>사업자등록번호: {checkoutData.buyerInfo.businessNumber}</p>
                          <p>대표: {checkoutData.buyerInfo.representative}</p>
                          <p>담당: {checkoutData.buyerInfo.contactPerson} {checkoutData.buyerInfo.contactRole}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-y-2 border-gray-900">
                            <th className="text-left py-2 px-2">서비스명</th>
                            <th className="text-center py-2 px-2">옵션</th>
                            <th className="text-center py-2 px-2">기간</th>
                            <th className="text-right py-2 px-2">금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map(item => {
                            const serviceId = item.service.service_id;
                            const option = checkoutData.serviceOptions[serviceId];

                            return (
                              <tr key={serviceId} className="border-b">
                                <td className="py-2 px-2">{item.service.name}</td>
                                <td className="text-center py-2 px-2">
                                  {option.scope === 'basic' ? '기본' :
                                   option.scope === 'premium' ? '프리미엄' : '커스텀'}
                                  {option.rushDelivery && ' (긴급)'}
                                </td>
                                <td className="text-center py-2 px-2">
                                  {item.service.duration?.display || `${item.service.duration?.weeks}주`}
                                </td>
                                <td className="text-right py-2 px-2">
                                  {formatPrice(calculateServicePrice(serviceId))}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-900">
                            <td colSpan={3} className="text-right py-3 px-2 font-semibold">
                              합계
                            </td>
                            <td className="text-right py-3 px-2 font-bold text-lg">
                              {formatPrice(checkoutData.quoteData.total)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• 발행일: {new Date().toLocaleDateString('ko-KR')}</p>
                      <p>• 유효기간: 발행일로부터 30일</p>
                      <p>• 부가세 별도</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: 약관 동의 & 결제 방법 */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">약관 동의 & 결제 방법</h2>
                    <p className="text-gray-600 text-sm">
                      서비스 이용 약관에 동의하고 결제 방법을 선택해주세요
                    </p>
                  </div>

                  {/* 약관 동의 */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkoutData.agreementData.termsAgreed}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          agreementData: { ...prev.agreementData, termsAgreed: e.target.checked }
                        }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">서비스 이용약관 동의 (필수)</p>
                        <p className="text-sm text-gray-500 mt-1">
                          포켓빌드업 서비스 이용약관에 동의합니다.
                        </p>
                      </div>
                      <button className="text-blue-600 text-sm hover:underline">보기</button>
                    </label>

                    <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkoutData.agreementData.privacyAgreed}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          agreementData: { ...prev.agreementData, privacyAgreed: e.target.checked }
                        }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">개인정보 처리방침 동의 (필수)</p>
                        <p className="text-sm text-gray-500 mt-1">
                          개인정보 수집 및 이용에 동의합니다.
                        </p>
                      </div>
                      <button className="text-blue-600 text-sm hover:underline">보기</button>
                    </label>

                    <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkoutData.agreementData.marketingAgreed}
                        onChange={(e) => setCheckoutData(prev => ({
                          ...prev,
                          agreementData: { ...prev.agreementData, marketingAgreed: e.target.checked }
                        }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">마케팅 정보 수신 동의 (선택)</p>
                        <p className="text-sm text-gray-500 mt-1">
                          프로모션 및 할인 정보를 받아보실 수 있습니다.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 결제 방법 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">결제 방법 선택</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment"
                          value="transfer"
                          checked={checkoutData.agreementData.paymentMethod === 'transfer'}
                          onChange={(e) => setCheckoutData(prev => ({
                            ...prev,
                            agreementData: { ...prev.agreementData, paymentMethod: 'transfer' }
                          }))}
                        />
                        <Building className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-medium">계좌 이체</p>
                          <p className="text-sm text-gray-500">세금계산서 발행 가능</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment"
                          value="card"
                          checked={checkoutData.agreementData.paymentMethod === 'card'}
                          onChange={(e) => setCheckoutData(prev => ({
                            ...prev,
                            agreementData: { ...prev.agreementData, paymentMethod: 'card' }
                          }))}
                        />
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-medium">신용카드</p>
                          <p className="text-sm text-gray-500">즉시 결제 처리</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment"
                          value="installment"
                          checked={checkoutData.agreementData.paymentMethod === 'installment'}
                          onChange={(e) => setCheckoutData(prev => ({
                            ...prev,
                            agreementData: { ...prev.agreementData, paymentMethod: 'installment' }
                          }))}
                        />
                        <Clock className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-medium">분할 결제</p>
                          <p className="text-sm text-gray-500">최대 3개월 분할 가능</p>
                        </div>
                      </label>
                    </div>

                    {checkoutData.agreementData.paymentMethod === 'installment' && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          분할 개월 수
                        </label>
                        <select
                          value={checkoutData.agreementData.installmentMonths}
                          onChange={(e) => setCheckoutData(prev => ({
                            ...prev,
                            agreementData: {
                              ...prev.agreementData,
                              installmentMonths: parseInt(e.target.value)
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="2">2개월</option>
                          <option value="3">3개월</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: 계약 완료 */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">계약이 완료되었습니다!</h2>
                    <p className="text-gray-600">
                      24시간 내에 담당 PM이 연락드릴 예정입니다
                    </p>
                  </div>

                  {/* 계약서 미리보기 */}
                  <div ref={contractRef} className="bg-white border-2 border-gray-200 rounded-lg p-8">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold text-gray-900">서비스 계약서</h1>
                      <p className="text-sm text-gray-600 mt-2">
                        계약번호: {checkoutData.contractData.contractNumber}
                      </p>
                    </div>

                    <div className="space-y-6 text-sm">
                      <div>
                        <h3 className="font-semibold mb-2">제1조 (계약 당사자)</h3>
                        <p>공급자: (주)포켓컴퍼니 (이하 "갑")</p>
                        <p>수요자: {checkoutData.buyerInfo.companyName} (이하 "을")</p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">제2조 (서비스 내용)</h3>
                        <ul className="space-y-1">
                          {cart.map(item => (
                            <li key={item.service.service_id}>
                              • {item.service.name} ({checkoutData.serviceOptions[item.service.service_id].scope === 'basic' ? '기본' :
                                checkoutData.serviceOptions[item.service.service_id].scope === 'premium' ? '프리미엄' : '커스텀'})
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">제3조 (계약 기간)</h3>
                        <p>시작일: {checkoutData.contractData.projectStartDate.toLocaleDateString('ko-KR')}</p>
                        <p>종료일: {checkoutData.contractData.projectEndDate.toLocaleDateString('ko-KR')}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">제4조 (계약 금액)</h3>
                        <p>총 계약금액: {formatPrice(checkoutData.quoteData.total)} (부가세 별도)</p>
                        <p>결제 방법: {
                          checkoutData.agreementData.paymentMethod === 'transfer' ? '계좌이체' :
                          checkoutData.agreementData.paymentMethod === 'card' ? '신용카드' : '분할결제'
                        }</p>
                      </div>

                      <div className="pt-8 mt-8 border-t">
                        <p className="text-center mb-4">
                          위 계약 내용에 동의하며, 성실히 이행할 것을 약속합니다.
                        </p>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="text-center">
                            <p className="mb-2">갑: (주)포켓컴퍼니</p>
                            <p>대표이사: 김대표 (인)</p>
                          </div>
                          <div className="text-center">
                            <p className="mb-2">을: {checkoutData.buyerInfo.companyName}</p>
                            <p>대표이사: {checkoutData.buyerInfo.representative} (인)</p>
                          </div>
                        </div>
                        <p className="text-center mt-4">
                          {new Date().toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={downloadContract}
                      className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="w-5 h-5" />
                      계약서 다운로드
                    </button>
                    <button
                      onClick={handleComplete}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      프로젝트 시작하기
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">주문 요약</h3>

              <div className="space-y-3 pb-4 border-b border-gray-200">
                {cart.map(item => (
                  <div key={item.service.service_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.service.name}</span>
                    <span className="font-medium">
                      {currentStep >= 2
                        ? formatPrice(calculateServicePrice(item.service.service_id))
                        : formatPrice(item.service.price?.original || 0)
                      }
                    </span>
                  </div>
                ))}
              </div>

              {currentStep >= 3 && (
                <div className="space-y-2 py-4 border-b border-gray-200 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">소계</span>
                    <span>{formatPrice(checkoutData.quoteData.subtotal)}</span>
                  </div>
                  {checkoutData.quoteData.rushFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">긴급 처리</span>
                      <span className="text-orange-600">+{formatPrice(checkoutData.quoteData.rushFee)}</span>
                    </div>
                  )}
                  {checkoutData.quoteData.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">할인</span>
                      <span className="text-green-600">-{formatPrice(checkoutData.quoteData.discount)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between py-4 text-lg font-bold">
                <span>총 결제금액</span>
                <span className="text-blue-600">
                  {currentStep >= 3
                    ? formatPrice(checkoutData.quoteData.total)
                    : formatPrice(calculateTotalPrice().total)
                  }
                </span>
              </div>

              {/* Navigation Buttons */}
              <div className="space-y-2">
                {currentStep < 5 ? (
                  <>
                    <button
                      onClick={handleNext}
                      disabled={isGenerating}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          처리중...
                        </>
                      ) : (
                        <>
                          다음 단계
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    {currentStep > 1 && (
                      <button
                        onClick={handlePrev}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        이전 단계
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    <Shield className="w-5 h-5 inline mr-1" />
                    안전하게 처리되었습니다
                  </div>
                )}
              </div>

              {/* Progress Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">현재 단계</span>
                </div>
                <p className="text-sm text-gray-700">
                  {currentStep === 1 && "구매자 정보를 입력해주세요"}
                  {currentStep === 2 && "서비스 옵션을 선택해주세요"}
                  {currentStep === 3 && "견적서를 확인하고 다운로드하세요"}
                  {currentStep === 4 && "약관에 동의하고 결제 방법을 선택하세요"}
                  {currentStep === 5 && "계약이 완료되었습니다!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}