// 중복된 테스트 스케줄 정리 스크립트
// 브라우저 콘솔에서 실행

(function cleanupDuplicateSchedules() {
  console.log('🧹 스케줄 중복 제거 시작...');

  // localStorage에서 스케줄 데이터 가져오기
  const schedulesData = localStorage.getItem('schedules');
  if (!schedulesData) {
    console.log('❌ 저장된 스케줄이 없습니다.');
    return;
  }

  try {
    const schedules = JSON.parse(schedulesData);
    const originalCount = schedules.length;
    console.log(`📊 원본 스케줄 수: ${originalCount}개`);

    // 테스트 미팅 패턴 정의
    const testPatterns = [
      /^테스트:/,
      /^aaaf$/,
      /^sdfas$/,
      /^ㅇㅇ$/,
      /^xzx$/,
      /^test/i
    ];

    // 유지할 스케줄과 제거할 스케줄 분류
    const keepSchedules = [];
    const removeSchedules = [];
    const seenSchedules = new Map(); // 중복 체크용

    schedules.forEach(schedule => {
      const isTestSchedule = testPatterns.some(pattern =>
        pattern.test(schedule.title || '')
      );

      // 중복 체크를 위한 키 생성 (제목, 날짜, 프로젝트ID 조합)
      const scheduleKey = `${schedule.title}_${schedule.date || schedule.startDateTime}_${schedule.projectId || ''}`;

      if (isTestSchedule) {
        // 테스트 스케줄 중 첫 번째만 유지 (데모용)
        if (!seenSchedules.has(scheduleKey)) {
          seenSchedules.set(scheduleKey, true);
          keepSchedules.push(schedule);
          console.log(`✅ 유지 (테스트 데모): ${schedule.title}`);
        } else {
          removeSchedules.push(schedule);
          console.log(`🗑️ 제거 (중복): ${schedule.title}`);
        }
      } else {
        // 실제 스케줄은 모두 유지
        keepSchedules.push(schedule);
      }
    });

    // 정리된 스케줄 저장
    localStorage.setItem('schedules', JSON.stringify(keepSchedules));

    console.log('📊 정리 결과:');
    console.log(`  - 원본: ${originalCount}개`);
    console.log(`  - 유지: ${keepSchedules.length}개`);
    console.log(`  - 제거: ${removeSchedules.length}개`);

    // 제거된 스케줄 상세
    if (removeSchedules.length > 0) {
      console.log('\n🗑️ 제거된 스케줄:');
      removeSchedules.forEach(s => {
        console.log(`  - ${s.title} (${new Date(s.startDateTime || s.date).toLocaleDateString('ko-KR')})`);
      });
    }

    // 유지된 테스트 스케줄 확인
    const remainingTestSchedules = keepSchedules.filter(s =>
      testPatterns.some(pattern => pattern.test(s.title || ''))
    );

    if (remainingTestSchedules.length > 0) {
      console.log('\n✅ 유지된 테스트 스케줄 (데모용):');
      remainingTestSchedules.forEach(s => {
        console.log(`  - ${s.title} (${new Date(s.startDateTime || s.date).toLocaleDateString('ko-KR')})`);
      });
    }

    console.log('\n✨ 정리 완료! 페이지를 새로고침하세요.');

    // 페이지 새로고침 옵션
    const shouldRefresh = confirm('스케줄 정리가 완료되었습니다. 페이지를 새로고침하시겠습니까?');
    if (shouldRefresh) {
      location.reload();
    }

  } catch (error) {
    console.error('❌ 스케줄 정리 중 오류:', error);
  }
})();