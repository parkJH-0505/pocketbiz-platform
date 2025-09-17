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
 * @returns 21일 이상 남은 이벤트 중 첫 번째, 없으면 null
 */
export const getTheOneCandidate = <T extends { event: { applicationEndDate: Date } }>(
  events: T[]
): T | null => {
  console.log('🔍 THE ONE 후보 선별 시작...');

  // 21일 이상 남은 이벤트만 필터링
  const eligibleEvents = events.filter(event => {
    const dday = calculateDday(event.event.applicationEndDate);
    const isEligible = dday >= 21;

    console.log(`📅 ${event.event.id}: D-${dday}일 ${isEligible ? '✅ 적격' : '❌ 부적격'}`);

    return isEligible;
  });

  const candidate = eligibleEvents.length > 0 ? eligibleEvents[0] : null;

  console.log(`🎯 THE ONE 선택 결과:`, candidate ?
    `${candidate.event.id} (D-${calculateDday(candidate.event.applicationEndDate)}일)` :
    '후보 없음'
  );

  return candidate;
};

/**
 * D-Day 표시 색상 결정
 * @param dday - 남은 일수
 * @returns Tailwind CSS 클래스
 */
export const getDdayColorClass = (dday: number): string => {
  if (dday <= 0) return 'text-gray-500 bg-gray-100';
  if (dday <= 7) return 'text-red-700 bg-red-50';
  if (dday <= 14) return 'text-amber-700 bg-amber-50';
  if (dday <= 21) return 'text-orange-700 bg-orange-50';
  return 'text-blue-700 bg-blue-50';
};