import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Shield,
  Clock,
  Package
} from 'lucide-react';
import { useBuildupContext } from '../../contexts/BuildupContext';

export default function Checkout() {
  const navigate = useNavigate();
  const {
    cart,
    cartTotal,
    bundleDiscount,
    clearCart,
    createProject
  } = useBuildupContext();

  const [step, setStep] = useState<'info' | 'payment' | 'confirm'>('info');
  const [formData, setFormData] = useState({
    // 구매자 정보
    companyName: '',
    businessNumber: '',
    representative: '',
    email: '',
    phone: '',
    address: '',

    // 결제 정보
    paymentMethod: 'transfer', // transfer, card
    cardNumber: '',
    cardHolder: '',

    // 약관 동의
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPrice = (price: number) => {
    return `${Math.round(price / 10000).toLocaleString()}만원`;
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = bundleDiscount * 10000;
  const total = subtotal - discount;

  const validateInfo = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName) newErrors.companyName = '회사명을 입력해주세요';
    if (!formData.businessNumber) newErrors.businessNumber = '사업자등록번호를 입력해주세요';
    if (!formData.representative) newErrors.representative = '대표자명을 입력해주세요';
    if (!formData.email) newErrors.email = '이메일을 입력해주세요';
    if (!formData.phone) newErrors.phone = '연락처를 입력해주세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'info') {
      if (validateInfo()) {
        setStep('payment');
      }
    } else if (step === 'payment') {
      if (!formData.agreeTerms || !formData.agreePrivacy) {
        alert('필수 약관에 동의해주세요');
        return;
      }
      setStep('confirm');
    }
  };

  const handleComplete = async () => {
    // 프로젝트 생성
    cart.forEach(item => {
      createProject({
        title: item.service.name,
        service_id: item.service.service_id,
        category: item.service.category as any,
        status: 'preparing',
        created_from: 'catalog',
        contract: {
          id: `CNT-${Date.now()}`,
          value: item.subtotal,
          signed_date: new Date(),
          start_date: new Date(),
          end_date: new Date(Date.now() + (item.service.duration?.weeks || 4) * 7 * 24 * 60 * 60 * 1000)
        }
      });
    });

    // 장바구니 비우기
    clearCart();

    // 완료 페이지로 이동
    navigate('/startup/buildup/projects', {
      state: { orderComplete: true }
    });
  };

  if (cart.length === 0) {
    navigate('/startup/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/startup/cart')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            장바구니로 돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">결제하기</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step === 'info' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="font-medium">구매자 정보</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="font-medium">결제 정보</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="font-medium">주문 확인</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'info' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">구매자 정보</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      회사명 *
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
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
                      value={formData.businessNumber}
                      onChange={(e) => setFormData({...formData, businessNumber: e.target.value})}
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
                      value={formData.representative}
                      onChange={(e) => setFormData({...formData, representative: e.target.value})}
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
                      이메일 *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="010-0000-0000"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      주소
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="서울특별시 강남구..."
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">결제 방법</h2>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Building className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">계좌 이체</p>
                        <p className="text-sm text-gray-500">세금계산서 발행</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">신용카드</p>
                        <p className="text-sm text-gray-500">즉시 결제</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">약관 동의</h2>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.agreeTerms}
                        onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">서비스 이용약관 동의 (필수)</p>
                        <p className="text-sm text-gray-500">포켓빌드업 서비스 이용약관에 동의합니다.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.agreePrivacy}
                        onChange={(e) => setFormData({...formData, agreePrivacy: e.target.checked})}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">개인정보 처리방침 동의 (필수)</p>
                        <p className="text-sm text-gray-500">개인정보 수집 및 이용에 동의합니다.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.agreeMarketing}
                        onChange={(e) => setFormData({...formData, agreeMarketing: e.target.checked})}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">마케팅 정보 수신 동의 (선택)</p>
                        <p className="text-sm text-gray-500">프로모션 및 할인 정보를 받아보실 수 있습니다.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">주문 확인</h2>

                <div className="space-y-6">
                  {/* 구매자 정보 요약 */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">구매자 정보</h3>
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">회사명</span>
                        <span>{formData.companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">대표자</span>
                        <span>{formData.representative}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">이메일</span>
                        <span>{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">연락처</span>
                        <span>{formData.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* 주문 상품 요약 */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">주문 상품</h3>
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div key={item.service.service_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Package className="w-8 h-8 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium">{item.service.name}</p>
                            <p className="text-sm text-gray-500">
                              {item.service.duration?.display} · {item.service.provider?.name || '포켓'}
                            </p>
                          </div>
                          <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 결제 정보 요약 */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">결제 정보</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {formData.paymentMethod === 'transfer' ? (
                          <>
                            <Building className="w-5 h-5 text-gray-600" />
                            <span>계좌 이체</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <span>신용카드</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 안내 메시지 */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">주문 완료 후 안내</p>
                        <ul className="space-y-1 text-blue-700">
                          <li>• 24시간 내 담당 PM이 연락드립니다</li>
                          <li>• 킥오프 미팅 일정을 조율합니다</li>
                          <li>• 프로젝트 대시보드 접근 권한이 부여됩니다</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 요약</h2>

              <div className="space-y-3 pb-4 border-b border-gray-200">
                {cart.map(item => (
                  <div key={item.service.service_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.service.name}</span>
                    <span className="font-medium">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 py-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">소계</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">번들 할인</span>
                    <span className="text-green-600">-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between py-4 text-lg font-bold">
                <span>총 결제금액</span>
                <span className="text-blue-600">{formatPrice(total)}</span>
              </div>

              {/* Action Button */}
              {step !== 'confirm' ? (
                <button
                  onClick={handleNext}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  다음 단계로
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  결제 완료
                </button>
              )}

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>안전한 결제 시스템</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}