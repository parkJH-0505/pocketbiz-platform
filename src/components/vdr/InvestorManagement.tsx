import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Eye,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Filter,
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Check,
  X,
  Star,
  UserPlus,
  BarChart3,
  ExternalLink,
  Edit3,
  Trash2,
  MoreHorizontal,
  Send
} from 'lucide-react';
import { useVDRContext } from '../../contexts/VDRContext';

const InvestorManagement: React.FC = () => {
  const {
    getInvestorAnalytics,
    ndaRequests,
    investorLeads,
    approveNDARequest,
    rejectNDARequest,
    getInvestorLead,
    createInvestorLead
  } = useVDRContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showNDADetailsModal, setShowNDADetailsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showColdEmailModal, setShowColdEmailModal] = useState(false);
  const [selectedNDA, setSelectedNDA] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [expandedNDAList, setExpandedNDAList] = useState(false);

  // 투자자 추가 폼 상태
  const [newInvestorForm, setNewInvestorForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    role: 'vc' as const,
    fundName: '',
    website: '',
    notes: ''
  });
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // 포켓비즈 디자인 시스템 색상
  const colors = {
    primary: "rgb(15, 82, 222)",
    GO: "rgb(112, 46, 220)", // 보라
    EC: "rgb(76, 206, 148)", // 초록
    PT: "rgb(251, 146, 60)", // 주황
  };

  // 분석 데이터
  const analytics = useMemo(() => getInvestorAnalytics(), [getInvestorAnalytics]);

  // 대기중인 NDA 요청들
  const pendingNDARequests = ndaRequests.filter(request => request.status === 'pending');

  // Hot 리드들 (관심도 80점 이상)
  const hotLeads = investorLeads.filter(lead =>
    lead.interestScore >= 80 || lead.status === 'hot'
  ).slice(0, 6);

  // NDA 승인/거절 처리
  const handleApproveNDA = async (requestId: string) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await approveNDARequest(requestId, 'Admin', expiresAt);
  };

  const handleRejectNDA = async (requestId: string) => {
    await rejectNDARequest(requestId, '검토 후 거절됨', 'Admin');
  };

  // 콜드메일 생성 함수
  // 투자자 추가 함수
  const handleAddInvestor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newInvestorForm.name || !newInvestorForm.company || !newInvestorForm.email) {
      alert('이름, 회사, 이메일은 필수 입력 항목입니다.');
      return;
    }

    try {
      await createInvestorLead({
        name: newInvestorForm.name,
        company: newInvestorForm.company,
        email: newInvestorForm.email,
        phone: newInvestorForm.phone,
        role: newInvestorForm.role,
        source: 'manual_add',
        status: 'cold',
        tags: [],
        notes: newInvestorForm.notes,
        profileViews: [],
        contactHistory: [],
        fundName: newInvestorForm.fundName,
        website: newInvestorForm.website,
        interestScore: 0,
        totalProfileViews: 0,
        mostViewedSections: []
      });

      // 폼 초기화 및 모달 닫기
      setNewInvestorForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        role: 'vc',
        fundName: '',
        website: '',
        notes: ''
      });
      setShowAddLeadModal(false);

      alert('투자자가 성공적으로 추가되었습니다!');
    } catch (error) {
      console.error('투자자 추가 중 오류:', error);
      alert('투자자 추가 중 오류가 발생했습니다.');
    }
  };

  const generateColdEmail = async (leadId: string) => {
    const lead = getInvestorLead(leadId);
    if (!lead) return;

    setIsGeneratingEmail(true);
    setSelectedLead(leadId);
    setShowColdEmailModal(true);

    // AI 콜드메일 생성 시뮬레이션
    setTimeout(() => {
      const emailTemplates = {
        vc: `안녕하세요 ${lead.name}님,

${lead.company}에서 ${lead.sectors?.join(', ')} 분야 투자를 진행하고 계신다는 소식을 듣고 연락드립니다.

저희는 [회사명]으로, B2B SaaS 플랫폼을 통해 스타트업들의 성장을 돕는 서비스를 운영하고 있습니다. 현재 Series A 라운드를 준비하고 있으며, ${lead.checkSize} 규모의 투자를 유치하고자 합니다.

특히 저희 서비스는 다음과 같은 특징이 있습니다:
• 월 20% 성장률을 기록 중인 견고한 비즈니스 모델
• 기업 고객 중심의 안정적인 수익 구조
• 경험 많은 팀과 검증된 기술력

${lead.fundName}의 포트폴리오와 투자 철학을 보면, 저희와 시너지가 클 것으로 판단됩니다. 간단한 IR 자료를 보내드릴 수 있을까요?

편하신 시간에 15분 정도 통화할 수 있는 일정이 있으시다면 감사하겠습니다.

감사합니다.

[이름]
[직책] | [회사명]
[이메일] | [전화번호]`,

        angel: `안녕하세요 ${lead.name}님,

${lead.tags?.includes('Female Founder') ? '여성 창업가로서 ' : ''}스타트업 생태계에 큰 기여를 하고 계신다는 소식을 듣고 연락드립니다.

저희 [회사명]은 현재 초기 투자를 유치하고 있는 스타트업입니다. 특히 ${lead.sectors?.join(', ')} 분야에서의 경험과 인사이트를 갖고 계신 것으로 알고 있어, 조언을 구하고자 합니다.

저희는 다음과 같은 성과를 거두고 있습니다:
• 검증된 PMF와 초기 고객 확보
• 지속가능한 비즈니스 모델 구축
• 업계 경험이 풍부한 창업팀

${lead.interestScore > 70 ? '최근 저희 프로필을 여러 번 확인해주신 것으로 알고 있습니다. ' : ''}간단한 피칭 자료를 공유드리고, 조언을 구할 수 있는 기회가 있을까요?

감사합니다.

[이름]
[직책] | [회사명]`,

        corporate_vc: `안녕하세요 ${lead.name}님,

${lead.company}의 전략적 투자 부문에서 ${lead.sectors?.join(', ')} 영역의 혁신 기업들과 파트너십을 구축하고 계신다는 소식을 듣고 연락드립니다.

저희 [회사명]은 B2B SaaS 플랫폼으로, 기업들의 디지털 전환을 돕고 있습니다. 특히 ${lead.company}의 비즈니스 영역과 시너지가 높은 솔루션을 제공하고 있어 전략적 파트너십 가능성을 타진해보고자 합니다.

주요 특징:
• 대기업 고객 중심의 엔터프라이즈 솔루션
• 확장 가능한 기술 아키텍처
• 글로벌 시장 진출 계획

${lead.tags?.includes('Strategic Partnership') ? '전략적 파트너십에 관심이 많으시다는 것을 알고 있습니다. ' : ''}간단한 미팅을 통해 협력 방안을 논의할 수 있을까요?

감사합니다.

[이름]
[직책] | [회사명]`
      };

      const template = emailTemplates[lead.role] || emailTemplates.vc;
      setGeneratedEmail(template);
      setIsGeneratingEmail(false);
    }, 2000);
  };

  // 상태별 스타일
  const getStatusStyle = (status: string) => {
    const styles = {
      pending: { icon: Clock, color: colors.PT, bg: colors.PT + '15', label: '검토중' },
      hot: { color: colors.GO, bg: colors.GO + '15' },
      warm: { color: colors.PT, bg: colors.PT + '15' },
      engaged: { color: colors.EC, bg: colors.EC + '15' }
    };
    return styles[status as keyof typeof styles] || { color: '#9CA3AF', bg: '#9CA3AF15' };
  };

  // KPI 카드 데이터
  const kpiCards = [
    {
      title: '프로필 조회',
      value: analytics.profileViewStats.totalViews,
      icon: Eye,
      color: colors.primary,
      subtitle: '총 조회수'
    },
    {
      title: '관심 투자자',
      value: hotLeads.length,
      icon: Star,
      color: colors.GO,
      subtitle: 'Hot 리드'
    },
    {
      title: 'NDA 요청',
      value: pendingNDARequests.length,
      icon: FileText,
      color: colors.PT,
      subtitle: '승인 대기중'
    },
    {
      title: '활성 대화',
      value: analytics.engagementMetrics.activeConversations,
      icon: MessageSquare,
      color: colors.EC,
      subtitle: '진행중'
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            투자자 관계 관리
          </h2>
          <p className="text-gray-600 mt-2">
            프로필 조회, NDA 요청, 투자자 정보를 한눈에 관리하세요
          </p>
        </div>

        <button
          onClick={() => setShowAddLeadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          투자자 추가
        </button>
      </div>

      {/* KPI 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: card.color + '15' }}
                >
                  <Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {card.value}
                </div>
                <div className="text-lg font-medium text-gray-700 mb-1">
                  {card.title}
                </div>
                <div className="text-sm text-gray-500">
                  {card.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NDA 요청 처리 (왼쪽) */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              NDA 요청 처리
            </h3>
            {pendingNDARequests.length > 0 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                {pendingNDARequests.length}건 대기중
              </span>
            )}
          </div>

          {pendingNDARequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">대기중인 NDA 요청이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(expandedNDAList ? pendingNDARequests : pendingNDARequests.slice(0, 3)).map((request) => {
                const lead = getInvestorLead(request.leadId);
                return (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {request.requesterInfo.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{request.requesterInfo.name}</div>
                            <div className="text-sm text-gray-600">{request.requesterInfo.company}</div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 ml-11">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-3 h-3" />
                            {request.requesterInfo.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            요청일: {request.requestDate.toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleApproveNDA(request.id)}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="승인"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectNDA(request.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="거절"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {pendingNDARequests.length > 3 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setExpandedNDAList(!expandedNDAList)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {expandedNDAList
                      ? '접기'
                      : `+${pendingNDARequests.length - 3}개 더 보기`
                    }
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hot 리드 (오른쪽) */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-500" />
              관심 높은 투자자
            </h3>
            {hotLeads.length > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {hotLeads.length}명
              </span>
            )}
          </div>

          {hotLeads.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Hot 리드가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hotLeads.map((lead) => {
                const statusStyle = getStatusStyle(lead.status);
                return (
                  <div key={lead.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {lead.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-600">{lead.company}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{lead.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-semibold text-purple-600 mb-1">
                          {lead.interestScore}점
                        </div>
                        <div
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color
                          }}
                        >
                          {lead.status.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => generateColdEmail(lead.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-50 text-purple-600 rounded text-xs hover:bg-purple-100 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        콜드메일
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLead(lead.id);
                          setShowContactModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        연락
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLead(lead.id);
                          setShowContactModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100 transition-colors"
                      >
                        <Calendar className="w-3 h-3" />
                        미팅
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 프로필 조회 활동 요약 */}
      {analytics.profileViewStats.totalViews > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            프로필 조회 활동
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {analytics.profileViewStats.totalViews}
              </div>
              <div className="text-sm text-gray-600">총 조회수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analytics.profileViewStats.uniqueViewers}
              </div>
              <div className="text-sm text-gray-600">고유 방문자</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Math.round(analytics.profileViewStats.averageViewTime / 60)}분
              </div>
              <div className="text-sm text-gray-600">평균 체류시간</div>
            </div>
          </div>

          {/* 인기 섹션 */}
          {analytics.profileViewStats.popularSections.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-3">인기 섹션</h4>
              <div className="space-y-2">
                {analytics.profileViewStats.popularSections.slice(0, 5).map((section, index) => {
                  const percentage = analytics.profileViewStats.totalViews > 0
                    ? (section.viewCount / analytics.profileViewStats.totalViews) * 100
                    : 0;

                  return (
                    <div key={section.section} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 capitalize">
                        {section.section}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-600 min-w-[3rem] text-right">
                          {section.viewCount}회
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 콜드메일 생성 모달 */}
      {showColdEmailModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-600" />
                  AI 콜드메일 생성
                </h3>
                <button
                  onClick={() => {
                    setShowColdEmailModal(false);
                    setSelectedLead(null);
                    setGeneratedEmail('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                {getInvestorLead(selectedLead)?.name}님께 보낼 개인화된 콜드메일을 생성합니다
              </p>
            </div>

            <div className="p-6">
              {isGeneratingEmail ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">AI가 개인화된 메일을 작성하고 있습니다...</p>
                </div>
              ) : generatedEmail ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">생성된 콜드메일</h4>
                    <textarea
                      value={generatedEmail}
                      onChange={(e) => setGeneratedEmail(e.target.value)}
                      className="w-full h-96 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="생성된 메일 내용이 여기에 표시됩니다..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" />
                      AI가 투자자 정보를 바탕으로 개인화된 메일을 생성했습니다
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateColdEmail(selectedLead)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        다시 생성
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedEmail);
                          // TODO: 토스트 알림 추가
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        클립보드에 복사
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 투자자 추가 모달 */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  새 투자자 추가
                </h3>
                <button
                  onClick={() => setShowAddLeadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form className="space-y-4" onSubmit={handleAddInvestor}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    value={newInvestorForm.name}
                    onChange={(e) => setNewInvestorForm({...newInvestorForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="투자자 이름"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">회사</label>
                  <input
                    type="text"
                    value={newInvestorForm.company}
                    onChange={(e) => setNewInvestorForm({...newInvestorForm, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="투자 회사명"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={newInvestorForm.email}
                    onChange={(e) => setNewInvestorForm({...newInvestorForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="이메일 주소"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                  <input
                    type="tel"
                    value={newInvestorForm.phone}
                    onChange={(e) => setNewInvestorForm({...newInvestorForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="전화번호 (선택사항)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                  <select
                    value={newInvestorForm.role}
                    onChange={(e) => setNewInvestorForm({...newInvestorForm, role: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="vc">VC</option>
                    <option value="angel">Angel Investor</option>
                    <option value="pe">PE</option>
                    <option value="corporate_vc">Corporate VC</option>
                    <option value="advisor">Advisor</option>
                    <option value="accelerator">Accelerator</option>
                    <option value="family_office">Family Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">펀드명 (선택사항)</label>
                  <input
                    type="text"
                    value={newInvestorForm.fundName}
                    onChange={(e) => setNewInvestorForm({...newInvestorForm, fundName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="펀드명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">웹사이트 (선택사항)</label>
                  <input
                    type="url"
                    value={newInvestorForm.website}
                    onChange={(e) => setNewInvestorForm({...newInvestorForm, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">메모 (선택사항)</label>
                  <textarea
                    value={newInvestorForm.notes}
                    onChange={(e) => setNewInvestorForm({...newInvestorForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="투자자에 대한 메모"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">관심도 점수</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              </form>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowAddLeadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 연락/미팅 모달 */}
      {showContactModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  연락 기록 추가
                </h3>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setSelectedLead(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연락 유형</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="email">이메일</option>
                    <option value="call">전화</option>
                    <option value="meeting">미팅</option>
                    <option value="message">메시지</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="연락 제목"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                    placeholder="연락 내용을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">결과</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="positive">긍정적</option>
                    <option value="neutral">중립적</option>
                    <option value="negative">부정적</option>
                  </select>
                </div>
              </form>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setSelectedLead(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    // TODO: 실제 연락 기록 추가 로직
                    setShowContactModal(false);
                    setSelectedLead(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorManagement;