import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  X,
  ShoppingCart,
  FileText,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Edit,
  Download,
  Upload,
  Signature,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  Package,
  AlertCircle,
  Shield,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Check,
  Plus,
  Minus,
  Info,
  Zap,
  SquarePen,
  Loader2,
  Sparkles
} from 'lucide-react';

interface ServiceItem {
  id: string;
  title: string;
  provider: string;
  category: string;
  price: {
    original: number;
    discounted?: number;
    unit: string;
  };
  duration: string;
  quantity: number;
  options?: {
    scope: '기본' | '프리미엄' | '커스텀';
    rushDelivery?: boolean;
    addOns?: string[];
  };
}

// Sample data for testing
const sampleCartItems: ServiceItem[] = [
  {
    id: 'item-1',
    title: 'MVP 개발 프로젝트',
    provider: '포켓컴퍼니',
    category: '개발',
    price: {
      original: 3000,
      discounted: 2700,
      unit: '만원'
    },
    duration: '3개월',
    quantity: 1,
    options: {
      scope: '프리미엄',
      rushDelivery: false,
      addOns: []
    }
  },
  {
    id: 'item-2',
    title: 'IR 덱 컨설팅',
    provider: '포켓컴퍼니',
    category: '문서작업',
    price: {
      original: 800,
      discounted: 720,
      unit: '만원'
    },
    duration: '1개월',
    quantity: 1,
    options: {
      scope: '기본',
      rushDelivery: true,
      addOns: ['시장분석 리포트']
    }
  }
];

interface ContractFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: ServiceItem[];
  onComplete: (contractData: any) => void;
}

export default function ContractFlowModal({ isOpen, onClose, cartItems = sampleCartItems, onComplete }: ContractFlowModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);
  const [contractData, setContractData] = useState({
    items: cartItems.length > 0 ? cartItems : sampleCartItems,
    customizations: {} as Record<string, any>,
    companyInfo: {
      name: '',
      registration: '',
      representative: '',
      address: '',
      phone: '',
      email: ''
    },
    paymentMethod: '' as 'card' | 'transfer' | 'installment' | '',
    installmentMonths: 0,
    agreedToTerms: false,
    signatureData: '',
    invoiceRequired: false,
    additionalRequests: ''
  });

  const steps = [
    { id: 1, label: '장바구니 확인', icon: ShoppingCart },
    { id: 2, label: '옵션 조정', icon: SquarePen },
    { id: 3, label: '견적서 검토', icon: FileText },
    { id: 4, label: '계약서 서명', icon: Signature },
    { id: 5, label: '결제', icon: CreditCard }
  ];

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = contractData.items.reduce((sum, item) => {
      const price = item.price.discounted || item.price.original;
      const rushFee = item.options?.rushDelivery ? price * 0.3 : 0;
      return sum + ((price + rushFee) * item.quantity);
    }, 0);

    // Bundle discount calculation
    let bundleDiscount = 0;
    if (contractData.items.length >= 3) {
      bundleDiscount = subtotal * 0.2; // 20% for 3+ items
    } else if (contractData.items.length >= 2) {
      bundleDiscount = subtotal * 0.1; // 10% for 2 items
    }

    const tax = (subtotal - bundleDiscount) * 0.1;
    const total = subtotal - bundleDiscount + tax;

    return { subtotal, bundleDiscount, tax, total };
  };

  const totals = calculateTotals();

  const updateItemOption = (itemId: string, option: string, value: any) => {
    setContractData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, options: { ...item.options, [option]: value } }
          : item
      )
    }));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) return;
    setContractData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity }
          : item
      )
    }));
  };

  const nextStep = async () => {
    // Show AI loading animation when moving from step 2 to step 3
    if (currentStep === 2) {
      setIsGeneratingQuote(true);
      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsGeneratingQuote(false);
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(contractData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">계약 진행</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Step Indicator - Improved Design */}
          <div className="flex items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center relative">
                    {/* Step Circle/Box */}
                    <div className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      <span className="text-sm font-semibold hidden sm:inline">
                        {step.label}
                      </span>
                      <span className="text-xs font-bold sm:hidden">
                        {step.id}
                      </span>
                    </div>
                    
                    {/* Step Number Badge */}
                    <div className={`
                      absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${isActive 
                        ? 'bg-white text-blue-600' 
                        : isCompleted
                        ? 'bg-white text-green-600'
                        : 'bg-white text-gray-400'
                      }
                    `}>
                      {step.id}
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {!isLast && (
                    <div className="flex-1 mx-2">
                      <div className="relative">
                        <div className="h-1 bg-gray-200 rounded-full" />
                        <div 
                          className={`absolute top-0 left-0 h-1 rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-gradient-to-r from-green-400 to-green-500' : ''
                          }`}
                          style={{ width: isCompleted ? '100%' : '0%' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Cart Review */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">장바구니 확인</h3>
                <span className="text-sm text-gray-500">
                  총 {contractData.items.length}개 서비스
                </span>
              </div>
              
              <div className="space-y-4">
                {contractData.items.map((item, index) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {item.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.provider}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          소요기간: {item.duration}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setContractData(prev => ({
                            ...prev,
                            items: prev.items.filter(i => i.id !== item.id)
                          }));
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        {item.price.discounted ? (
                          <>
                            <span className="text-sm text-gray-500 line-through mr-2">
                              {item.price.original.toLocaleString()}만원
                            </span>
                            <span className="text-lg font-semibold text-red-600">
                              {item.price.discounted.toLocaleString()}만원
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-gray-900">
                            {item.price.original.toLocaleString()}만원
                          </span>
                        )}
                      </div>
                    </div>

                    {item.options && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          옵션: {item.options.scope}
                          {item.options.rushDelivery && ' · 긴급배송(+30%)'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">소계</span>
                    <span className="font-medium">{totals.subtotal.toLocaleString()}만원</span>
                  </div>
                  {totals.bundleDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        번들 할인
                      </span>
                      <span className="text-green-600 font-medium">-{totals.bundleDiscount.toLocaleString()}만원</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">부가세</span>
                    <span className="font-medium">{totals.tax.toLocaleString()}만원</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t-2 border-blue-200">
                    <span className="text-lg font-bold text-gray-900">총 결제금액</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">{totals.total.toLocaleString()}</span>
                      <span className="text-lg font-bold text-blue-600">만원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Option Adjustment */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">옵션 조정</h3>
              
              {contractData.items.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">{item.title}</h4>
                  
                  <div className="space-y-4">
                    {/* Scope Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">서비스 범위</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['기본', '프리미엄', '커스텀'].map(scope => (
                          <button
                            key={scope}
                            onClick={() => updateItemOption(item.id, 'scope', scope)}
                            className={`p-3 border rounded-lg text-sm ${
                              item.options?.scope === scope
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {scope}
                            {scope === '프리미엄' && <span className="block text-xs mt-1">+30%</span>}
                            {scope === '커스텀' && <span className="block text-xs mt-1">별도협의</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rush Delivery */}
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={item.options?.rushDelivery || false}
                        onChange={(e) => updateItemOption(item.id, 'rushDelivery', e.target.checked)}
                        className="text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">긴급 진행</p>
                        <p className="text-xs text-gray-600">일정을 50% 단축합니다</p>
                      </div>
                      <span className="text-sm font-medium text-orange-600">+30%</span>
                    </label>

                    {/* Add-ons */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">추가 옵션</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" className="text-blue-600" />
                          <span>추가 수정 3회 (+10만원)</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" className="text-blue-600" />
                          <span>소스파일 제공 (+20만원)</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" className="text-blue-600" />
                          <span>유지보수 3개월 (+월 30만원)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Additional Requests */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">추가 요청사항</label>
                <textarea
                  value={contractData.additionalRequests}
                  onChange={(e) => setContractData(prev => ({ ...prev, additionalRequests: e.target.value }))}
                  placeholder="특별한 요청사항이 있으시면 작성해주세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 3: Quote Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">견적서 검토</h3>
                <button 
                  onClick={async () => {
                    if (!quoteRef.current) return;
                    
                    try {
                      // Create canvas from the quote element
                      const canvas = await html2canvas(quoteRef.current, {
                        scale: 2,
                        backgroundColor: '#ffffff'
                      });
                      
                      // Create PDF
                      const imgData = canvas.toDataURL('image/png');
                      const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                      });
                      
                      const imgWidth = 210;
                      const pageHeight = 295;
                      const imgHeight = (canvas.height * imgWidth) / canvas.width;
                      let heightLeft = imgHeight;
                      let position = 0;
                      
                      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                      heightLeft -= pageHeight;
                      
                      while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                      }
                      
                      // Save PDF
                      pdf.save(`견적서_${Date.now()}.pdf`);
                    } catch (error) {
                      console.error('PDF 생성 실패:', error);
                      alert('PDF 생성에 실패했습니다.');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  견적서 다운로드
                </button>
              </div>

              {/* Quote Document */}
              <div ref={quoteRef} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">견적서</h2>
                      <p className="text-blue-100">QUOTATION</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-100">견적번호</p>
                      <p className="text-xl font-semibold">#{Date.now().toString().slice(-8)}</p>
                      <p className="text-sm text-blue-100 mt-2">발행일</p>
                      <p className="font-medium">{new Date().toLocaleDateString('ko-KR')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">

                  {/* Company Info */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">공급자 정보</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">주식회사 포켓</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">123-45-67890</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">서울특별시 강남구 테헤란로 123</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">02-1234-5678</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">수요자 정보</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-gray-900">{contractData.companyInfo.name || '(미입력)'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-600">{contractData.companyInfo.registration || '(미입력)'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-600">{contractData.companyInfo.address || '(미입력)'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-600">{contractData.companyInfo.email || '(미입력)'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Items */}
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      서비스 내역
                    </h4>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="pb-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">서비스명</th>
                          <th className="pb-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">수량</th>
                          <th className="pb-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">단가</th>
                          <th className="pb-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contractData.items.map((item, index) => {
                          const price = item.price.discounted || item.price.original;
                          const rushFee = item.options?.rushDelivery ? price * 0.3 : 0;
                          const itemTotal = (price + rushFee) * item.quantity;
                          
                          return (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-4">
                                <div>
                                  <p className="font-medium text-gray-900">{item.title}</p>
                                  <p className="text-xs text-gray-500 mt-1">{item.provider} · {item.category}</p>
                                  {item.options?.rushDelivery && (
                                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                      <Zap className="w-3 h-3" />
                                      긴급진행 (+30%)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 text-center font-medium text-gray-900">{item.quantity}</td>
                              <td className="py-4 text-right text-gray-900">
                                {(price + rushFee).toLocaleString()}만원
                              </td>
                              <td className="py-4 text-right font-bold text-gray-900">
                                {itemTotal.toLocaleString()}만원
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">소계</span>
                        <span className="font-medium">{totals.subtotal.toLocaleString()}만원</span>
                      </div>
                      {totals.bundleDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            번들 할인
                          </span>
                          <span className="text-green-600 font-medium">-{totals.bundleDiscount.toLocaleString()}만원</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">부가세 (10%)</span>
                        <span className="font-medium">{totals.tax.toLocaleString()}만원</span>
                      </div>
                      <div className="pt-3 border-t-2 border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">총 결제금액</span>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{totals.total.toLocaleString()}만원</p>
                            <p className="text-xs text-gray-500 mt-1">VAT 포함</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      거래조건 및 유의사항
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-700">유효기간</p>
                            <p className="text-xs text-gray-600">발행일로부터 7일</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-700">결제조건</p>
                            <p className="text-xs text-gray-600">계약금 30%, 잔금 70%</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-700">취소/환불</p>
                            <p className="text-xs text-gray-600">작업 시작 전 100% 환불</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-700">추가작업</p>
                            <p className="text-xs text-gray-600">별도 견적 협의</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-2">포켓빌드업으로 스타트업의 성장을 함께합니다</p>
                    <p className="text-xs text-gray-500">© 2024 Pocket Company. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contract Signing */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">계약서 서명</h3>

              {/* Company Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">계약자 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">회사명 *</label>
                    <input
                      type="text"
                      value={contractData.companyInfo.name}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        companyInfo: { ...prev.companyInfo, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="주식회사 스타트업"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">사업자등록번호 *</label>
                    <input
                      type="text"
                      value={contractData.companyInfo.registration}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        companyInfo: { ...prev.companyInfo, registration: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="123-45-67890"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">대표자명 *</label>
                    <input
                      type="text"
                      value={contractData.companyInfo.representative}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        companyInfo: { ...prev.companyInfo, representative: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">연락처 *</label>
                    <input
                      type="tel"
                      value={contractData.companyInfo.phone}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        companyInfo: { ...prev.companyInfo, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="02-1234-5678"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">주소 *</label>
                    <input
                      type="text"
                      value={contractData.companyInfo.address}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        companyInfo: { ...prev.companyInfo, address: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="서울특별시 강남구 테헤란로 123, 5층"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">이메일 *</label>
                    <input
                      type="email"
                      value={contractData.companyInfo.email}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        companyInfo: { ...prev.companyInfo, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="contact@startup.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Terms */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">계약 조항</h4>
                <div className="max-h-64 overflow-y-auto text-sm text-gray-600 space-y-3">
                  <p><strong>제1조 (목적)</strong><br/>
                  본 계약은 공급자가 수요자에게 제공하는 서비스의 내용, 범위, 조건 등을 규정함을 목적으로 한다.</p>
                  
                  <p><strong>제2조 (서비스 내용)</strong><br/>
                  공급자는 견적서에 명시된 서비스를 계약 기간 내에 성실히 수행한다.</p>
                  
                  <p><strong>제3조 (대금 지급)</strong><br/>
                  수요자는 계약 체결 시 계약금 30%를 지급하고, 서비스 완료 후 7일 이내 잔금 70%를 지급한다.</p>
                  
                  <p><strong>제4조 (지적재산권)</strong><br/>
                  본 계약에 따라 생성된 모든 결과물의 지적재산권은 대금 완납 시 수요자에게 이전된다.</p>
                  
                  <p><strong>제5조 (기밀유지)</strong><br/>
                  양 당사자는 계약 수행 과정에서 취득한 상대방의 기밀정보를 제3자에게 누설하지 않는다.</p>
                  
                  <p><strong>제6조 (손해배상)</strong><br/>
                  일방의 귀책사유로 인한 계약 불이행 시, 상대방에게 발생한 손해를 배상한다.</p>
                </div>
              </div>

              {/* Electronic Signature */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Signature className="w-5 h-5 text-blue-600" />
                  전자 서명
                </h4>
                <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    아래 공간에 마우스로 서명해주세요
                  </p>
                  <div className="w-64 h-24 mx-auto border border-gray-300 bg-white rounded"></div>
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-700">
                    다시 서명하기
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={contractData.agreedToTerms}
                    onChange={(e) => setContractData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                    className="mt-1 text-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      위 계약 내용을 충분히 검토하였으며, 이에 동의합니다.
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      전자서명은 실제 서명과 동일한 법적 효력을 가집니다.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">결제 정보 입력</h3>
                <p className="text-gray-600">안전한 결제를 위해 정확한 정보를 입력해주세요</p>
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  결제 금액 요약
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-blue-100">총 계약금액</span>
                    <span className="font-bold text-2xl">{totals.total.toLocaleString()}만원</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500">
                    <div className="bg-blue-700 bg-opacity-50 rounded-lg p-3">
                      <p className="text-xs text-blue-200 mb-1">계약금 (30%)</p>
                      <p className="font-bold text-lg">{Math.round(totals.total * 0.3).toLocaleString()}만원</p>
                      <p className="text-xs text-blue-200 mt-1">오늘 결제</p>
                    </div>
                    <div className="bg-blue-700 bg-opacity-50 rounded-lg p-3">
                      <p className="text-xs text-blue-200 mb-1">잔금 (70%)</p>
                      <p className="font-bold text-lg">{Math.round(totals.total * 0.7).toLocaleString()}만원</p>
                      <p className="text-xs text-blue-200 mt-1">완료 후 결제</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">결제 방법 선택</h4>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setContractData(prev => ({ ...prev, paymentMethod: 'card' }))}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      contractData.paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                    }`}
                  >
                    {contractData.paymentMethod === 'card' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <CreditCard className={`w-10 h-10 mx-auto mb-3 ${
                      contractData.paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className="font-semibold text-gray-900">신용/체크카드</p>
                    <p className="text-xs text-gray-500 mt-2">즉시 결제 가능</p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-green-600 font-medium">✓ 빠른 처리</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setContractData(prev => ({ ...prev, paymentMethod: 'transfer' }))}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      contractData.paymentMethod === 'transfer'
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                    }`}
                  >
                    {contractData.paymentMethod === 'transfer' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <Building className={`w-10 h-10 mx-auto mb-3 ${
                      contractData.paymentMethod === 'transfer' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className="font-semibold text-gray-900">계좌이체</p>
                    <p className="text-xs text-gray-500 mt-2">3일 이내 입금</p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-blue-600 font-medium">✓ 세금계산서 발행</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setContractData(prev => ({ ...prev, paymentMethod: 'installment' }))}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      contractData.paymentMethod === 'installment'
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                    }`}
                  >
                    {contractData.paymentMethod === 'installment' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <Calendar className={`w-10 h-10 mx-auto mb-3 ${
                      contractData.paymentMethod === 'installment' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className="font-semibold text-gray-900">할부 결제</p>
                    <p className="text-xs text-gray-500 mt-2">2-12개월 분할</p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-orange-600 font-medium">✓ 부담 경감</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Installment Options */}
              {contractData.paymentMethod === 'installment' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">할부 개월 선택</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {[2, 3, 4, 5, 6, 12].map(months => (
                      <button
                        key={months}
                        onClick={() => setContractData(prev => ({ ...prev, installmentMonths: months }))}
                        className={`p-2 border rounded-lg text-sm ${
                          contractData.installmentMonths === months
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {months}개월
                      </button>
                    ))}
                  </div>
                  {contractData.installmentMonths > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      월 {Math.round(totals.total / contractData.installmentMonths).toLocaleString()}만원 × {contractData.installmentMonths}개월
                    </p>
                  )}
                </div>
              )}

              {/* Invoice Option */}
              <div>
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={contractData.invoiceRequired}
                    onChange={(e) => setContractData(prev => ({ ...prev, invoiceRequired: e.target.checked }))}
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">세금계산서 발행</p>
                    <p className="text-xs text-gray-600">사업자등록번호 기준으로 발행됩니다</p>
                  </div>
                </label>
              </div>

              {/* Security Notice */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">안전한 결제</p>
                  <p className="text-xs text-gray-600 mt-1">
                    모든 결제 정보는 암호화되어 안전하게 처리됩니다. 
                    결제 완료 후 계약서와 영수증이 이메일로 발송됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                currentStep === 1
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {currentStep} / {steps.length} 단계
              </span>
            </div>

            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!contractData.paymentMethod}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                  contractData.paymentMethod
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                결제 완료
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Loading Overlay */}
      {isGeneratingQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin">
                  <div className="absolute inset-2 bg-white rounded-full" />
                </div>
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 견적서 생성중</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                고객님의 선택사항을 기반으로<br/>
                최적화된 견적서를 생성하고 있습니다
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" 
                     style={{ width: '60%', animation: 'slideRight 1.5s ease-in-out infinite' }} />
              </div>
              <style jsx>{`
                @keyframes slideRight {
                  0% { width: 20%; }
                  50% { width: 80%; }
                  100% { width: 20%; }
                }
              `}</style>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}