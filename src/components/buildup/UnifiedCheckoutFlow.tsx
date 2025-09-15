import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  X,
  ShoppingCart,
  User,
  Settings,
  FileText,
  Shield,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Download,
  Calendar,
  Clock,
  Zap,
  Package,
  Building,
  Mail,
  Phone,
  AlertCircle,
  Plus,
  Minus,
  Loader2,
  CreditCard,
  Info,
  Edit
} from 'lucide-react';
import type { BuildupService } from '../../types/buildup.types';

interface UnifiedCheckoutFlowProps {
  mode: 'quick' | 'cart';  // Quick View vs Cart
  services: BuildupService[];
  isOpen?: boolean;  // For modal mode
  onClose?: () => void;  // For modal mode
  onComplete: (data: any) => void;
}

interface CheckoutState {
  currentStep: number;
  buyerInfo: {
    companyName: string;
    businessNumber: string;
    representative: string;
    businessType: string;
    address: string;
    contactPerson: string;
    contactRole: string;
    contactPhone: string;
    contactEmail: string;
  };
  serviceOptions: Record<string, {
    scope: 'basic' | 'premium' | 'custom';
    rushDelivery: boolean;
    startDate: string;
    additionalOptions: string[];
  }>;
  quoteData: {
    quoteNumber: string;
    issueDate: string;
    validUntil: string;
    notes: string;
  };
  agreementData: {
    termsAgreed: boolean;
    privacyAgreed: boolean;
    refundAgreed: boolean;
    paymentMethod: 'card' | 'transfer' | 'installment';
    cardInfo?: {
      number: string;
      expiry: string;
      cvv: string;
      name: string;
    };
  };
  contractData: {
    contractNumber: string;
    signedDate: string;
    projectStartDate: string;
    deliveryDate: string;
  };
}

export default function UnifiedCheckoutFlow({
  mode,
  services,
  isOpen = true,
  onClose,
  onComplete
}: UnifiedCheckoutFlowProps) {
  const navigate = useNavigate();
  const quoteRef = useRef<HTMLDivElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);

  // Step configuration based on mode
  const steps = mode === 'quick'
    ? [
        { id: 1, label: '구매자 정보', icon: User },
        { id: 2, label: '서비스 옵션', icon: Settings },
        { id: 3, label: '견적서 생성', icon: FileText },
        { id: 4, label: '약관 & 결제', icon: Shield },
        { id: 5, label: '계약 완료', icon: CheckCircle }
      ]
    : [
        { id: 1, label: '장바구니 확인', icon: ShoppingCart },
        { id: 2, label: '구매자 정보', icon: User },
        { id: 3, label: '서비스 옵션', icon: Settings },
        { id: 4, label: '견적서 생성', icon: FileText },
        { id: 5, label: '약관 & 결제', icon: Shield }
      ];

  const [state, setState] = useState<CheckoutState>({
    currentStep: 1,
    buyerInfo: {
      companyName: '',
      businessNumber: '',
      representative: '',
      businessType: '',
      address: '',
      contactPerson: '',
      contactRole: '',
      contactPhone: '',
      contactEmail: ''
    },
    serviceOptions: services.reduce((acc, service) => ({
      ...acc,
      [service.id]: {
        scope: 'basic',
        rushDelivery: false,
        startDate: new Date().toISOString().split('T')[0],
        additionalOptions: []
      }
    }), {}),
    quoteData: {
      quoteNumber: `Q-${Date.now()}`,
      issueDate: new Date().toLocaleDateString('ko-KR'),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR'),
      notes: ''
    },
    agreementData: {
      termsAgreed: false,
      privacyAgreed: false,
      refundAgreed: false,
      paymentMethod: 'card'
    },
    contractData: {
      contractNumber: `C-${Date.now()}`,
      signedDate: new Date().toLocaleDateString('ko-KR'),
      projectStartDate: '',
      deliveryDate: ''
    }
  });

  // Load saved buyer info from localStorage if exists
  useEffect(() => {
    const savedBuyerInfo = localStorage.getItem('buyerInfo');
    if (savedBuyerInfo) {
      const parsed = JSON.parse(savedBuyerInfo);
      setState(prev => ({
        ...prev,
        buyerInfo: { ...prev.buyerInfo, ...parsed }
      }));
    }
  }, []);

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    services.forEach(service => {
      const options = state.serviceOptions[service.id];
      let price = service.price?.original || 0;

      // Scope multiplier
      if (options.scope === 'premium') price *= 1.5;
      if (options.scope === 'custom') price *= 2;

      // Rush delivery
      if (options.rushDelivery) price *= 1.3;

      subtotal += price;
    });

    // Bundle discount for multiple services
    const bundleDiscount = services.length > 1 ? subtotal * 0.1 : 0;
    const afterDiscount = subtotal - bundleDiscount;
    const tax = afterDiscount * 0.1;
    const total = afterDiscount + tax;

    return { subtotal, bundleDiscount, tax, total };
  };

  const totals = calculateTotals();

  // Generate PDF for quote
  const generateQuotePDF = async () => {
    if (!quoteRef.current) return;

    try {
      const canvas = await html2canvas(quoteRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`견적서_${state.quoteData.quoteNumber}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  // Generate PDF for contract
  const generateContractPDF = async () => {
    if (!contractRef.current) return;

    try {
      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`계약서_${state.contractData.contractNumber}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  // Validate current step
  const validateStep = () => {
    const actualStep = mode === 'cart' ? state.currentStep : state.currentStep;

    switch (actualStep) {
      case 1:
        if (mode === 'cart') return true; // Cart review doesn't need validation
        return !!(state.buyerInfo.companyName && state.buyerInfo.contactEmail);
      case 2:
        if (mode === 'quick') return true; // Options are optional
        return !!(state.buyerInfo.companyName && state.buyerInfo.contactEmail);
      case 3:
        return true; // Options are always valid
      case 4:
        return true; // Quote is auto-generated
      case 5:
        return state.agreementData.termsAgreed && state.agreementData.privacyAgreed;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (state.currentStep === steps.length) {
        // Save buyer info for next time
        localStorage.setItem('buyerInfo', JSON.stringify(state.buyerInfo));
        onComplete(state);
        if (mode === 'quick' && onClose) {
          onClose();
        } else {
          navigate('/startup/buildup/projects');
        }
      } else {
        setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      }
    } else {
      alert('필수 정보를 모두 입력해주세요.');
    }
  };

  const handlePrev = () => {
    setState(prev => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }));
  };

  // Render content based on mode
  const renderContent = () => {
    if (mode === 'quick') {
      return renderQuickModeContent();
    } else {
      return renderCartModeContent();
    }
  };

  const renderQuickModeContent = () => {
    // Modal wrapper for quick mode
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-5xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">빠른 구매</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center ${
                    state.currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      state.currentStep >= step.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {state.currentStep > step.id ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="ml-2 text-sm font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={state.currentStep === 1}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  총 {totals.total.toLocaleString()}만원
                </span>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {state.currentStep === steps.length ? '계약 완료' : '다음'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCartModeContent = () => {
    // Full page for cart mode
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">결제하기</h1>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center ${
                    state.currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      state.currentStep >= step.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {state.currentStep > step.id ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="ml-3 text-sm font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: state.currentStep > step.id ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={state.currentStep === 1}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              이전 단계
            </button>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">총 결제금액</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totals.total.toLocaleString()}만원
                </p>
              </div>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                {state.currentStep === steps.length ? '결제 완료' : '다음 단계'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    // Adjust step number for cart mode
    const actualStep = mode === 'cart' && state.currentStep > 1
      ? state.currentStep - 1
      : state.currentStep;

    // Cart review (cart mode only, step 1)
    if (mode === 'cart' && state.currentStep === 1) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">장바구니 확인</h3>
          {services.map((service, index) => (
            <div key={service.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{service.provider?.name}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {service.duration || '3개월'} · {service.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {(service.price?.original || 0).toLocaleString()}만원
                  </p>
                </div>
              </div>
            </div>
          ))}

          {services.length > 1 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Package className="w-5 h-5" />
                <span className="font-medium">번들 할인 10% 적용됨</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Common steps
    switch (actualStep) {
      case 1: // Buyer Info (2 for cart mode)
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">구매자 정보</h3>

            {/* Company Info */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-gray-600" />
                회사 정보
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    회사명 *
                  </label>
                  <input
                    type="text"
                    value={state.buyerInfo.companyName}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, companyName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(주)포켓컴퍼니"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    사업자등록번호 *
                  </label>
                  <input
                    type="text"
                    value={state.buyerInfo.businessNumber}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, businessNumber: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123-45-67890"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    대표자명 *
                  </label>
                  <input
                    type="text"
                    value={state.buyerInfo.representative}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, representative: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    업종/업태
                  </label>
                  <input
                    type="text"
                    value={state.buyerInfo.businessType}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, businessType: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="IT/소프트웨어 개발"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    사업장 주소 *
                  </label>
                  <input
                    type="text"
                    value={state.buyerInfo.address}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, address: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="서울시 강남구 테헤란로 123"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                담당자 정보
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    담당자명 *
                  </label>
                  <input
                    type="text"
                    value={state.buyerInfo.contactPerson}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, contactPerson: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="김철수"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    직책
                  </label>
                  <input
                    type="text"
                    value={state.buyerInfo.contactRole}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, contactRole: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="팀장"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    연락처 *
                  </label>
                  <input
                    type="tel"
                    value={state.buyerInfo.contactPhone}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, contactPhone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="010-1234-5678"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    이메일 *
                  </label>
                  <input
                    type="email"
                    value={state.buyerInfo.contactEmail}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, contactEmail: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Service Options (3 for cart mode)
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">서비스 옵션 선택</h3>

            {services.map((service, index) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">{service.name}</h4>

                <div className="space-y-4">
                  {/* Scope Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      서비스 범위
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'basic', label: '기본', desc: '핵심 기능', multiplier: '1x' },
                        { id: 'premium', label: '프리미엄', desc: '확장 기능', multiplier: '1.5x' },
                        { id: 'custom', label: '커스텀', desc: '맞춤 개발', multiplier: '2x' }
                      ].map((scope) => (
                        <button
                          key={scope.id}
                          onClick={() => setState(prev => ({
                            ...prev,
                            serviceOptions: {
                              ...prev.serviceOptions,
                              [service.id]: {
                                ...prev.serviceOptions[service.id],
                                scope: scope.id as any
                              }
                            }
                          }))}
                          className={`p-3 border rounded-lg text-left transition-all ${
                            state.serviceOptions[service.id]?.scope === scope.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="font-medium text-sm">{scope.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{scope.desc}</div>
                          <div className="text-xs font-medium text-blue-600 mt-1">
                            {scope.multiplier}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rush Delivery */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">긴급 배송</p>
                        <p className="text-xs text-gray-600">기간 50% 단축 (+30%)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setState(prev => ({
                        ...prev,
                        serviceOptions: {
                          ...prev.serviceOptions,
                          [service.id]: {
                            ...prev.serviceOptions[service.id],
                            rushDelivery: !prev.serviceOptions[service.id]?.rushDelivery
                          }
                        }
                      }))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        state.serviceOptions[service.id]?.rushDelivery
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        state.serviceOptions[service.id]?.rushDelivery
                          ? 'translate-x-6'
                          : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      프로젝트 시작일
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={state.serviceOptions[service.id]?.startDate}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          serviceOptions: {
                            ...prev.serviceOptions,
                            [service.id]: {
                              ...prev.serviceOptions[service.id],
                              startDate: e.target.value
                            }
                          }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 3: // Quote Generation (4 for cart mode)
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">견적서 확인</h3>
              <button
                onClick={generateQuotePDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF 다운로드
              </button>
            </div>

            {/* Quote Document */}
            <div ref={quoteRef} className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">견 적 서</h2>
                <p className="text-sm text-gray-600 mt-2">Quote #{state.quoteData.quoteNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">공급자 정보</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">회사명:</span> (주)포켓컴퍼니</p>
                    <p><span className="text-gray-600">사업자등록번호:</span> 123-45-67890</p>
                    <p><span className="text-gray-600">대표자:</span> 홍길동</p>
                    <p><span className="text-gray-600">주소:</span> 서울시 강남구 테헤란로 123</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">수신처 정보</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">회사명:</span> {state.buyerInfo.companyName || '-'}</p>
                    <p><span className="text-gray-600">담당자:</span> {state.buyerInfo.contactPerson || '-'}</p>
                    <p><span className="text-gray-600">연락처:</span> {state.buyerInfo.contactPhone || '-'}</p>
                    <p><span className="text-gray-600">이메일:</span> {state.buyerInfo.contactEmail || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-3">서비스 내역</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-gray-200">
                      <th className="text-left py-2">항목</th>
                      <th className="text-center py-2">범위</th>
                      <th className="text-center py-2">긴급</th>
                      <th className="text-right py-2">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => {
                      const options = state.serviceOptions[service.id];
                      let price = service.price?.original || 0;
                      if (options.scope === 'premium') price *= 1.5;
                      if (options.scope === 'custom') price *= 2;
                      if (options.rushDelivery) price *= 1.3;

                      return (
                        <tr key={service.id} className="border-b border-gray-200">
                          <td className="py-2">{service.name}</td>
                          <td className="text-center py-2">{options.scope}</td>
                          <td className="text-center py-2">{options.rushDelivery ? 'Y' : 'N'}</td>
                          <td className="text-right py-2">{price.toLocaleString()}만원</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300">
                      <td colSpan={3} className="py-2 text-right font-medium">소계</td>
                      <td className="text-right py-2 font-medium">
                        {totals.subtotal.toLocaleString()}만원
                      </td>
                    </tr>
                    {totals.bundleDiscount > 0 && (
                      <tr>
                        <td colSpan={3} className="py-2 text-right text-green-600">번들 할인</td>
                        <td className="text-right py-2 text-green-600">
                          -{totals.bundleDiscount.toLocaleString()}만원
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="py-2 text-right">부가세</td>
                      <td className="text-right py-2">{totals.tax.toLocaleString()}만원</td>
                    </tr>
                    <tr className="border-t border-gray-200 font-bold">
                      <td colSpan={3} className="py-2 text-right">총액</td>
                      <td className="text-right py-2 text-blue-600">
                        {totals.total.toLocaleString()}만원
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>· 발행일: {state.quoteData.issueDate}</p>
                <p>· 유효기간: {state.quoteData.validUntil}</p>
                <p>· 결제조건: 계약금 30%, 잔금 70%</p>
              </div>
            </div>
          </div>
        );

      case 4: // Terms & Payment (5 for cart mode)
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">약관 동의 및 결제</h3>

            {/* Terms Agreement */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">약관 동의</h4>
              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={state.agreementData.termsAgreed}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      agreementData: {
                        ...prev.agreementData,
                        termsAgreed: e.target.checked
                      }
                    }))}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-sm">서비스 이용약관 동의 (필수)</p>
                    <p className="text-xs text-gray-600 mt-1">
                      포켓빌드업 서비스 이용약관에 동의합니다.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={state.agreementData.privacyAgreed}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      agreementData: {
                        ...prev.agreementData,
                        privacyAgreed: e.target.checked
                      }
                    }))}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-sm">개인정보 처리방침 동의 (필수)</p>
                    <p className="text-xs text-gray-600 mt-1">
                      개인정보 수집 및 이용에 동의합니다.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={state.agreementData.refundAgreed}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      agreementData: {
                        ...prev.agreementData,
                        refundAgreed: e.target.checked
                      }
                    }))}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-sm">환불 정책 동의 (선택)</p>
                    <p className="text-xs text-gray-600 mt-1">
                      작업 시작 전 100% 환불, 진행 중 단계별 환불 정책에 동의합니다.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">결제 방법</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'card', label: '신용카드', icon: CreditCard },
                  { id: 'transfer', label: '계좌이체', icon: Building },
                  { id: 'installment', label: '할부', icon: Calendar }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setState(prev => ({
                      ...prev,
                      agreementData: {
                        ...prev.agreementData,
                        paymentMethod: method.id as any
                      }
                    }))}
                    className={`p-4 border rounded-lg transition-all ${
                      state.agreementData.paymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <method.icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium">{method.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">결제 금액</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">상품 금액</span>
                  <span>{totals.subtotal.toLocaleString()}만원</span>
                </div>
                {totals.bundleDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>번들 할인</span>
                    <span>-{totals.bundleDiscount.toLocaleString()}만원</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">부가세</span>
                  <span>{totals.tax.toLocaleString()}만원</span>
                </div>
                <div className="pt-2 border-t border-gray-300 flex justify-between font-bold">
                  <span>총 결제금액</span>
                  <span className="text-blue-600">{totals.total.toLocaleString()}만원</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 5: // Contract Complete (only for quick mode)
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">계약이 완료되었습니다!</h3>
            <p className="text-gray-600 mb-8">
              프로젝트가 성공적으로 시작되었습니다.
            </p>

            <div className="space-y-3 max-w-md mx-auto">
              <button
                onClick={generateContractPDF}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                계약서 다운로드
              </button>
              <button
                onClick={() => navigate('/startup/buildup/projects')}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                프로젝트 관리 페이지로 이동
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
}