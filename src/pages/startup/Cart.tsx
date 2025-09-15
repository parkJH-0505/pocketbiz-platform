import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  FileText,
  CheckCircle,
  Info,
  Package,
  Clock,
  Users,
  ChevronRight
} from 'lucide-react';
import { useBuildupContext } from '../../contexts/BuildupContext';

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateCartItem,
    clearCart,
    cartTotal,
    bundleDiscount
  } = useBuildupContext();

  const formatPrice = (price: number) => {
    return `${Math.round(price / 10000).toLocaleString()}만원`;
  };

  const handleCheckout = () => {
    // 체크아웃 페이지로 이동 (추후 구현)
    navigate('/startup/checkout');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = bundleDiscount * 10000; // 만원 단위를 원 단위로
  const total = subtotal - discount;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">장바구니가 비어있습니다</h2>
            <p className="text-gray-600 mb-8">
              포켓빌드업 서비스를 둘러보고 필요한 서비스를 담아보세요
            </p>
            <button
              onClick={() => navigate('/startup/buildup/catalog')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              서비스 둘러보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            이전으로
          </button>
          <h1 className="text-3xl font-bold text-gray-900">장바구니</h1>
          <p className="text-gray-600 mt-2">
            선택한 서비스를 검토하고 프로젝트를 시작하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    서비스 목록 ({cart.length}개)
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    전체 삭제
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.service.service_id} className="p-6">
                    <div className="flex gap-4">
                      {/* Service Icon */}
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-blue-600" />
                      </div>

                      {/* Service Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {item.service.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.service.subtitle}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {item.service.duration?.display || `${item.service.duration?.weeks}주`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {item.service.provider?.name || '포켓'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.service.service_id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Options */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                옵션: {item.options.scope === 'basic' ? '기본' : item.options.scope === 'premium' ? '프리미엄' : '커스텀'}
                              </p>
                              {item.options.rush_delivery && (
                                <p className="text-xs text-orange-600 mt-1">긴급 처리</p>
                              )}
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatPrice(item.subtotal)}
                            </p>
                          </div>
                        </div>

                        {/* Key Deliverables */}
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">주요 산출물</p>
                          <div className="flex flex-wrap gap-1">
                            {item.service.deliverables?.main?.slice(0, 3).map((deliverable, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                              >
                                {deliverable}
                              </span>
                            ))}
                            {(item.service.deliverables?.main?.length || 0) > 3 && (
                              <span className="px-2 py-1 text-gray-500 text-xs">
                                +{(item.service.deliverables?.main?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bundle Recommendation */}
            {cart.length === 1 && (
              <div className="mt-6 bg-blue-50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      함께하면 좋은 서비스
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      이 서비스와 함께 구매하시면 번들 할인을 받으실 수 있습니다.
                    </p>
                    <button
                      onClick={() => navigate('/startup/buildup/catalog')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      추천 서비스 보기 →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 요약</h2>

              <div className="space-y-3 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">소계</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">번들 할인</span>
                    <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between py-4 text-lg font-bold">
                <span>총액</span>
                <span className="text-blue-600">{formatPrice(total)}</span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  결제 진행
                </button>
                <button
                  onClick={() => navigate('/startup/buildup/catalog')}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  계속 쇼핑하기
                </button>
              </div>

              {/* Expected Benefits */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">예상 효과</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">프로젝트 {cart.length}개 동시 진행</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">
                      총 {cart.reduce((sum, item) => sum + (item.service.duration?.weeks || 0), 0)}주 소요
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">전담 PM 배정</span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <CheckCircle className="w-4 h-4" />
                <span>안전한 결제 시스템</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}