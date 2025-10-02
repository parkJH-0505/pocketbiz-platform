/**
 * @fileoverview 시간 간격 계산 (Time Grid용)
 * @description 프로젝트 기간에 따라 적절한 시간 간격 자동 선택
 * Phase 7: 작업 4 - 시간 그리드 배경
 * @author PocketCompany
 * @since 2025-01-30
 */

/**
 * 시간 간격 타입
 */
export type TimeIntervalType = 'biweekly' | 'monthly';

/**
 * 시간 그리드 간격 정보
 */
export interface TimeInterval {
  date: Date;          // 간격 시점
  y: number;           // Y좌표
  label: string;       // 표시 레이블 (예: "1월", "2월 1일")
  isMonthStart: boolean; // 월 시작 여부
}

/**
 * 프로젝트 기간에 따른 간격 타입 결정
 *
 * - 3개월 이하: 격주 (14일)
 * - 3개월 초과: 월 단위
 *
 * @param projectStart 프로젝트 시작일
 * @param projectEnd 프로젝트 종료일
 * @returns 간격 타입
 */
export const determineIntervalType = (
  projectStart: Date,
  projectEnd: Date
): TimeIntervalType => {
  const durationMs = projectEnd.getTime() - projectStart.getTime();
  const durationDays = durationMs / (1000 * 60 * 60 * 24);

  // 90일(약 3개월) 기준
  return durationDays <= 90 ? 'biweekly' : 'monthly';
};

/**
 * 시간 간격 배열 생성
 *
 * @param projectStart 프로젝트 시작일
 * @param projectEnd 프로젝트 종료일
 * @param totalHeight 타임라인 전체 높이
 * @param calculateY Date를 Y좌표로 변환하는 함수
 * @returns 시간 간격 배열
 */
export const getTimeIntervals = (
  projectStart: Date,
  projectEnd: Date,
  totalHeight: number,
  calculateY: (date: Date, start: Date, end: Date, height: number) => number
): TimeInterval[] => {
  const intervalType = determineIntervalType(projectStart, projectEnd);
  const intervals: TimeInterval[] = [];

  if (intervalType === 'biweekly') {
    // ========================================================================
    // 격주 간격 (14일)
    // ========================================================================
    let currentDate = new Date(projectStart);

    // 시작일부터 2주 단위로 증가
    while (currentDate <= projectEnd) {
      const y = calculateY(currentDate, projectStart, projectEnd, totalHeight);
      const isMonthStart = currentDate.getDate() === 1;

      intervals.push({
        date: new Date(currentDate),
        y,
        label: formatBiweeklyLabel(currentDate),
        isMonthStart
      });

      // 14일 추가
      currentDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
  } else {
    // ========================================================================
    // 월 간격
    // ========================================================================
    const startYear = projectStart.getFullYear();
    const startMonth = projectStart.getMonth();
    const endYear = projectEnd.getFullYear();
    const endMonth = projectEnd.getMonth();

    let currentYear = startYear;
    let currentMonth = startMonth;

    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      const currentDate = new Date(currentYear, currentMonth, 1);

      // 프로젝트 범위 내에 있는지 확인
      if (currentDate >= projectStart && currentDate <= projectEnd) {
        const y = calculateY(currentDate, projectStart, projectEnd, totalHeight);

        intervals.push({
          date: new Date(currentDate),
          y,
          label: formatMonthlyLabel(currentDate),
          isMonthStart: true
        });
      }

      // 다음 월로 이동
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
  }

  return intervals;
};

/**
 * 격주 간격 레이블 포맷
 * @param date 날짜
 * @returns "1월 1일", "1월 15일" 형식
 */
const formatBiweeklyLabel = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
};

/**
 * 월 간격 레이블 포맷
 * @param date 날짜
 * @returns "1월", "2월" 형식 (연도가 바뀌면 "2025년 1월")
 */
const formatMonthlyLabel = (date: Date): string => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // 1월이면 연도 표시
  if (month === 1) {
    return `${year}년 ${month}월`;
  }

  return `${month}월`;
};
