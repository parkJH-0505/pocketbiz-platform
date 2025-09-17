/**
 * 가이드미팅 기록 시스템 목업 데이터
 */

import type {
  GuideMeetingRecord,
  GuideMeetingMemo,
  GuideMeetingComment,
  MeetingAttachment
} from '../types/meeting.types';

// 목업 첨부파일 데이터
const mockAttachments: MeetingAttachment[] = [
  {
    id: 'att-001',
    name: 'IR덱_초안_v1.0.pdf',
    url: '/files/meetings/ir-deck-v1.pdf',
    size: 2048576, // 2MB
    type: 'application/pdf',
    uploadedAt: new Date('2024-01-10T14:30:00'),
    uploadedBy: 'pm-001'
  },
  {
    id: 'att-002',
    name: '시장분석_보고서.xlsx',
    url: '/files/meetings/market-analysis.xlsx',
    size: 1024000, // 1MB
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: new Date('2024-01-15T10:15:00'),
    uploadedBy: 'pm-001'
  },
  {
    id: 'att-003',
    name: '프로토타입_스크린샷.png',
    url: '/files/meetings/prototype-screenshot.png',
    size: 512000, // 500KB
    type: 'image/png',
    uploadedAt: new Date('2024-01-20T16:45:00'),
    uploadedBy: 'pm-001'
  }
];

// 목업 미팅 메모 데이터
const mockMemos: Record<string, GuideMeetingMemo> = {
  'meeting-001': {
    id: 'memo-001',
    summary: `프리미팅을 통해 프로젝트의 전반적인 방향성을 논의했습니다.
    클라이언트의 비즈니스 모델과 타겟 고객을 명확히 하고,
    IR 덱 제작의 핵심 목표를 설정했습니다.`,
    discussions: [
      '비즈니스 모델 및 수익 구조 분석',
      '타겟 투자자 및 투자 라운드 전략',
      '기존 IR 자료 검토 및 개선점 도출',
      '프로젝트 일정 및 마일스톤 설정'
    ],
    decisions: [
      'IR 덱은 Series A 투자유치용으로 제작',
      '총 15-20페이지 분량으로 구성',
      '2주 내 초안 완성 목표',
      '주 1회 정기 리뷰 미팅 진행'
    ],
    actionItems: [
      '클라이언트: 기존 사업계획서 및 재무자료 제공',
      'PM: 경쟁사 분석 자료 준비',
      '디자이너: 브랜드 가이드라인 확인',
      '다음 미팅: 1월 10일 오후 2시'
    ],
    nextSteps: '가이드미팅 1차에서 IR 덱 구조 및 핵심 메시지 확정',
    attachments: [mockAttachments[0]],
    createdBy: 'pm-001',
    createdAt: new Date('2024-01-05T17:00:00'),
    updatedAt: new Date('2024-01-05T17:00:00')
  },

  'meeting-002': {
    id: 'memo-002',
    summary: `IR 덱의 전체 구조와 각 섹션별 핵심 메시지를 확정했습니다.
    클라이언트의 피드백을 반영하여 스토리텔링 방향을 조정하고,
    디자인 컨셉을 결정했습니다.`,
    discussions: [
      'IR 덱 구조 및 페이지 구성 검토',
      '핵심 가치제안(Value Proposition) 정의',
      '시장 규모 및 기회 분석 방법론',
      '경쟁우위 및 차별화 포인트 명확화'
    ],
    decisions: [
      '총 18페이지 구성으로 최종 확정',
      '문제-해결-시장-제품-비즈니스모델-팀-재무 순서',
      '모던하고 깔끔한 디자인 컨셉 적용',
      '데이터 시각화에 중점을 둔 차트 활용'
    ],
    actionItems: [
      'PM: 각 섹션별 초안 작성 (~ 1/12)',
      '디자이너: 디자인 시스템 구축 (~ 1/13)',
      '클라이언트: 팀 소개 및 재무 데이터 보완 (~ 1/14)',
      '다음 미팅: 1월 15일 오전 10시'
    ],
    nextSteps: '초안 검토 및 상세 콘텐츠 개발',
    attachments: [mockAttachments[1]],
    createdBy: 'pm-001',
    createdAt: new Date('2024-01-10T15:30:00'),
    updatedAt: new Date('2024-01-10T15:30:00')
  },

  'meeting-003': {
    id: 'memo-003',
    summary: `IR 덱 초안을 검토하고 클라이언트 피드백을 반영했습니다.
    특히 재무 모델과 성장 전략 부분을 보완하고,
    투자자 관점에서의 설득력을 높이는 방향으로 수정했습니다.`,
    discussions: [
      'IR 덱 초안 페이지별 상세 리뷰',
      '투자자 질문 예상 시나리오 검토',
      '재무 모델 및 매출 전망 정확성 점검',
      '경쟁사 대비 우위 요소 강화 방안'
    ],
    decisions: [
      '시장 규모 섹션에 TAM-SAM-SOM 분석 추가',
      '비즈니스 모델 다이어그램 개선',
      '팀 소개에 어드바이저 정보 포함',
      '부록에 상세 재무 가정 명시'
    ],
    actionItems: [
      'PM: 수정된 IR 덱 v2.0 작성 (~ 1/17)',
      '디자이너: 차트 및 다이어그램 리디자인 (~ 1/18)',
      '클라이언트: 최종 검토 및 승인 (~ 1/19)',
      '다음 미팅: 1월 20일 오후 4시 (최종 검토)'
    ],
    nextSteps: '최종 IR 덱 완성 및 프레젠테이션 준비',
    attachments: [mockAttachments[2]],
    createdBy: 'pm-001',
    createdAt: new Date('2024-01-15T11:15:00'),
    updatedAt: new Date('2024-01-15T11:15:00')
  }
};

// 목업 댓글 데이터
const mockComments: Record<string, GuideMeetingComment[]> = {
  'meeting-001': [
    {
      id: 'comment-001',
      meetingId: 'meeting-001',
      content: '프리미팅에서 논의된 내용 잘 정리해주셨네요. 특히 타겟 투자자 분석이 도움이 되었습니다.',
      authorId: 'customer-001',
      authorName: '김대표',
      authorType: 'customer',
      createdAt: new Date('2024-01-05T18:30:00'),
      isReadByPM: true,
      readAt: new Date('2024-01-06T09:00:00')
    },
    {
      id: 'comment-002',
      meetingId: 'meeting-001',
      content: '기존 사업계획서를 첨부로 보내드렸습니다. 검토 후 피드백 주시면 감사하겠습니다.',
      authorId: 'customer-001',
      authorName: '김대표',
      authorType: 'customer',
      createdAt: new Date('2024-01-06T10:15:00'),
      isReadByPM: true,
      readAt: new Date('2024-01-06T11:30:00'),
      attachments: [{
        id: 'att-customer-001',
        name: '기존_사업계획서.pdf',
        url: '/files/customer/business-plan.pdf',
        size: 3072000,
        type: 'application/pdf',
        uploadedAt: new Date('2024-01-06T10:15:00'),
        uploadedBy: 'customer-001'
      }]
    }
  ],

  'meeting-002': [
    {
      id: 'comment-003',
      meetingId: 'meeting-002',
      content: 'IR 덱 구조가 논리적으로 잘 짜여진 것 같습니다. 다만 경쟁사 분석 부분을 좀 더 구체적으로 다뤘으면 좋겠어요.',
      authorId: 'customer-001',
      authorName: '김대표',
      authorType: 'customer',
      createdAt: new Date('2024-01-10T20:45:00'),
      isReadByPM: true,
      readAt: new Date('2024-01-11T08:15:00')
    },
    {
      id: 'comment-004',
      meetingId: 'meeting-002',
      content: '네, 경쟁사 분석을 보강하겠습니다. 직접적 경쟁사 3개, 간접적 경쟁사 2개 정도로 구성해보죠.',
      authorId: 'pm-001',
      authorName: '김수민',
      authorType: 'pm',
      createdAt: new Date('2024-01-11T09:00:00'),
      isReadByPM: false
    }
  ],

  'meeting-003': [
    {
      id: 'comment-005',
      meetingId: 'meeting-003',
      content: '초안 검토했습니다. 전반적으로 만족스럽고, 특히 시장 분석 부분이 인상적이었어요.',
      authorId: 'customer-001',
      authorName: '김대표',
      authorType: 'customer',
      createdAt: new Date('2024-01-15T14:20:00'),
      isReadByPM: true,
      readAt: new Date('2024-01-15T15:00:00')
    },
    {
      id: 'comment-006',
      meetingId: 'meeting-003',
      content: '다만 재무 전망 부분에서 성장률이 다소 공격적인 것 같은데, 보수적인 시나리오도 추가할 수 있을까요?',
      authorId: 'customer-001',
      authorName: '김대표',
      authorType: 'customer',
      createdAt: new Date('2024-01-15T14:25:00'),
      isReadByPM: false
    },
    {
      id: 'comment-007',
      meetingId: 'meeting-003',
      content: '좋은 지적입니다. Conservative/Aggressive 두 시나리오로 구분해서 제시하겠습니다.',
      authorId: 'pm-001',
      authorName: '김수민',
      authorType: 'pm',
      createdAt: new Date('2024-01-15T16:10:00'),
      isReadByPM: false
    }
  ]
};

// IR 덱 프로젝트 미팅 기록
export const mockMeetingRecords: Record<string, GuideMeetingRecord[]> = {
  'PRJ-001': [
    {
      id: 'meeting-001',
      projectId: 'PRJ-001',
      type: 'pre',
      title: '프리미팅',
      date: new Date('2024-01-05T14:00:00'),
      duration: 90,
      location: '포켓컴퍼니 회의실 A',
      status: 'completed',
      participants: {
        pm: {
          id: 'pm-001',
          name: '김수민',
          email: 'kim@pocket.com',
          role: 'Senior PM'
        },
        customer: {
          id: 'customer-001',
          name: '김대표',
          company: 'TechStart Inc.'
        }
      },
      memo: mockMemos['meeting-001'],
      comments: mockComments['meeting-001'] || [],
      pmLastChecked: new Date('2024-01-06T11:30:00'),
      unreadCommentCount: 0,
      tags: ['킥오프', '기획'],
      createdAt: new Date('2024-01-05T14:00:00'),
      updatedAt: new Date('2024-01-06T11:30:00')
    },

    {
      id: 'meeting-002',
      projectId: 'PRJ-001',
      type: 'guide',
      round: 1,
      title: '가이드미팅 1차',
      date: new Date('2024-01-10T14:00:00'),
      duration: 60,
      location: 'Zoom 온라인',
      meetingLink: 'https://zoom.us/j/123456789',
      status: 'completed',
      participants: {
        pm: {
          id: 'pm-001',
          name: '김수민',
          email: 'kim@pocket.com',
          role: 'Senior PM'
        },
        customer: {
          id: 'customer-001',
          name: '김대표',
          company: 'TechStart Inc.'
        },
        others: [
          {
            id: 'designer-001',
            name: '이디자인',
            role: 'UX Designer'
          }
        ]
      },
      memo: mockMemos['meeting-002'],
      comments: mockComments['meeting-002'] || [],
      pmLastChecked: new Date('2024-01-11T09:00:00'),
      unreadCommentCount: 0,
      tags: ['구조설계', '디자인'],
      createdAt: new Date('2024-01-10T14:00:00'),
      updatedAt: new Date('2024-01-11T09:00:00')
    },

    {
      id: 'meeting-003',
      projectId: 'PRJ-001',
      type: 'guide',
      round: 2,
      title: '가이드미팅 2차',
      date: new Date('2024-01-15T10:00:00'),
      duration: 75,
      location: 'Zoom 온라인',
      meetingLink: 'https://zoom.us/j/987654321',
      status: 'completed',
      participants: {
        pm: {
          id: 'pm-001',
          name: '김수민',
          email: 'kim@pocket.com',
          role: 'Senior PM'
        },
        customer: {
          id: 'customer-001',
          name: '김대표',
          company: 'TechStart Inc.'
        }
      },
      memo: mockMemos['meeting-003'],
      comments: mockComments['meeting-003'] || [],
      pmLastChecked: new Date('2024-01-15T15:00:00'),
      unreadCommentCount: 2, // comment-006, comment-007이 읽지 않음
      tags: ['검토', '수정'],
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T16:10:00')
    },

    {
      id: 'meeting-004',
      projectId: 'PRJ-001',
      type: 'guide',
      round: 3,
      title: '가이드미팅 3차',
      date: new Date('2024-01-20T16:00:00'),
      duration: 60,
      location: 'Google Meet',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'scheduled',
      participants: {
        pm: {
          id: 'pm-001',
          name: '김수민',
          email: 'kim@pocket.com',
          role: 'Senior PM'
        },
        customer: {
          id: 'customer-001',
          name: '김대표',
          company: 'TechStart Inc.'
        }
      },
      comments: [],
      unreadCommentCount: 0,
      tags: ['최종검토'],
      createdAt: new Date('2024-01-15T17:00:00'),
      updatedAt: new Date('2024-01-15T17:00:00')
    }
  ],

  // MVP 개발 프로젝트 미팅 기록
  'PRJ-002': [
    {
      id: 'meeting-005',
      projectId: 'PRJ-002',
      type: 'pre',
      title: '프리미팅',
      date: new Date('2024-01-08T10:00:00'),
      duration: 120,
      location: '포켓컴퍼니 회의실 B',
      status: 'completed',
      participants: {
        pm: {
          id: 'pm-002',
          name: '박준영',
          email: 'park@pocket.com',
          role: 'Technical PM'
        },
        customer: {
          id: 'customer-002',
          name: '이스타트업',
          company: 'StartupCorp'
        }
      },
      memo: {
        id: 'memo-004',
        summary: 'MVP 개발 프로젝트 킥오프 미팅을 진행했습니다.',
        discussions: ['프로젝트 범위 설정', '기술 스택 논의', '개발 일정 수립'],
        decisions: ['React + Node.js 스택 사용', '8주 개발 기간', '주간 스프린트 진행'],
        actionItems: ['요구사항 정의서 작성', '디자인 가이드 준비', 'DB 설계'],
        attachments: [],
        createdBy: 'pm-002',
        createdAt: new Date('2024-01-08T12:30:00'),
        updatedAt: new Date('2024-01-08T12:30:00')
      },
      comments: [],
      unreadCommentCount: 0,
      tags: ['킥오프', '개발'],
      createdAt: new Date('2024-01-08T10:00:00'),
      updatedAt: new Date('2024-01-08T12:30:00')
    },

    {
      id: 'meeting-006',
      projectId: 'PRJ-002',
      type: 'guide',
      round: 1,
      title: '가이드미팅 1차',
      date: new Date('2024-01-12T14:00:00'),
      duration: 60,
      location: 'Zoom 온라인',
      status: 'completed',
      participants: {
        pm: {
          id: 'pm-002',
          name: '박준영',
          email: 'park@pocket.com',
          role: 'Technical PM'
        },
        customer: {
          id: 'customer-002',
          name: '이스타트업',
          company: 'StartupCorp'
        }
      },
      comments: [
        {
          id: 'comment-008',
          meetingId: 'meeting-006',
          content: '진행 상황이 생각보다 빠르네요! 다음 주까지 프로토타입을 볼 수 있을까요?',
          authorId: 'customer-002',
          authorName: '이스타트업',
          authorType: 'customer',
          createdAt: new Date('2024-01-12T15:30:00'),
          isReadByPM: false
        }
      ],
      unreadCommentCount: 1,
      tags: ['개발진행'],
      createdAt: new Date('2024-01-12T14:00:00'),
      updatedAt: new Date('2024-01-12T15:30:00')
    }
  ]
};