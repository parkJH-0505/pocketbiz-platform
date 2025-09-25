/**
 * D-Day 계산 유틸리티 함수
 * @param endDate - 마감일
 * @returns 남은 일수 (음수는 마감 지남)
 */
export const calculateDday = (endDate: Date | string): number => {
  const today = new Date();
  const targetDate = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // 시간을 00:00:00으로 정규화하여 정확한 일수 계산
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetNormalized = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffTime = targetNormalized.getTime() - todayNormalized.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * THE ONE 카드 후보 선별 함수
 * @param events - 이벤트 배열
 * @returns 7일 이상 남은 이벤트 중 최적 후보, 없으면 null
 */
export const getTheOneCandidate = <T extends { event: { applicationEndDate: Date } }>(
  events: T[]
): T | null => {

  // 7일 이상 남은 이벤트만 필터링
  const eligibleEvents = events.filter(event => {
    const dday = calculateDday(event.event.applicationEndDate);
    const isEligible = dday >= 7;


    return isEligible;
  });

  // 준비 시간이 많은 순으로 정렬해서 최적 후보 선택
  const sortedByTime = eligibleEvents.sort((a, b) => {
    const ddayA = calculateDday(a.event.applicationEndDate);
    const ddayB = calculateDday(b.event.applicationEndDate);
    return ddayB - ddayA; // 시간 여유가 많은 것 우선
  });

  const candidate = sortedByTime.length > 0 ? sortedByTime[0] : null;

  return candidate;
};

/**
 * D-Day 표시 색상 결정
 * @param dday - 남은 일수
 * @returns Tailwind CSS 클래스
 */
export const getDdayColorClass = (dday: number): string => {
  if (dday <= 0) return 'text-gray-500 bg-gray-100'; // 마감
  if (dday < 7) return 'text-red-700 bg-red-50';      // 촉박함 (7일 미만)
  if (dday <= 14) return 'text-orange-700 bg-orange-50'; // 서둘러야 함
  if (dday <= 30) return 'text-blue-700 bg-blue-50';     // 준비 가능
  return 'text-emerald-700 bg-emerald-50';               // 충분한 시간
};

/**
 * 준비 상태 메시지 반환
 * @param dday - 남은 일수
 * @returns 준비 상태 메시지
 */
export const getPreparationMessage = (dday: number): string => {
  if (dday <= 0) return "마감되었습니다";
  if (dday < 7) return "시간이 촉박하니 기존 자료로 지원해야 합니다";
  if (dday <= 14) return "집중 준비로 경쟁력을 높여보세요";
  if (dday <= 30) return "빌드업으로 핵심 역량을 강화하여 지원하세요";
  return "충분한 준비 시간으로 완벽하게 대비할 수 있습니다";
};

/**
 * THE ONE 카드 타입 결정
 * @param dday - 남은 일수
 * @returns THE ONE 타입과 메시지
 */
export const getTheOneType = (dday: number): {
  type: 'excellent' | 'good' | 'urgent' | 'expired';
  label: string;
  icon: string;
} => {
  if (dday <= 0) return { type: 'expired', label: '마감', icon: '❌' };
  if (dday < 7) return { type: 'urgent', label: '촉박 지원', icon: '⚠️' };
  if (dday <= 30) return { type: 'good', label: '준비 추천', icon: '🎯' };
  return { type: 'excellent', label: '완벽 준비', icon: '💎' };
};