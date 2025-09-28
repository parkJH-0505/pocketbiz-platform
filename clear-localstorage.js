// localStorage 클리어 스크립트
// 브라우저 콘솔에서 실행하세요

console.log('🗑️ Clearing localStorage for all ports...');

// localStorage 완전 초기화
localStorage.clear();
sessionStorage.clear();

console.log('✅ Storage cleared');

// ScheduleContext 강제 리로드 (window 함수가 있는 경우)
if (typeof window.forceReloadMockSchedules === 'function') {
  console.log('🔄 Reloading mock schedules...');
  window.forceReloadMockSchedules();
} else {
  console.log('⚠️ forceReloadMockSchedules not available. Please refresh the page.');
}

console.log('📌 Please refresh the page (Ctrl+F5) to see updated dates');