/**
 * ReportHeader Component
 * 레포트 상단 헤더 (회사명, 날짜, 전체 점수)
 */

import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { ScoreDisplay } from '../shared/ScoreDisplay';
import { StatusBadge } from '../shared/StatusBadge';
import type { ReportHeaderProps } from '../../types/reportV3UI.types';
import { SECTOR_NAMES, STAGE_NAMES } from '@/types/reportV3.types';

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  metadata,
  summary,
  isExportMode = false,
  className = ''
}) => {
  const { generatedAt, cluster, companyName } = metadata;
  const { overallScore, status } = summary;

  // 클러스터 정보를 한국어로 변환
  const sectorName = SECTOR_NAMES[cluster.sector as keyof typeof SECTOR_NAMES] || cluster.sector;
  const stageName = STAGE_NAMES[cluster.stage as keyof typeof STAGE_NAMES] || cluster.stage;
  const clusterDisplayName = `${sectorName} • ${stageName}`;

  // 날짜 포맷팅
  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }).format(new Date());
    }
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(dateObj);
  };

  return (
    <header className={`report-header ${className}`}>
      <div className="report-header-content">
        {/* 왼쪽: 제목 및 메타 정보 */}
        <div className="report-header-info">
          <h1 className="report-heading-1 mb-4">
            {companyName ? `${companyName} KPI 진단 결과` : 'KPI 진단 결과'}
          </h1>

          <div className="report-header-meta">
            {/* 진단 날짜 */}
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="opacity-80" />
              <span className="report-body text-white">
                {formatDate(generatedAt)}
              </span>
            </div>

            {/* 클러스터 정보 */}
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="opacity-80" />
              <span className="report-body text-white">
                {clusterDisplayName}
              </span>
            </div>

            {/* 총 KPI 수 */}
            <div className="flex items-center gap-2">
              <span className="report-caption text-white opacity-80">
                총 {metadata.totalKPIs}개 지표 진단 완료
              </span>
            </div>
          </div>
        </div>

        {/* 오른쪽: 전체 점수 표시 */}
        <div className="report-header-score">
          <div className="flex flex-col items-center gap-3">
            {/* 점수 원형 표시 */}
            <div style={{ '--score-color': 'white' } as React.CSSProperties}>
              <ScoreDisplay
                score={overallScore}
                size="lg"
                variant="circular"
                showLabel={true}
                label="점"
                color="white"
              />
            </div>

            {/* 상태 배지 */}
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
              <StatusBadge
                status={status}
                size="md"
                variant="outline"
                showIcon={true}
                className="!text-white !border-white"
              />
            </div>

            {/* 완료율 표시 */}
            <div className="text-center">
              <div className="report-caption text-white opacity-80">
                완료율
              </div>
              <div className="report-body text-white font-semibold">
                {summary.completionRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 출력 모드에서 페이지 제목 */}
      {isExportMode && (
        <div className="absolute top-4 right-4 text-white opacity-60">
          <span className="report-small">
            KPI Diagnosis Report v3.0
          </span>
        </div>
      )}
    </header>
  );
};