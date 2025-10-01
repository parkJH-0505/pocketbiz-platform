/**
 * @fileoverview 시간-높이 변환 유틸리티
 * @description 타임라인의 시간 간격을 픽셀 높이로 변환하고 날짜 라벨 생성
 */

export interface TimeScale {
  pixelsPerDay: number;
  totalDays: number;
  startDate: Date;
  endDate: Date;
}

export interface DateMilestone {
  date: Date;
  yPosition: number;
  label: string;
  type: 'month' | 'week' | 'day';
  isPhaseStart?: boolean;
}

/**
 * 시간 스케일 계산
 */
export function calculateTimeScale(
  startDate: Date,
  endDate: Date,
  targetHeight?: number
): TimeScale {
  const totalMs = endDate.getTime() - startDate.getTime();
  const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));

  // 기본: 1일 = 100px
  const pixelsPerDay = targetHeight ? targetHeight / totalDays : 100;

  return {
    pixelsPerDay,
    totalDays,
    startDate,
    endDate
  };
}

/**
 * 날짜를 Y 좌표로 변환
 */
export function dateToY(date: Date, timeScale: TimeScale): number {
  const daysPassed = (date.getTime() - timeScale.startDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysPassed * timeScale.pixelsPerDay;
}

/**
 * Y 좌표를 날짜로 변환
 */
export function yToDate(y: number, timeScale: TimeScale): Date {
  const daysPassed = y / timeScale.pixelsPerDay;
  return new Date(timeScale.startDate.getTime() + daysPassed * 1000 * 60 * 60 * 24);
}

/**
 * 날짜 라벨 생성 전략 결정
 */
function getDateLabelStrategy(totalDays: number): 'day' | 'week' | 'month' {
  if (totalDays <= 30) return 'day';      // 1개월 이하: 매일
  if (totalDays <= 90) return 'week';     // 3개월 이하: 매주
  return 'month';                          // 3개월 이상: 매월
}

/**
 * 날짜 마일스톤 생성
 */
export function generateDateMilestones(
  timeScale: TimeScale,
  phaseStartDates?: Date[]
): DateMilestone[] {
  const milestones: DateMilestone[] = [];
  const strategy = getDateLabelStrategy(timeScale.totalDays);

  let currentDate = new Date(timeScale.startDate);
  const endDate = new Date(timeScale.endDate);

  // Phase 시작 날짜 맵
  const phaseStartMap = new Set(
    phaseStartDates?.map(d => d.toISOString().split('T')[0]) || []
  );

  while (currentDate <= endDate) {
    const yPosition = dateToY(currentDate, timeScale);
    const dateKey = currentDate.toISOString().split('T')[0];
    const isPhaseStart = phaseStartMap.has(dateKey);

    let label = '';
    let type: 'month' | 'week' | 'day' = 'day';

    if (strategy === 'day') {
      label = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
      type = 'day';
    } else if (strategy === 'week') {
      label = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
      type = 'week';
    } else {
      label = `${currentDate.getFullYear()}.${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      type = 'month';
    }

    milestones.push({
      date: new Date(currentDate),
      yPosition,
      label,
      type,
      isPhaseStart
    });

    // 다음 날짜로 이동
    if (strategy === 'day') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (strategy === 'week') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return milestones;
}

/**
 * 두 날짜 사이의 일수 계산
 */
export function getDaysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 날짜 포맷 유틸
 */
export function formatDateLabel(date: Date, format: 'short' | 'long' = 'short'): string {
  if (format === 'short') {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
