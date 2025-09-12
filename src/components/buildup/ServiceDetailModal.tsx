import React, { useState } from 'react';
import {
  X,
  Info,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Star,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Award,
  Target,
  Package
} from 'lucide-react';
import type { BuildupService } from '../../types/buildup.types';

interface ServiceDetailModalProps {
  service: BuildupService;
  onClose: () => void;
  onAddToCart: () => void;
}

export default function ServiceDetailModal({ service, onClose, onAddToCart }: ServiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'process' | 'portfolio' | 'reviews' | 'faq'>('overview');

  const formatPrice = (price: number) => {
    return `${Math.round(price / 10000).toLocaleString()}만원`;
  };

  const tabs = [
    { id: 'overview', label: '개요', icon: Info },
    { id: 'process', label: '프로세스', icon: Clock },
    { id: 'portfolio', label: '포트폴리오', icon: Award },
    { id: 'reviews', label: '리뷰', icon: Star },
    { id: 'faq', label: 'FAQ', icon: HelpCircle }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {service.category}
                </span>
                {service.avg_rating >= 4.7 && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    HOT
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{service.name}</h2>
              <p className="text-gray-600">{service.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">서비스 소개</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    대상 고객
                  </h4>
                  <ul className="space-y-1">
                    {service.target_stage.map(stage => (
                      <li key={stage} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        {stage === 'A1' ? '예비창업' : 
                         stage === 'A2' ? 'Seed' :
                         stage === 'A3' ? 'Series A' :
                         stage === 'A4' ? 'Series B+' : 'Pre-IPO'}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    기대 효과
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">개선 축</span>
                      <span className="font-medium">{service.target_axis.join(', ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">예상 개선도</span>
                      <span className="font-medium text-green-600">+{service.expected_improvement}점</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">완료율</span>
                      <span className="font-medium">{service.completion_rate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  주요 산출물
                </h4>
                <div className="flex flex-wrap gap-2">
                  {service.deliverables.map((deliverable, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                      {deliverable}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{service.portfolio_count}</p>
                  <p className="text-sm text-gray-600">완료 프로젝트</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{service.avg_rating}</p>
                  <p className="text-sm text-gray-600">평균 평점</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{service.review_count}</p>
                  <p className="text-sm text-gray-600">리뷰 수</p>
                </div>
              </div>
            </div>
          )}

          {/* Process Tab */}
          {activeTab === 'process' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">진행 프로세스</h3>
                <p className="text-gray-600 mb-4">총 소요기간: {service.duration_weeks}주</p>
              </div>

              <div className="space-y-4">
                {service.process_steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{step.name}</h4>
                      <p className="text-sm text-gray-600">소요기간: {step.duration}</p>
                      {idx < service.process_steps.length - 1 && (
                        <div className="mt-4 border-l-2 border-gray-200 ml-5 h-4"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">포트폴리오</h3>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">프로젝트 #{i}</h4>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">스타트업 A사</p>
                    <p className="text-sm text-gray-500">2024년 {i}월 완료</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">고객 리뷰</h3>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i <= Math.floor(service.avg_rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{service.avg_rating}</span>
                  <span className="text-gray-500">({service.review_count}개)</span>
                </div>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">김대표</p>
                        <p className="text-sm text-gray-500">스타트업 {i} · 2024.0{i}.15</p>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(j => (
                          <Star key={j} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600">
                      정말 만족스러운 서비스였습니다. 전문적이고 체계적인 진행에 감사드립니다.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">자주 묻는 질문</h3>
              <div className="space-y-4">
                {[
                  { q: '서비스 기간은 연장 가능한가요?', a: '네, 프로젝트 진행 중 협의를 통해 연장 가능합니다.' },
                  { q: '중간에 취소할 수 있나요?', a: '계약 조건에 따라 부분 환불이 가능합니다.' },
                  { q: '추가 수정은 몇 번까지 가능한가요?', a: '기본 3회 수정이 포함되어 있으며, 추가 수정은 별도 협의가 필요합니다.' }
                ].map((faq, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Q. {faq.q}</h4>
                    <p className="text-gray-600">A. {faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">서비스 가격</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(service.price_base)}</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                문의하기
              </button>
              <button
                onClick={onAddToCart}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                장바구니 담기
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}