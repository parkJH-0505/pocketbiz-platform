// 날짜 필터링 로직 디버깅
const { startOfWeek, addDays } = require('date-fns');

// mockProjects와 동일한 날짜 생성 로직
const today = new Date();
const createDate = (daysOffset) => new Date(today.getTime() + daysOffset * 24 * 60 * 60 * 1000);

const tomorrow = createDate(1);
const dayAfterTomorrow = createDate(2);
const threeDaysLater = createDate(3);
const fiveDaysLater = createDate(5);
const oneWeekLater = createDate(7);

console.log('=== 날짜 디버깅 ===');
console.log('오늘:', today.toLocaleDateString());
console.log('내일:', tomorrow.toLocaleDateString());
console.log('모레:', dayAfterTomorrow.toLocaleDateString());
console.log('3일 후:', threeDaysLater.toLocaleDateString());
console.log('5일 후:', fiveDaysLater.toLocaleDateString());
console.log('7일 후:', oneWeekLater.toLocaleDateString());

// 현재 주 범위 계산 (월요일 시작)
const currentWeek = new Date();
const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
const weekEnd = addDays(weekStart, 7);

console.log('\n=== 주간 범위 ===');
console.log('현재 주:', currentWeek.toLocaleDateString());
console.log('주 시작 (월요일):', weekStart.toLocaleDateString());
console.log('주 끝:', weekEnd.toLocaleDateString());

// 각 날짜가 범위에 포함되는지 확인
const testDates = [
  { name: '내일', date: tomorrow },
  { name: '모레', date: dayAfterTomorrow },
  { name: '3일 후', date: threeDaysLater },
  { name: '5일 후', date: fiveDaysLater },
  { name: '7일 후', date: oneWeekLater }
];

console.log('\n=== 필터링 테스트 ===');
testDates.forEach(({ name, date }) => {
  const isInRange = date >= weekStart && date < weekEnd;
  console.log(`${name} (${date.toLocaleDateString()}): ${isInRange ? '포함' : '제외'}`);
});