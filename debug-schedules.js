// 스케줄 데이터 디버깅 스크립트
// 브라우저 콘솔에서 실행

console.log('🔍 스케줄 데이터 분석 시작...');

const schedules = window.scheduleContext?.schedules || [];
console.log(`총 스케줄 수: ${schedules.length}`);

// 처음 10개 스케줄의 타입 확인
console.log('\n📋 처음 10개 스케줄의 타입:');
schedules.slice(0, 10).forEach((schedule, index) => {
    console.log(`${index + 1}. ID: ${schedule.id}, Type: "${schedule.type}", Title: "${schedule.title}"`);
});

// 타입별 분류
const typeGroups = {};
schedules.forEach(schedule => {
    const type = schedule.type || 'undefined';
    if (!typeGroups[type]) {
        typeGroups[type] = 0;
    }
    typeGroups[type]++;
});

console.log('\n📊 타입별 스케줄 분류:');
Object.entries(typeGroups).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}개`);
});

// buildup 관련 스케줄 검색
const buildupTypes = schedules.filter(s =>
    s.type === 'buildup_project' ||
    s.type?.includes('buildup') ||
    s.tags?.includes('buildup') ||
    s.title?.includes('buildup') ||
    s.title?.includes('빌드업')
);

console.log(`\n🏗️ Buildup 관련 스케줄: ${buildupTypes.length}개`);
buildupTypes.slice(0, 5).forEach((schedule, index) => {
    console.log(`${index + 1}. ${schedule.title} (${schedule.type})`);
});

// 테스트 미팅 검색
const testMeetings = schedules.filter(s =>
    s.title?.includes('[테스트]') ||
    s.title?.includes('[시나리오]') ||
    s.title?.includes('Sprint 5') ||
    s.title?.includes('Test')
);

console.log(`\n🧪 테스트 미팅: ${testMeetings.length}개`);
testMeetings.forEach((meeting, index) => {
    console.log(`${index + 1}. ${meeting.title} (${meeting.type})`);
});

// 프로젝트 ID 연결 확인
const withProjectId = schedules.filter(s => s.projectId);
console.log(`\n🔗 프로젝트 ID가 있는 스케줄: ${withProjectId.length}개`);

// PRJ-TEST 관련 스케줄
const testProjectMeetings = schedules.filter(s => s.projectId === 'PRJ-TEST');
console.log(`\n🎯 PRJ-TEST 관련 스케줄: ${testProjectMeetings.length}개`);
testProjectMeetings.forEach((meeting, index) => {
    console.log(`${index + 1}. ${meeting.title} (${meeting.type}, ProjectID: ${meeting.projectId})`);
});

console.log('\n✨ 분석 완료!');