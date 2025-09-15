import React, { useState } from 'react';
import {
  ShoppingCart,
  Clock,
  TrendingUp,
  ChevronRight,
  Package,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';
import type { ProjectRecommendation, BundleRecommendation } from '../data/axisProjectMapping';
import { useBuildupContext } from '../contexts/BuildupContext';
import { useNavigate } from 'react-router-dom';

interface ProjectRecommendationCardProps {
  recommendation: ProjectRecommendation;
  eventTitle: string;
  onAddToCart?: () => void;
}

export const ProjectRecommendationCard: React.FC<ProjectRecommendationCardProps> = ({
  recommendation,
  eventTitle,
  onAddToCart
}) => {
  const { addToCart } = useBuildupContext();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const axisLabels = {
    GO: '성장·운영',
    EC: '경제성·자본',
    PT: '제품·기술력',
    PF: '증빙·딜레디',
    TO: '팀·조직 역량'
  };

  const handleAddService = (service: any) => {
    // BuildupService 형태로 변환하여 장바구니에 추가
    const buildupService = {
      service_id: service.service_id,
      name: service.name,
      category: service.category,
      description: service.description,
      price: {
        original: service.price,
        discounted: service.price * 0.9, // 10% 할인
        unit: '프로젝트' as const
      },
      duration: {
        weeks: service.duration_weeks,
        display: `${service.duration_weeks}주`
      },
      provider: {
        name: '포켓',
        type: '포켓' as const
      }
    };

    addToCart(buildupService as any);
    onAddToCart?.();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price / 10000) + '만원';
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-border p-4 hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-warning-main" />
            <span className="text-sm font-medium text-neutral-dark">
              {axisLabels[recommendation.axis]} 보완 필요
            </span>
          </div>
          <p className="text-xs text-neutral-gray">
            현재 점수와 {recommendation.gap}점 차이
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary-main">
            +{recommendation.expectedImprovement}점
          </p>
          <p className="text-xs text-neutral-gray">예상 개선</p>
        </div>
      </div>

      {/* 추천 서비스 리스트 */}
      <div className="space-y-2 mb-3">
        {recommendation.services.slice(0, isExpanded ? undefined : 1).map((service) => (
          <div
            key={service.service_id}
            className="bg-neutral-light rounded-lg p-3 cursor-pointer hover:bg-primary-light hover:bg-opacity-10 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-neutral-dark">
                  {service.name}
                </h4>
                <p className="text-xs text-neutral-gray mt-1">
                  {service.description}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddService(service);
                }}
                className="ml-2 p-1.5 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <ShoppingCart className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-gray" />
                <span className="text-neutral-gray">{service.duration_weeks}주</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success-main" />
                <span className="text-success-main">+{service.improvement_score}점</span>
              </div>
              <div className="ml-auto font-medium text-neutral-dark">
                {formatPrice(service.price)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 더보기/접기 버튼 */}
      {recommendation.services.length > 1 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-center text-xs text-primary-main hover:text-primary-dark py-1"
        >
          {isExpanded ? '접기' : `${recommendation.services.length - 1}개 더 보기`}
        </button>
      )}

      {/* 전체 요약 */}
      <div className="pt-3 border-t border-neutral-border flex items-center justify-between">
        <div className="text-xs text-neutral-gray">
          총 {recommendation.services.length}개 서비스
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-gray">
            {recommendation.totalDuration}주 소요
          </span>
          <span className="text-sm font-bold text-neutral-dark">
            {formatPrice(recommendation.totalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface BundleRecommendationCardProps {
  bundle: BundleRecommendation;
  onAddBundle?: () => void;
}

export const BundleRecommendationCard: React.FC<BundleRecommendationCardProps> = ({
  bundle,
  onAddBundle
}) => {
  const { addToCart } = useBuildupContext();
  const navigate = useNavigate();

  const handleAddBundle = () => {
    // 번들의 모든 서비스를 장바구니에 추가
    bundle.services.forEach(service => {
      const buildupService = {
        service_id: service.service_id,
        name: service.name,
        category: service.category,
        description: service.description,
        price: {
          original: service.price,
          discounted: service.price * (1 - bundle.discountRate / 100),
          unit: '프로젝트' as const
        },
        duration: {
          weeks: service.duration_weeks,
          display: `${service.duration_weeks}주`
        },
        provider: {
          name: '포켓',
          type: '포켓' as const
        }
      };

      addToCart(buildupService as any);
    });

    onAddBundle?.();
    navigate('/startup/cart');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price / 10000) + '만원';
  };

  return (
    <div className="bg-gradient-to-br from-primary-light to-primary-main bg-opacity-10 rounded-lg border-2 border-primary-main p-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-main" />
            <h3 className="font-bold text-neutral-dark">{bundle.name}</h3>
          </div>
          <p className="text-sm text-neutral-gray mt-1">{bundle.description}</p>
        </div>
        <div className="bg-error-main text-white px-2 py-1 rounded-full text-xs font-bold">
          {bundle.discountRate}% 할인
        </div>
      </div>

      {/* 포함 서비스 */}
      <div className="bg-white rounded-lg p-3 mb-3">
        <p className="text-xs font-medium text-neutral-gray mb-2">포함 서비스</p>
        <div className="space-y-1">
          {bundle.services.map((service, index) => (
            <div key={service.service_id} className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-success-main flex-shrink-0" />
              <span className="text-sm text-neutral-dark">{service.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 가격 정보 */}
      <div className="bg-white rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-gray">정가</span>
          <span className="text-sm text-neutral-gray line-through">
            {formatPrice(bundle.originalPrice)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-dark">번들가</span>
          <span className="text-lg font-bold text-primary-main">
            {formatPrice(bundle.bundlePrice)}
          </span>
        </div>
        <div className="text-right mt-1">
          <span className="text-xs text-success-main">
            {formatPrice(bundle.originalPrice - bundle.bundlePrice)} 절약
          </span>
        </div>
      </div>

      {/* CTA 버튼 */}
      <button
        onClick={handleAddBundle}
        className="w-full bg-primary-main text-white rounded-lg py-2.5 font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
      >
        <Package className="w-4 h-4" />
        번들 전체 담기
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

interface UrgentProjectCardProps {
  services: any[];
  daysRemaining: number;
}

export const UrgentProjectCard: React.FC<UrgentProjectCardProps> = ({
  services,
  daysRemaining
}) => {
  const { addToCart } = useBuildupContext();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price / 10000) + '만원';
  };

  return (
    <div className="bg-error-light border-2 border-error-main rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-error-main" />
        <h3 className="font-bold text-neutral-dark">긴급 보완 추천</h3>
        <span className="ml-auto text-sm font-medium text-error-main">
          D-{daysRemaining}
        </span>
      </div>

      <p className="text-sm text-neutral-gray mb-3">
        마감일까지 완료 가능한 서비스입니다
      </p>

      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.service_id}
            className="bg-white rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex-1">
              <h4 className="text-sm font-medium text-neutral-dark">
                {service.name}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-neutral-gray">
                  {service.duration_weeks}주 소요
                </span>
                <span className="text-xs text-success-main">
                  +{service.improvement_score}점
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-neutral-dark">
                {formatPrice(service.price)}
              </p>
              <button
                onClick={() => {
                  const buildupService = {
                    service_id: service.service_id,
                    name: service.name,
                    category: service.category,
                    description: service.description,
                    price: {
                      original: service.price,
                      discounted: service.price * 0.9,
                      unit: '프로젝트' as const
                    },
                    duration: {
                      weeks: service.duration_weeks,
                      display: `${service.duration_weeks}주`
                    },
                    provider: {
                      name: '포켓',
                      type: '포켓' as const
                    }
                  };
                  addToCart(buildupService as any);
                }}
                className="mt-1 text-xs text-primary-main hover:text-primary-dark"
              >
                장바구니 담기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectRecommendationCard;