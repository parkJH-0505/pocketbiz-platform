import React, { useState } from 'react';
import {
  ShoppingCart,
  X,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowRight
} from 'lucide-react';
import { useBuildupContext } from '../../contexts/BuildupContext';

export default function FloatingCart() {
  const {
    cart,
    cartTotal,
    bundleDiscount,
    removeFromCart,
    clearCart
  } = useBuildupContext();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  if (cart.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return `₩${(price / 10000).toLocaleString()}만원`;
  };

  const finalTotal = cartTotal - bundleDiscount;

  return (
    <>
      <div className={`fixed right-6 bottom-6 z-40 transition-all ${isMinimized ? 'w-16' : 'w-80'}`}>
        <div className="bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Header */}
          <div 
            className="p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {!isMinimized && <span className="font-medium">장바구니 ({cart.length})</span>}
              </div>
              <button className="p-1 hover:bg-blue-700 rounded">
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <>
              {/* Cart Items */}
              <div className="max-h-80 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={item.service.service_id} className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                          {item.service.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {item.service.duration_weeks}주 · {item.service.category}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.service.service_id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(item.subtotal)}
                      </span>
                      {item.options.rush_delivery && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          긴급
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bundle Discount */}
              {bundleDiscount > 0 && (
                <div className="p-4 bg-green-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">번들 할인</span>
                    </div>
                    <span className="text-sm font-medium text-green-700">
                      -{formatPrice(bundleDiscount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">소계</span>
                    <span className="text-gray-900">{formatPrice(cartTotal)}</span>
                  </div>
                  {bundleDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">할인</span>
                      <span className="text-green-600">-{formatPrice(bundleDiscount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-900">합계</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowContractModal(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                  >
                    계약 진행하기
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    장바구니 비우기
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contract Modal will be implemented separately */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">계약 진행</h2>
            <p>계약 프로세스는 Phase 2에서 구현됩니다.</p>
            <button
              onClick={() => setShowContractModal(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}