import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Check, MessageCircle, Clock, Coins, Sparkles, TrendingUp, Award, Search, Settings, Star, Info, MapPin, Users, Briefcase, Target, FileText, ExternalLink } from 'lucide-react';

const CalendarSupportSystem = () => {
  const [viewType, setViewType] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);
  const [droppedItems, setDroppedItems] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointAnimation, setPointAnimation] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedRound, setSelectedRound] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [hoveredProgram, setHoveredProgram] = useState(null);
  const [modalProgram, setModalProgram] = useState(null);
  const dragCounter = useRef(0);

  // 지원사업 데이터 (상세 정보 추가)
  const supportPrograms = [
    { 
      id: 1, 
      title: '초기창업패키지', 
      amount: '최대 1.5억원',
      category: 'support',
      deadline: '2025.10.15',
      status: 'active',
      recommended: true,
      round: 'seed',
      sector: 'all',
      description: '예비창업자 및 3년 미만 창업기업을 위한 사업화 자금 지원',
      details: {
        target: '예비창업자, 3년 미만 창업기업',
        support: '시제품 제작, 마케팅, 인건비 등',
        process: '서류심사 → 발표평가 → 선정',
        benefits: ['멘토링 지원', '네트워킹 기회', '후속 연계 지원'],
        requirements: ['사업자등록 3년 미만', '기술 기반 창업', '대표자 만 39세 이하'],
        documents: ['사업계획서', '재무제표', '기술 증빙자료'],
        contact: '한국창업진흥원 (1357)',
        website: 'www.k-startup.go.kr'
      }
    },
    { 
      id: 2, 
      title: 'TIPS 프로그램', 
      amount: '최대 5억원',
      category: 'support',
      deadline: '2025.10.20',
      status: 'active',
      recommended: true,
      round: 'seed',
      sector: 'tech',
      description: '기술창업기업 대상 R&D 자금 및 투자 연계 지원',
      details: {
        target: '7년 이내 기술창업기업',
        support: 'R&D 자금, 엔젤투자 매칭',
        process: '운영사 추천 → 서면평가 → 대면평가',
        benefits: ['최대 5억 R&D', '엔젤투자 연계', '글로벌 진출 지원'],
        requirements: ['운영사 추천 필수', '기술성 평가 통과', '사업성 검증'],
        documents: ['기술사업계획서', 'IR 자료', '지식재산권 증빙'],
        contact: '한국엔젤투자협회 (02-3440-7420)',
        website: 'www.jointips.or.kr'
      }
    },
    { 
      id: 3, 
      title: 'Series A 투자 라운드', 
      amount: '50억원 목표',
      category: 'investment',
      deadline: '2025.10.25',
      status: 'urgent',
      round: 'seriesA',
      sector: 'all',
      description: '성장 단계 스타트업 대상 Series A 투자 유치 프로그램',
      details: {
        target: 'PMF 달성 스타트업',
        support: 'VC 매칭, IR 코칭',
        process: '사전 스크리닝 → IR 피칭 → 투자 협상',
        benefits: ['1:1 VC 매칭', 'IR 전문 코칭', '투자 조건 자문'],
        requirements: ['월 매출 1억 이상', 'YoY 100% 성장', '시리즈A 준비'],
        documents: ['Financial Model', 'Pitch Deck', 'Data Room'],
        contact: '한국벤처투자 (02-2156-2100)',
        website: 'www.kvic.or.kr'
      }
    },
    { 
      id: 4, 
      title: 'K-Startup 네트워킹 데이', 
      amount: '참가비 무료',
      category: 'network',
      deadline: '2025.11.05',
      status: 'active',
      round: 'all',
      sector: 'all',
      description: '국내외 스타트업 및 투자자 네트워킹 행사',
      details: {
        target: '모든 스타트업',
        support: '네트워킹, 비즈니스 매칭',
        process: '사전 신청 → 참가 확정',
        benefits: ['1:1 비즈니스 미팅', '글로벌 파트너 매칭', '투자자 네트워킹'],
        requirements: ['사업자등록증', '회사소개서', 'IR 자료'],
        documents: ['참가신청서', '회사소개서'],
        contact: '창업진흥원 (1357)',
        website: 'www.kstartup.go.kr'
      }
    },
    { 
      id: 5, 
      title: '스타트업 데모데이 2025', 
      amount: 'IR 피칭 기회',
      category: 'demoday',
      deadline: '2025.11.10',
      status: 'active',
      recommended: true,
      round: 'seed',
      sector: 'all',
      description: '유망 스타트업 IR 피칭 및 투자 유치 기회',
      details: {
        target: 'Seed~Series A 스타트업',
        support: 'IR 피칭 기회, 투자 연계',
        process: '서류 심사 → 예선 → 본선',
        benefits: ['100+ VC 참관', '미디어 노출', '우승 상금 1억원'],
        requirements: ['프로토타입 보유', '팀 구성 완료', 'BM 검증'],
        documents: ['5분 피치덱', '사업계획서', '팀 소개서'],
        contact: 'Startup Alliance (070-4128-3900)',
        website: 'www.demoday.kr'
      }
    },
    { 
      id: 6, 
      title: 'AI 기술 세미나', 
      amount: '수료증 발급',
      category: 'education',
      deadline: '2025.11.15',
      status: 'active',
      round: 'all',
      sector: 'ai',
      description: 'AI/ML 최신 기술 트렌드 및 실무 교육',
      details: {
        target: '개발자, CTO, 연구원',
        support: '전문 교육, 실습 지원',
        process: '온라인 신청 → 선착순 마감',
        benefits: ['실무 중심 커리큘럼', '네트워킹', '수료증 발급'],
        requirements: ['프로그래밍 기초', 'AI/ML 관심', '노트북 지참'],
        documents: ['참가신청서'],
        contact: 'AI혁신허브 (02-6952-0001)',
        website: 'www.aihub.or.kr'
      }
    },
    { 
      id: 7, 
      title: '글로벌 진출 지원사업', 
      amount: '최대 3천만원',
      category: 'support',
      deadline: '2025.11.20',
      status: 'active',
      round: 'growth',
      sector: 'all',
      description: '해외 시장 진출을 위한 마케팅 및 현지화 지원',
      details: {
        target: '해외 진출 준비 기업',
        support: '현지화, 마케팅, 법무 지원',
        process: '신청 → 심사 → 선정 → 지원',
        benefits: ['현지 파트너 매칭', '법무/회계 자문', '마케팅 비용 지원'],
        requirements: ['수출 실적 또는 계획', '영문 IR 보유', '현지화 전략'],
        documents: ['수출계획서', '영문 IR', '재무제표'],
        contact: 'KOTRA (1600-7119)',
        website: 'www.kotra.or.kr'
      }
    },
    { 
      id: 8, 
      title: '엔젤투자 매칭데이', 
      amount: '1:1 투자상담',
      category: 'investment',
      deadline: '2025.11.25',
      status: 'urgent',
      round: 'pre-seed',
      sector: 'all',
      description: '초기 스타트업과 엔젤투자자 매칭 프로그램',
      details: {
        target: 'Pre-seed, Seed 스타트업',
        support: '엔젤투자자 1:1 매칭',
        process: '신청 → 매칭 → 미팅',
        benefits: ['30+ 엔젤투자자', '1:1 밀착 상담', '후속 미팅 지원'],
        requirements: ['MVP 개발', '팀 구성', '사업계획서'],
        documents: ['5페이지 소개서', '재무계획', '팀 이력서'],
        contact: '한국엔젤투자협회 (02-3440-7425)',
        website: 'www.kban.or.kr'
      }
    }
  ];

  // 카테고리 정보
  const categories = {
    all: { label: '전체', color: 'indigo' },
    support: { label: '지원사업', color: 'blue' },
    investment: { label: '투자유치', color: 'green' },
    network: { label: '네트워킹', color: 'purple' },
    demoday: { label: '데모데이', color: 'orange' },
    education: { label: '교육/행사', color: 'pink' }
  };

  // 라운드 옵션
  const rounds = {
    all: '전체',
    'pre-seed': 'Pre-seed',
    seed: 'Seed',
    seriesA: 'Series A',
    growth: 'Growth'
  };

  // 섹터 옵션
  const sectors = {
    all: '전체',
    tech: 'Tech',
    ai: 'AI/ML',
    bio: 'Bio/Healthcare',
    fintech: 'Fintech',
    commerce: 'Commerce'
  };

  // 포인트 애니메이션 효과
  const showPointAnimation = (points, x, y) => {
    setPointAnimation({ points, x, y, id: Date.now() });
    
    // 효과음 대체 - 시각적 피드백
    const body = document.body;
    body.style.animation = 'pointPulse 0.3s ease';
    
    setTimeout(() => {
      body.style.animation = '';
      setPointAnimation(null);
    }, 1000);
  };

  // 주간 캘린더 날짜 생성
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // 월간 캘린더 날짜 생성
  const getMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    while (startDate <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return days;
  };

  // 드래그 시작
  const handleDragStart = (e, program) => {
    setDraggedItem(program);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 드롭
  const handleDrop = (e, date) => {
    e.preventDefault();
    dragCounter.current = 0;
    setHoveredDay(null);
    
    if (draggedItem) {
      const dateKey = date.toDateString();
      setEvents(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), draggedItem]
      }));
      
      // 애니메이션 피드백
      const element = e.currentTarget;
      element.style.animation = 'pulse 0.5s ease';
      setTimeout(() => {
        element.style.animation = '';
      }, 500);
    }
    setDraggedItem(null);
  };

  const handleDragEnter = (e, date) => {
    e.preventDefault();
    dragCounter.current++;
    setHoveredDay(date.toDateString());
  };

  const handleDragLeave = (e) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setHoveredDay(null);
    }
  };

  // 체크 토글 - 체크하면 자동으로 캘린더에 추가 + 10포인트
  const toggleCheck = (program, event) => {
    const programId = program.id;
    
    if (checkedItems.includes(programId)) {
      // 체크 해제
      setCheckedItems(prev => prev.filter(id => id !== programId));
    } else {
      // 체크 및 캘린더에 자동 추가
      setCheckedItems(prev => [...prev, programId]);
      
      // 마감일 기준으로 캘린더에 추가
      const deadlineDate = new Date(program.deadline.replace(/\./g, '-'));
      const dateKey = deadlineDate.toDateString();
      
      setEvents(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), program]
      }));
      
      // 포인트 추가 애니메이션
      setTotalPoints(prev => prev + 10);
      const rect = event.currentTarget.getBoundingClientRect();
      showPointAnimation('+10', rect.x, rect.y);
    }
  };

  // 드랍 (거절) 처리 - 5포인트
  const handleDismiss = (program, event) => {
    const programId = program.id;
    
    if (!droppedItems.includes(programId)) {
      setDroppedItems(prev => [...prev, programId]);
      
      // 포인트 추가 애니메이션
      setTotalPoints(prev => prev + 5);
      const rect = event.currentTarget.getBoundingClientRect();
      showPointAnimation('+5', rect.x, rect.y);
    }
  };

  // 필터링된 프로그램
  const filteredPrograms = supportPrograms
    .filter(program => filterCategory === 'all' || program.category === filterCategory)
    .filter(program => selectedRound === 'all' || program.round === selectedRound)
    .filter(program => selectedSector === 'all' || program.sector === selectedSector || program.sector === 'all')
    .filter(program => !droppedItems.includes(program.id));

  const days = viewType === 'week' ? getWeekDays() : getMonthDays();
  const currentMonth = selectedDate.getMonth();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* 포인트 애니메이션 */}
      {pointAnimation && (
        <div
          className="fixed pointer-events-none z-50 animate-floatUp"
          style={{
            left: `${pointAnimation.x}px`,
            top: `${pointAnimation.y}px`,
          }}
        >
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">
            <Sparkles className="w-4 h-4 animate-spin" />
            {pointAnimation.points}P
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {modalProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-modalIn">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {modalProgram.recommended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-gray-900 rounded-full text-xs font-bold">
                        <Star className="w-3 h-3" />
                        강력추천
                      </span>
                    )}
                    {modalProgram.status === 'urgent' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        마감임박
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{modalProgram.title}</h2>
                  <p className="text-blue-100">{modalProgram.description}</p>
                </div>
                <button
                  onClick={() => setModalProgram(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">지원금액</span>
                  <p className="text-lg font-bold text-blue-600">{modalProgram.amount}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">마감일</span>
                  <p className="text-lg font-bold text-gray-900">{modalProgram.deadline}</p>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="space-y-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Target className="w-4 h-4" />
                    지원 대상
                  </h3>
                  <p className="text-sm text-gray-600 pl-6">{modalProgram.details.target}</p>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4" />
                    지원 내용
                  </h3>
                  <p className="text-sm text-gray-600 pl-6">{modalProgram.details.support}</p>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    선정 절차
                  </h3>
                  <p className="text-sm text-gray-600 pl-6">{modalProgram.details.process}</p>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Star className="w-4 h-4" />
                    주요 혜택
                  </h3>
                  <ul className="space-y-1 pl-6">
                    {modalProgram.details.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-500 mt-0.5">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Users className="w-4 h-4" />
                    지원 자격
                  </h3>
                  <ul className="space-y-1 pl-6">
                    {modalProgram.details.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 mt-0.5">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    필요 서류
                  </h3>
                  <ul className="space-y-1 pl-6">
                    {modalProgram.details.documents.map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 mt-0.5">•</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 문의처 */}
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">문의처</h3>
                <p className="text-sm text-gray-600">{modalProgram.details.contact}</p>
                <a 
                  href={`https://${modalProgram.details.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                >
                  {modalProgram.details.website}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={(e) => {
                    toggleCheck(modalProgram, e);
                    setModalProgram(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    checkedItems.includes(modalProgram.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {checkedItems.includes(modalProgram.id) ? '캘린더에 추가됨' : '캘린더에 추가 (+10P)'}
                </button>
                <button
                  onClick={() => setModalProgram(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 포인트 표시 헤더 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Coins className="w-5 h-5" />
          <span className="font-bold">{totalPoints.toLocaleString()}P</span>
          <Award className="w-5 h-5" />
        </div>
      </div>

      {/* 좌측 캘린더 영역 */}
      <div className="flex-1 bg-white border-r border-gray-200 flex flex-col">
        {/* 캘린더 헤더 */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (viewType === 'week') {
                    newDate.setDate(newDate.getDate() - 7);
                  } else {
                    newDate.setMonth(newDate.getMonth() - 1);
                  }
                  setSelectedDate(newDate);
                }}
                className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold">
                {selectedDate.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long',
                  ...(viewType === 'week' && { day: 'numeric' })
                })}
              </h2>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (viewType === 'week') {
                    newDate.setDate(newDate.getDate() + 7);
                  } else {
                    newDate.setMonth(newDate.getMonth() + 1);
                  }
                  setSelectedDate(newDate);
                }}
                className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('week')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewType === 'week' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                주간
              </button>
              <button
                onClick={() => setViewType('month')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewType === 'month' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                월간
              </button>
            </div>
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <div className="flex-1 overflow-auto">
          {viewType === 'week' ? (
            // 주간 뷰 - 세로 리스트 형태 (상세 정보 포함)
            <div className="p-2">
              {days.map((day, idx) => {
                const dateKey = day.toDateString();
                const dayEvents = events[dateKey] || [];
                const isToday = day.toDateString() === new Date().toDateString();
                const isHovered = hoveredDay === dateKey;
                const dayName = day.toLocaleDateString('ko-KR', { weekday: 'short' });
                
                return (
                  <div
                    key={idx}
                    className={`mb-2 rounded-lg border transition-all ${
                      isHovered ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    onDrop={(e) => handleDrop(e, day)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => handleDragEnter(e, day)}
                    onDragLeave={handleDragLeave}
                  >
                    <div className={`px-3 py-1 border-b ${
                      isToday ? 'bg-blue-500 text-white' : 'bg-gray-50'
                    } rounded-t-lg`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{day.getDate()}</span>
                          <span className="text-xs font-medium">{dayName}</span>
                        </div>
                        {dayEvents.length > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isToday ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {dayEvents.length}개
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-2">
                      {dayEvents.length > 0 ? (
                        <div className="space-y-2">
                          {dayEvents.map((event, i) => (
                            <div
                              key={i}
                              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 p-3 rounded-lg animate-fadeIn cursor-pointer hover:shadow-md transition-all"
                              onClick={() => setModalProgram(event)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {event.recommended && (
                                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-orange-600 mb-1">
                                      <Star className="w-3 h-3" />
                                      강력추천
                                    </span>
                                  )}
                                  <h4 className="font-bold text-sm text-gray-900 mb-1">{event.title}</h4>
                                  <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-blue-600">{event.amount}</span>
                                    <span className="text-xs text-gray-500">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {event.deadline}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-2">
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {categories[event.category].label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-gray-400">
                          {isHovered && draggedItem ? (
                            <div className="border-2 border-dashed border-blue-400 rounded-lg p-2 animate-pulse">
                              <div className="text-blue-600 text-xs">여기에 놓기</div>
                            </div>
                          ) : (
                            <span className="text-xs">일정 없음</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 월간 뷰
            <div className="p-4">
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
                {days.map((day, idx) => {
                  const dateKey = day.toDateString();
                  const dayEvents = events[dateKey] || [];
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.getMonth() === currentMonth;
                  const isHovered = hoveredDay === dateKey;
                  
                  return (
                    <div
                      key={idx}
                      className={`bg-white p-2 min-h-[80px] transition-all ${
                        !isCurrentMonth ? 'opacity-40' : ''
                      } ${isHovered ? 'bg-blue-50 ring-2 ring-blue-400' : ''} ${
                        isToday ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onDrop={(e) => handleDrop(e, day)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => handleDragEnter(e, day)}
                      onDragLeave={handleDragLeave}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event, i) => (
                          <div
                            key={i}
                            className="bg-blue-50 border border-blue-200 text-blue-700 px-1 py-0.5 rounded text-xs truncate cursor-pointer hover:bg-blue-100"
                            onClick={() => setModalProgram(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2}개
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 우측 지원사업 목록 */}
      <div className="w-96 bg-white flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">지원사업 목록</h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          {/* 설정 패널 */}
          {showSettings && (
            <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="mb-2">
                <label className="text-xs font-medium text-gray-700 mb-1 block">라운드</label>
                <select 
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                >
                  {Object.entries(rounds).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">섹터</label>
                <select 
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                >
                  {Object.entries(sectors).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* 필터 */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {Object.entries(categories).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filterCategory === key 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {info.label}
              </button>
            ))}
          </div>

          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="지원사업 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 지원사업 카드 목록 */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {filteredPrograms.map(program => (
            <div
              key={program.id}
              draggable
              onDragStart={(e) => handleDragStart(e, program)}
              onMouseEnter={() => setHoveredProgram(program.id)}
              onMouseLeave={() => setHoveredProgram(null)}
              onClick={() => setModalProgram(program)}
              className={`relative bg-white border-2 border-blue-400 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                checkedItems.includes(program.id) ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {/* 호버 시 미니 정보 */}
              {hoveredProgram === program.id && (
                <div className="absolute left-full ml-2 top-0 z-40 w-48 bg-white border-2 border-blue-400 rounded-lg shadow-xl p-3 animate-fadeIn pointer-events-none">
                  <p className="text-xs text-gray-600 mb-2">{program.description}</p>
                  <div className="text-xs text-gray-500">
                    <p>대상: {program.details.target}</p>
                    <p className="mt-1">클릭하여 상세보기</p>
                  </div>
                </div>
              )}

              <div className="text-gray-900">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 추천 및 긴급 배지 */}
                    <div className="flex gap-1 mb-1">
                      {program.recommended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-xs font-bold">
                          <Star className="w-3 h-3" />
                          강력추천
                        </span>
                      )}
                      {program.status === 'urgent' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          마감임박
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-sm mb-1">{program.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium">{program.amount}</span>
                      <span className="text-xs text-gray-500">~{program.deadline}</span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-1 ml-2">
                    {/* 드랍 (거절) - 5포인트 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(program, e);
                      }}
                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-all group relative"
                      title="관심없음"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        관심없음 (+5P)
                      </span>
                    </button>
                    
                    {/* 체크 - 자동 캘린더 추가 + 10포인트 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCheck(program, e);
                      }}
                      className={`p-1.5 rounded transition-all ${
                        checkedItems.includes(program.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } group relative`}
                      title="캘린더에 추가"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {checkedItems.includes(program.id) ? '추가됨' : '캘린더 추가 (+10P)'}
                      </span>
                    </button>
                    
                    {/* 문의 */}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors group relative"
                      title="문의하기"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        문의
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 요약 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              캘린더 추가: <span className="font-bold text-green-600">{checkedItems.length}개</span>
            </span>
            <button className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
              선택 항목 상세보기
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes modalIn {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0);
          }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes floatUp {
          0% { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
          100% { 
            opacity: 0; 
            transform: translateY(-60px) scale(1.2);
          }
        }
        @keyframes pointPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
        .animate-modalIn {
          animation: modalIn 0.3s ease;
        }
        .animate-floatUp {
          animation: floatUp 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CalendarSupportSystem;