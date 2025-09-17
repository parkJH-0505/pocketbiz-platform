/**
 * Mock Projects Data - 7단계 라이프사이클 기반
 * 실제 프로젝트 진행 상황을 반영한 현실적인 데이터
 */

import type { Project, ProjectPhase } from '../types/buildup.types';

// 날짜 헬퍼 함수
const today = new Date();
const createDate = (daysOffset: number) => new Date(today.getTime() + daysOffset * 24 * 60 * 60 * 1000);

// 과거 날짜들
const oneWeekAgo = createDate(-7);
const twoWeeksAgo = createDate(-14);
const oneMonthAgo = createDate(-30);

// 미래 날짜들 - D-Day 긴급도 분류용
const tomorrow = createDate(1);        // 🔴 긴급 (1일)
const dayAfterTomorrow = createDate(2); // 🔴 긴급 (2일)
const threeDaysLater = createDate(3);   // 🟡 주의 (3일)
const fiveDaysLater = createDate(5);    // 🟡 주의 (5일)
const oneWeekLater = createDate(7);     // 🟡 주의 (7일)
const tenDaysLater = createDate(10);    // 🔵 여유 (10일)
const twoWeeksLater = createDate(14);   // 🔵 여유 (14일)
const threeWeeksLater = createDate(21); // 🔵 여유 (21일)

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
    deliverables: [
      {
        id: 'DLV-001',
        name: '시장 조사 보고서',
        description: '타겟 시장 분석 및 경쟁사 조사',
        status: 'approved',
        due_date: new Date(twoWeeksAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
        submitted_date: new Date(twoWeeksAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
        approved_date: new Date(twoWeeksAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
        version: 2,
        files: []
      },
      {
        id: 'DLV-002',
        name: '콘텐츠 초안',
        description: 'IR 덱 텍스트 콘텐츠',
        status: 'approved',
        due_date: oneWeekAgo,
        submitted_date: new Date(oneWeekAgo.getTime() - 1 * 24 * 60 * 60 * 1000),
        approved_date: oneWeekAgo,
        version: 3,
        files: []
      },
      {
        id: 'DLV-003',
        name: '디자인 시안 v1',
        description: '초기 디자인 컨셉',
        status: 'pending_review',
        due_date: threeDaysLater,
        submitted_date: today,
        version: 1,
        files: []
      }
    ],
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
      {
        id: 'MTG-001',
        title: 'IR 콘텐츠 검토 미팅',
        type: 'pm_meeting',
        date: threeDaysLater, // 3일 후 (🟡 주의)
        duration: 60,
        attendees: ['정대표', '김수민 PM', '최디자인'],
        agenda: '1. 실행 단계 진행률 점검\n2. 콘텐츠 작업 결과 검토\n3. 다음 주 디자인 작업 계획',
        location: '줌',
        meeting_link: 'https://zoom.us/j/123456789'
      },
      {
        id: 'MTG-002',
        title: 'IR 덱 중간 점검',
        type: 'project_meeting',
        date: oneWeekLater, // 1주일 후 (🟡 주의)
        duration: 45,
        attendees: ['정대표', '김수민 PM', '이작가', '최디자인'],
        agenda: '1. 주간 진행 현황\n2. 클라이언트 피드백 반영\n3. 리스크 및 이슈 논의',
        location: '포켓 내방'
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
    deliverables: [
      {
        id: 'DLV-001',
        name: '기능 명세서',
        description: '상세 기능 정의 문서',
        status: 'approved',
        due_date: new Date(oneWeekAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
        submitted_date: new Date(oneWeekAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
        approved_date: new Date(oneWeekAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
        version: 1,
        files: []
      },
      {
        id: 'DLV-002',
        name: 'DB 설계서',
        description: 'PostgreSQL 스키마 설계',
        status: 'approved',
        due_date: new Date(oneWeekAgo.getTime() + 4 * 24 * 60 * 60 * 1000),
        submitted_date: new Date(oneWeekAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
        approved_date: new Date(oneWeekAgo.getTime() + 4 * 24 * 60 * 60 * 1000),
        version: 1,
        files: []
      }
    ],
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
      {
        id: 'MTG-001',
        title: '기술 스택 확정 미팅',
        type: 'pm_meeting',
        date: dayAfterTomorrow, // 2일 후
        duration: 90,
        attendees: ['김창업', '박준영 PM'],
        agenda: '1. 최종 기술 스택 결정\n2. 인프라 구성 논의\n3. 보안 요구사항 검토',
        location: '줌',
        meeting_link: 'https://meet.google.com/abc-defg-hij'
      },
      {
        id: 'MTG-002',
        title: '개발 스프린트 리뷰',
        type: 'project_meeting',
        date: tenDaysLater, // 10일 후
        duration: 90,
        attendees: ['김창업', '박준영 PM', '김백엔드', '이프론트', '최풀스택'],
        agenda: '1. 스프린트 진행 상황\n2. 코드 리뷰\n3. 다음 스프린트 계획',
        location: '포켓 내방'
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
    deliverables: [
      {
        id: 'DLV-001',
        name: '로고 디자인',
        description: '메인 로고 및 서브 로고',
        status: 'approved',
        due_date: new Date(oneMonthAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        submitted_date: new Date(oneMonthAgo.getTime() + 6 * 24 * 60 * 60 * 1000),
        approved_date: new Date(oneMonthAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        version: 3,
        files: []
      },
      {
        id: 'DLV-002',
        name: '브랜드 가이드라인',
        description: '브랜드 사용 규정 문서',
        status: 'approved',
        due_date: oneWeekAgo,
        submitted_date: new Date(oneWeekAgo.getTime() - 1 * 24 * 60 * 60 * 1000),
        approved_date: oneWeekAgo,
        version: 2,
        files: []
      }
    ],
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