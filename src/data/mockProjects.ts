/**
 * Mock Projects Data - 7단계 라이프사이클 기반
 * 실제 프로젝트 진행 상황을 반영한 현실적인 데이터
 */

import type { Project, ProjectPhase } from '../types/buildup.types';

// 날짜 헬퍼 함수
const today = new Date();
const createDate = (daysOffset: number) => new Date(today.getTime() + daysOffset * 24 * 60 * 60 * 1000);

// 과거 날짜들 (2주 더 최근으로 조정)
const oneWeekAgo = createDate(7);  // 원래 -7 → +7 (1주 후로 변경)
const twoWeeksAgo = createDate(0); // 원래 -14 → 0 (오늘로 변경)
const oneMonthAgo = createDate(-16); // 원래 -30 → -16 (2주 정도 전으로 변경)

// 미래 날짜들 - D-Day 긴급도 분류용 (모두 2주씩 미룸)
const tomorrow = createDate(15);        // 🔴 긴급 (원래 1일 → 15일)
const dayAfterTomorrow = createDate(16); // 🔴 긴급 (원래 2일 → 16일)
const threeDaysLater = createDate(17);   // 🟡 주의 (원래 3일 → 17일)
const fiveDaysLater = createDate(19);    // 🟡 주의 (원래 5일 → 19일)
const oneWeekLater = createDate(21);     // 🟡 주의 (원래 7일 → 21일)
const tenDaysLater = createDate(24);    // 🔵 여유 (원래 10일 → 24일)
const twoWeeksLater = createDate(28);   // 🔵 여유 (원래 14일 → 28일)
const threeWeeksLater = createDate(35); // 🔵 여유 (원래 21일 → 35일)

// 기본 경영지원팀 PM 정보
export const defaultBusinessSupportPM = {
  id: 'pm-business-support',
  name: '경영지원팀',
  role: 'Business Support Manager',
  email: 'support@pocket.com',
  company: '포켓컴퍼니',
  phone: '02-1234-5678',
  experience_years: 3,
  specialties: ['고객 지원', '프로젝트 초기 상담', '일정 조율'],
  profile_image: '/avatars/business-support.jpg',
  bio: '포켓빌드업 고객지원 및 초기 상담 전담팀입니다. 담당 PM 배정 전까지 프로젝트 시작을 도와드립니다.'
};

export const mockProjects: Project[] = [
  {
    id: 'PRJ-001',
    title: 'IR 덱 전문 컨설팅',
    service_id: 'SVC-DOC-001',
    category: '문서작업',
    status: 'active',
    phase: 'execution' as ProjectPhase,  // 5단계: 실행 - 콘텐츠 제작 중
    created_from: 'catalog',
    contract: {
      id: 'CNT-001',
      value: 5000000,
      signed_date: twoWeeksAgo,
      start_date: twoWeeksAgo,
      end_date: threeWeeksLater
    },
    progress: {
      overall: 65,
      milestones_completed: 2,
      milestones_total: 4,
      deliverables_submitted: 3,
      deliverables_total: 6
    },
    timeline: {
      kickoff_date: twoWeeksAgo,
      phase_updated_at: oneWeekAgo,
      phase_updated_by: 'pm-001',
      start_date: twoWeeksAgo,
      end_date: threeWeeksLater
    },
    workstreams: [
      {
        id: 'WS-001',
        name: '콘텐츠 작성',
        status: 'completed',
        owner: {
          id: 'writer-1',
          name: '이작가',
          role: 'Content Writer',
          email: 'writer@pocket.com',
          company: '포켓컴퍼니'
        },
        tasks: [],
        progress: 100
      },
      {
        id: 'WS-002',
        name: '디자인 작업',
        status: 'in_progress',
        owner: {
          id: 'des-1',
          name: '최디자인',
          role: 'UI/UX Designer',
          email: 'choi@pocket.com',
          company: '포켓컴퍼니'
        },
        tasks: [],
        progress: 70
      }
    ],
    deliverables: [], // 테스트용 - 깔끔한 시작을 위해 임시 비움
    team: {
      pm: {
        id: 'pm-001',
        name: '김수민',
        role: 'Senior Project Manager',
        email: 'kim@pocket.com',
        company: '포켓컴퍼니',
        phone: '010-1234-5678',
        experience_years: 5,
        specialties: ['IR 컨설팅', '문서 작업', '브랜딩'],
        profile_image: '/avatars/pm-kim.jpg',
        bio: 'IR 및 브랜딩 전문 PM. 100+ 성공 프로젝트 경험'
      },
      members: [
        {
          id: 'writer-1',
          name: '이작가',
          role: 'Content Writer',
          email: 'writer@pocket.com',
          company: '포켓컴퍼니'
        },
        {
          id: 'des-1',
          name: '최디자인',
          role: 'UI/UX Designer',
          email: 'choi@pocket.com',
          company: '포켓컴퍼니'
        }
      ],
      client_contact: {
        id: 'client-001',
        name: '정대표',
        role: 'CEO',
        email: 'ceo@startup.com',
        company: '스타트업A'
      }
    },
    risks: [],
    meetings: [
      // 🟢 완료된 과거 미팅들 (execution 단계까지의 이력)
      {
        id: 'MTG-001-PAST-1',
        title: '사전 미팅 - 프로젝트 계약 및 상담',
        type: 'pre_meeting',
        date: new Date(twoWeeksAgo.getTime() + 1 * 24 * 60 * 60 * 1000), // 13일 전
        duration: 60,
        attendees: ['정대표', '경영지원팀'],
        agenda: '1. 프로젝트 요구사항 확인\n2. 계약 조건 협의\n3. 담당 PM 배정',
        location: '줌',
        meeting_link: 'https://zoom.us/j/pre-meeting-001',
        projectId: 'PRJ-001',
        status: 'completed' as const,
        meeting_notes: `[미팅 개요]
• 날짜: 2025년 9월 12일
• 참석자: 김대표(클라이언트), 김수민 PM, 이상무(영업팀)
• 목적: IR 덱 전문 컨설팅 계약 체결 및 프로젝트 범위 확정

[주요 논의 사항]
1. 프로젝트 범위 확정
   - IR 덱 전문 컨설팅 서비스로 최종 확정
   - 총 20페이지 분량의 투자자 대상 프레젠테이션 제작
   - 디자인, 콘텐츠, 스토리텔링 전체 포함

2. 예산 및 일정
   - 계약 금액: 1,500만원 (VAT 별도)
   - 프로젝트 기간: 6주 (9월 12일 ~ 10월 24일)
   - 중간 검토: 3주차, 5주차 예정

3. PM 배정
   - 담당 PM: 김수민 (IR 전문 PM, 경력 7년)
   - 보조 PM: 박지원 (디자인 특화)

[결정 사항]
✅ 계약서 체결 완료
✅ 선금 50% 입금 확인
✅ 다음 주 킥오프 미팅 일정 확정 (9월 19일)

[후속 조치]
• 클라이언트 측: 기존 사업계획서 및 재무자료 전달 (9월 15일까지)
• 포켓 측: 킥오프 미팅 어젠다 사전 공유 (9월 17일까지)`,
        completed_at: new Date(twoWeeksAgo.getTime() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'MTG-001-PAST-2',
        title: '가이드 1차 - 킥오프 미팅',
        type: 'guide_1',
        date: new Date(twoWeeksAgo.getTime() + 2 * 24 * 60 * 60 * 1000), // 12일 전
        duration: 90,
        attendees: ['정대표', '김수민 PM'],
        agenda: '1. 프로젝트 목표 명확화\n2. IR 덱 구성 요소 논의\n3. 콘텐츠 방향성 설정',
        location: '포켓 내방',
        projectId: 'PRJ-001',
        status: 'completed' as const,
        meeting_notes: `[미팅 개요]
• 날짜: 2025년 9월 13일
• 참석자: 김대표, 이전무, 박과장(클라이언트), 김수민 PM, 박지원 PM, 이작가(콘텐츠)
• 목적: 프로젝트 킥오프 및 IR 덱 구성 확정

[주요 논의 사항]
1. IR 덱 구성 확정 (총 12개 섹션)
   ① Executive Summary (1-2p)
   ② Problem & Solution (2p)
   ③ Market Analysis (3p)
   ④ Business Model (2p)
   ⑤ Product/Service (3p)
   ⑥ Go-to-Market Strategy (2p)
   ⑦ Competition Analysis (2p)
   ⑧ Team & Organization (1p)
   ⑨ Financial Projections (2p)
   ⑩ Funding Requirements (1p)
   ⑪ Investment Highlights (1p)
   ⑫ Appendix

2. 디자인 컨셉
   - 모던하고 깔끔한 디자인
   - 회사 CI 컬러 활용 (블루 & 화이트)
   - 인포그래픽 적극 활용

3. 일정 계획
   - 1주차: 콘텐츠 초안 작성
   - 2-3주차: 디자인 작업
   - 4주차: 1차 검토 및 수정
   - 5주차: 2차 검토 및 최종본

[결정 사항]
✅ 12개 섹션 구성 확정
✅ 매주 금요일 정기 미팅
✅ Slack 채널 개설 완료

[액션 아이템]
• 클라이언트: 경쟁사 리스트 및 재무 상세자료 전달 (9/15)
• 이작가: Executive Summary 초안 작성 (9/18)
• 박지원 PM: 디자인 템플릿 3안 제작 (9/18)`,
        completed_at: new Date(twoWeeksAgo.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'MTG-001-PAST-3',
        title: '가이드 2차 - 콘텐츠 기획 미팅',
        type: 'guide_2',
        date: new Date(oneWeekAgo.getTime() + 2 * 24 * 60 * 60 * 1000), // 5일 전
        duration: 120,
        attendees: ['정대표', '김수민 PM', '이작가'],
        agenda: '1. 콘텐츠 세부 기획\n2. 스토리텔링 방향\n3. 작성 일정 수립',
        location: '포켓 내방',
        projectId: 'PRJ-001',
        status: 'completed' as const,
        meeting_notes: `[미팅 개요]
• 날짜: 2025년 9월 20일
• 참석자: 김대표(클라이언트), 김수민 PM, 이작가(콘텐츠), 박지원 PM(디자인)
• 목적: 콘텐츠 초안 검토 및 피드백

[검토 내용]
1. Executive Summary
   - 핵심 메시지 명확화 완료
   - "AI 기반 물류 최적화 플랫폼" 포지셔닝
   - 3년 내 IPO 목표 명시

2. 차별화 포인트 정리
   ① 특허받은 AI 알고리즘 (2건)
   ② 대기업 3사 POC 완료
   ③ 월 거래액 50억 달성
   ④ YoY 300% 성장률

3. 스토리텔링 전략
   - Problem: 물류비 상승 & 비효율
   - Solution: AI 최적화로 30% 비용 절감
   - Traction: 이미 50개 기업이 사용 중

[피드백 반영사항]
✅ 기술 용어를 투자자 친화적으로 수정
✅ 재무 전망 그래프 추가
✅ 팀 소개 페이지 보강

[다음 단계]
• 이작가: 피드백 반영한 2차 초안 (9/22)
• 박지원 PM: 디자인 시안 적용 시작 (9/23)
• 클라이언트: CEO 인터뷰 일정 확정 (9/24)`,
        completed_at: new Date(oneWeekAgo.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'MTG-001-PAST-4',
        title: '가이드 3차 - 디자인 착수 미팅',
        type: 'guide_3',
        date: new Date(oneWeekAgo.getTime() + 1 * 24 * 60 * 60 * 1000), // 6일 전
        duration: 90,
        attendees: ['정대표', '김수민 PM', '최디자인'],
        agenda: '1. 디자인 컨셉 확정\n2. 브랜딩 가이드라인\n3. 제작 일정 조율',
        location: '줌',
        meeting_link: 'https://zoom.us/j/guide3-001',
        projectId: 'PRJ-001',
        status: 'completed' as const,
        meeting_notes: `[미팅 개요]
• 날짜: 2025년 9월 19일
• 참석자: 김대표, 디자인팀장(클라이언트), 김수민 PM, 박지원 PM(디자인)
• 목적: 디자인 시안 검토 및 최종 방향 확정

[디자인 시안 검토]
1. A안 - 미니멀 & 모던
   - 화이트 배경 + 포인트 컬러
   - 깔끔한 타이포그래피
   - 평가: ★★★★☆

2. B안 - 다이나믹 & 컬러풀
   - 그라데이션 활용
   - 애니메이션 효과 강조
   - 평가: ★★★☆☆

3. C안 - 프리미엄 & 신뢰감
   - 다크 톤 배경
   - 골드 포인트 컬러
   - 평가: ★★★★★ (선택)

[최종 디자인 방향]
✅ C안 기반으로 진행
✅ 브랜드 컬러 적용 (Navy & Gold)
✅ 차트/그래프 시각화 강화
✅ 아이콘 세트 통일

[디자인 가이드라인]
• 폰트: Noto Sans KR (본문), Montserrat (숫자)
• 컬러: Primary (#1E3A5F), Secondary (#FFD700)
• 여백: 일관된 그리드 시스템 적용

[작업 일정]
• 9/20-21: 전체 레이아웃 작업
• 9/22-23: 인포그래픽 제작
• 9/24: 1차 완성본 공유`,
        completed_at: new Date(oneWeekAgo.getTime() + 1 * 24 * 60 * 60 * 1000)
      },

      // 🟡 예정된 미팅들 (현재 진행 단계)
      {
        id: 'MTG-001',
        title: 'IR 콘텐츠 검토 미팅',
        type: 'guide_4',  // 검토 단계 미팅
        date: threeDaysLater, // 3일 후 (🟡 주의)
        duration: 60,
        attendees: ['정대표', '김수민 PM', '최디자인'],
        agenda: '1. 실행 단계 진행률 점검\n2. 콘텐츠 작업 결과 검토\n3. 다음 주 디자인 작업 계획',
        location: '줌',
        meeting_link: 'https://zoom.us/j/123456789',
        projectId: 'PRJ-001',
        status: 'scheduled' as const
      },
      {
        id: 'MTG-002',
        title: 'IR 덱 중간 점검',
        type: 'guide_4th',  // 가이드 4차 미팅
        date: oneWeekLater, // 1주일 후 (🟡 주의)
        duration: 45,
        attendees: ['정대표', '김수민 PM', '이작가', '최디자인'],
        agenda: '1. 주간 진행 현황\n2. 클라이언트 피드백 반영\n3. 리스크 및 이슈 논의',
        location: '포켓 내방',
        projectId: 'PRJ-001',
        status: 'scheduled' as const
      }
    ],
    files: [],
    communication: {
      unread_messages: 2,
      last_activity: createDate(-0.08), // 2시간 전
      last_message: {
        from: '김수민 PM',
        content: '디자인 시안 1차 검토 완료했습니다. 피드백 첨부파일 확인해주세요.',
        timestamp: createDate(-0.08)
      },
      total_messages: 47,
      response_time_avg: 3.5 // 평균 응답시간 (시간)
    }
  },
  {
    id: 'PRJ-002',
    title: 'MVP 개발 프로젝트',
    service_id: 'SVC-DEV-001',
    category: '개발',
    status: 'active',
    phase: 'design' as ProjectPhase,  // 4단계: 설계 - 상세 설계 진행 중
    created_from: 'catalog',
    contract: {
      id: 'CNT-002',
      value: 20000000,
      signed_date: oneWeekAgo,
      start_date: oneWeekAgo,
      end_date: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000)
    },
    progress: {
      overall: 30,
      milestones_completed: 1,
      milestones_total: 5,
      deliverables_submitted: 2,
      deliverables_total: 10
    },
    timeline: {
      kickoff_date: oneWeekAgo,
      phase_updated_at: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      phase_updated_by: 'pm-002',
      start_date: oneWeekAgo,
      end_date: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000)
    },
    workstreams: [
      {
        id: 'WS-001',
        name: '백엔드 개발',
        status: 'in_progress',
        owner: {
          id: 'dev-1',
          name: '김백엔드',
          role: 'Backend Developer',
          email: 'backend@pocket.com',
          company: '포켓컴퍼니'
        },
        tasks: [],
        progress: 40
      },
      {
        id: 'WS-002',
        name: '프론트엔드 개발',
        status: 'in_progress',
        owner: {
          id: 'dev-2',
          name: '이프론트',
          role: 'Frontend Developer',
          email: 'frontend@pocket.com',
          company: '포켓컴퍼니'
        },
        tasks: [],
        progress: 25
      }
    ],
    deliverables: [], // 테스트용 - 깔끔한 시작을 위해 임시 비움
    team: {
      pm: {
        id: 'pm-002',
        name: '박준영',
        role: 'Senior Technical PM',
        email: 'park@pocket.com',
        company: '포켓컴퍼니',
        phone: '010-2345-6789',
        experience_years: 7,
        specialties: ['MVP 개발', '앱/웹 개발', '시스템 설계'],
        profile_image: '/avatars/pm-park.jpg',
        bio: '풀스택 개발 출신 테크니컬 PM. 스타트업 MVP 전문'
      },
      members: [
        {
          id: 'dev-1',
          name: '김백엔드',
          role: 'Backend Developer',
          email: 'backend@pocket.com',
          company: '포켓컴퍼니'
        },
        {
          id: 'dev-2',
          name: '이프론트',
          role: 'Frontend Developer',
          email: 'frontend@pocket.com',
          company: '포켓컴퍼니'
        },
        {
          id: 'dev-3',
          name: '최풀스택',
          role: 'Full Stack Developer',
          email: 'fullstack@pocket.com',
          company: '포켓컴퍼니'
        }
      ],
      client_contact: {
        id: 'client-002',
        name: '김창업',
        role: 'CTO',
        email: 'cto@startup-b.com',
        company: '스타트업B'
      }
    },
    risks: [
      {
        id: 'RSK-001',
        title: '외부 API 의존성',
        description: '결제 시스템 API 연동 지연 가능성',
        level: 'medium',
        status: 'monitoring',
        mitigation_plan: '대체 결제 서비스 검토 중',
        owner: {
          id: 'dev-1',
          name: '김백엔드',
          role: 'Backend Developer',
          email: 'backend@pocket.com',
          company: '포켓컴퍼니'
        },
        identified_date: today
      }
    ],
    meetings: [
      // 🟢 완료된 과거 미팅들
      {
        id: 'MTG-002-PAST-1',
        title: '사전 미팅 - 웹사이트 개발 상담',
        type: 'pre_meeting',
        date: new Date(oneWeekAgo.getTime() + 3 * 24 * 60 * 60 * 1000), // 4일 전
        duration: 60,
        attendees: ['김창업', '경영지원팀'],
        agenda: '1. 웹사이트 요구사항 파악\n2. 예산 및 일정 논의\n3. 기술 스택 초기 상담',
        location: '줌',
        meeting_link: 'https://meet.google.com/pre-002',
        projectId: 'PRJ-002',
        status: 'completed' as const,
        meeting_notes: `[미팅 개요]
• 날짜: 2025년 9월 18일
• 참석자: 김창업 CTO(클라이언트), 박준영 PM, 이상무(영업팀)
• 목적: 웹 개발 프로젝트 계약 체결 및 범위 확정

[주요 논의 사항]
1. 프로젝트 범위
   - 풀스택 웹 애플리케이션 개발
   - 사용자 포털 + 관리자 대시보드
   - 모바일 반응형 디자인 필수

2. 기술 스택 확정
   - Frontend: React 18, TypeScript, Tailwind CSS
   - Backend: Node.js, Express, PostgreSQL
   - 배포: AWS EC2, RDS, CloudFront
   - CI/CD: GitHub Actions

3. 주요 기능
   ① 회원가입/로그인 (OAuth 포함)
   ② 상품 검색 및 필터링
   ③ 장바구니 및 결제 시스템
   ④ 주문 관리 시스템
   ⑤ 실시간 채팅 상담
   ⑥ 관리자 통계 대시보드

[계약 조건]
• 계약 금액: 3,500만원 (VAT 별도)
• 개발 기간: 10주 (9월 18일 ~ 11월 27일)
• 결제: 선금 40%, 중도금 30%, 잔금 30%

[담당 팀 배정]
• PM: 박준영 (풀스택 전문, 경력 5년)
• 백엔드: 김백엔드 (Senior Developer)
• 프론트: 이프론트 (React 전문)
• QA: 최품질 (QA Engineer)

[후속 조치]
• 클라이언트: 디자인 가이드 및 API 문서 전달 (9/20)
• 포켓: 킥오프 미팅 일정 조율 (9/25 예정)`,
        completed_at: new Date(oneWeekAgo.getTime() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'MTG-003',
        title: '가이드 1차 - 킥오프 미팅',
        type: 'guide_1',  // 올바른 타입으로 수정
        date: new Date(oneWeekAgo.getTime() + 1 * 24 * 60 * 60 * 1000), // 6일 전
        duration: 90,
        attendees: ['김창업', '박준영 PM'],
        agenda: '1. 프로젝트 목표 정의\n2. 기술 스택 초기 논의\n3. 일정 수립',
        location: '줌',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        projectId: 'PRJ-002',
        status: 'completed' as const,
        meeting_notes: `[미팅 개요]
• 날짜: 2025년 9월 25일
• 참석자: 김창업 CTO, 박개발 과장(클라이언트), 박준영 PM, 김백엔드, 이프론트
• 목적: 킥오프 및 상세 요구사항 명세

[요구사항 명세]
1. 사용자 포털 (B2C)
   • 회원 시스템
     - 소셜 로그인 (Google, Naver, Kakao)
     - 프로필 관리
     - 포인트/적립금 시스템
   • 상품 시스템
     - 카테고리별 상품 목록
     - 상품 상세 페이지
     - 리뷰 & 평점 시스템
     - 위시리스트
   • 결제 시스템
     - 토스페이먼츠 연동
     - 쿠폰/할인 적용
     - 주문 이력 관리

2. 관리자 패널 (B2B)
   • 대시보드
     - 실시간 매출 현황
     - 트래픽 분석
     - 사용자 통계
   • 상품 관리
     - CRUD 기능
     - 재고 관리
     - 가격 정책 설정
   • 주문/배송 관리
     - 주문 처리 시스템
     - 배송 트래킹
     - 반품/교환 처리

3. 성능 요구사항
   - 동시 접속 1,000명 이상
   - 페이지 로딩 3초 이내
   - 99.9% 가동률

[개발 일정]
• 1-2주: 환경 설정 및 DB 설계
• 3-4주: 백엔드 API 개발
• 5-6주: 프론트엔드 UI 개발
• 7-8주: 통합 테스트
• 9-10주: 배포 및 안정화

[결정 사항]
✅ MVP 버전 먼저 개발 (6주)
✅ 매주 화요일 주간 회의
✅ 2주마다 데모 시연`,
        completed_at: new Date(oneWeekAgo.getTime() + 1 * 24 * 60 * 60 * 1000)
      },

      // 🟡 예정된 미팅들
      {
        id: 'MTG-004',
        title: '가이드 2차 - 설계 검토',
        type: 'guide_2',  // 올바른 타입으로 수정
        date: dayAfterTomorrow, // 2일 후
        duration: 90,
        attendees: ['김창업', '박준영 PM', '김백엔드', '이프론트'],
        agenda: '1. 상세 설계 검토\n2. API 명세 확정\n3. DB 스키마 최종 확인',
        location: '포켓 내방',
        projectId: 'PRJ-002',
        status: 'scheduled' as const
      },
      {
        id: 'MTG-005',
        title: '가이드 3차 - 개발 진행 점검',
        type: 'guide_3',  // 올바른 타입으로 수정
        date: tenDaysLater, // 10일 후
        duration: 90,
        attendees: ['김창업', '박준영 PM', '김백엔드', '이프론트', '최풀스택'],
        agenda: '1. 개발 진행 상황\n2. 코드 리뷰\n3. 테스트 계획',
        location: '포켓 내방',
        projectId: 'PRJ-002',
        status: 'scheduled' as const
      }
    ],
    files: [],
    communication: {
      unread_messages: 1,
      last_activity: createDate(-0.17), // 4시간 전
      last_message: {
        from: '김창업 CTO',
        content: '내일 PM 미팅에서 API 명세서 리뷰 예정입니다. 준비 부탁드려요.',
        timestamp: createDate(-0.17)
      },
      total_messages: 23,
      response_time_avg: 2.1 // 평균 응답시간 (시간)
    }
  },
  {
    id: 'PRJ-003',
    title: '브랜드 아이덴티티 디자인',
    service_id: 'SVC-DES-001',
    category: '디자인',
    status: 'completed',
    phase: 'completed' as ProjectPhase,  // 7단계: 완료
    created_from: 'catalog',
    contract: {
      id: 'CNT-003',
      value: 7000000,
      signed_date: oneMonthAgo,
      start_date: oneMonthAgo,
      end_date: oneWeekAgo
    },
    progress: {
      overall: 100,
      milestones_completed: 4,
      milestones_total: 4,
      deliverables_submitted: 8,
      deliverables_total: 8
    },
    timeline: {
      kickoff_date: oneMonthAgo,
      phase_updated_at: oneWeekAgo,
      phase_updated_by: 'pm-003',
      start_date: oneMonthAgo,
      end_date: oneWeekAgo,
      completion_date: oneWeekAgo
    },
    workstreams: [],
    deliverables: [], // 테스트용 - 깔끔한 시작을 위해 임시 비움
    team: {
      pm: {
        id: 'pm-003',
        name: '이소영',
        role: 'Design Lead',
        email: 'lee@pocket.com',
        company: '포켓컴퍼니'
      },
      members: [],
      client_contact: {
        id: 'client-003',
        name: '최마케팅',
        role: 'CMO',
        email: 'cmo@startup-c.com',
        company: '스타트업C'
      }
    },
    risks: [],
    meetings: [],
    files: [],
    communication: {
      unread_messages: 0,
      last_activity: oneWeekAgo
    }
  }
];

// 진행중인 프로젝트만 필터
export const activeProjects = mockProjects.filter(p => p.status === 'active');

// 완료된 프로젝트만 필터
export const completedProjects = mockProjects.filter(p => p.status === 'completed');