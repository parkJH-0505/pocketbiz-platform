import { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Edit2, Trash2, Calendar, Users,
  Filter, Search, Eye, Copy, Clock, CheckCircle,
  XCircle, AlertCircle, Tag, DollarSign, Building,
  ChevronDown, ChevronUp, MoreVertical, ExternalLink
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import type { 
  Program, 
  ProgramType, 
  ProgramStatus,
  ProgramBenefit,
  MatchingRule
} from '../../types/program';
import type { SectorType, StageType, AxisKey } from '../../types';

const Programs = () => {
  // 상태 관리
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProgramStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<ProgramType | 'all'>('all');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  // 초기 데이터 로드
  useEffect(() => {
    loadPrograms();
  }, []);

  // 필터링
  useEffect(() => {
    let filtered = [...programs];
    
    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // 타입 필터
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }
    
    setFilteredPrograms(filtered);
  }, [programs, searchTerm, filterStatus, filterType]);

  const loadPrograms = () => {
    // 샘플 데이터
    const samplePrograms: Program[] = [
      {
        id: '1',
        name: 'TIPS 프로그램',
        description: '기술창업 지원 프로그램',
        type: 'government',
        status: 'open',
        organizationId: 'tips',
        organizationName: '중소벤처기업부',
        applicationStartDate: new Date('2024-01-01'),
        applicationEndDate: new Date('2024-12-31'),
        targetCount: 100,
        currentApplications: 45,
        selectedCount: 0,
        eligibility: {
          minimumTotalScore: 70,
          allowedStages: ['A-2', 'A-3'],
          allowedSectors: ['S1', 'S2', 'S3']
        },
        benefits: [
          {
            id: '1',
            type: 'funding',
            title: '정부 지원금',
            description: '최대 5억원 지원',
            value: '5억원'
          },
          {
            id: '2',
            type: 'mentoring',
            title: '전문가 멘토링',
            description: '1년간 멘토링 지원',
            value: '12개월'
          }
        ],
        tags: ['정부지원', '기술창업', '자금지원'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin'
      },
      {
        id: '2',
        name: 'K-Startup 액셀러레이팅',
        description: '스타트업 액셀러레이팅 프로그램',
        type: 'accelerator',
        status: 'open',
        organizationId: 'kstartup',
        organizationName: 'K-Startup',
        applicationStartDate: new Date('2024-02-01'),
        applicationEndDate: new Date('2024-02-28'),
        programStartDate: new Date('2024-03-01'),
        programEndDate: new Date('2024-08-31'),
        targetCount: 20,
        currentApplications: 156,
        selectedCount: 0,
        eligibility: {
          minimumTotalScore: 60,
          minimumAxisScores: {
            GO: 65,
            PT: 60
          },
          allowedStages: ['A-1', 'A-2']
        },
        benefits: [
          {
            id: '1',
            type: 'funding',
            title: '시드 투자',
            description: '최대 1억원 투자',
            value: '1억원'
          },
          {
            id: '2',
            type: 'office',
            title: '사무실 제공',
            description: '6개월 무료 입주',
            value: '6개월'
          },
          {
            id: '3',
            type: 'network',
            title: '네트워킹',
            description: '투자자 연결 및 데모데이',
            value: ''
          }
        ],
        matchingRules: [
          {
            id: '1',
            name: '성장 잠재력',
            priority: 1,
            condition: 'GO > 70',
            weight: 2.0,
            autoMatch: true
          }
        ],
        tags: ['액셀러레이터', '시드투자', '멘토링'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin'
      }
    ];
    
    setPrograms(samplePrograms);
  };

  // 프로그램 상태별 색상
  const getStatusColor = (status: ProgramStatus) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 프로그램 타입별 아이콘
  const getTypeIcon = (type: ProgramType) => {
    switch (type) {
      case 'investment': return DollarSign;
      case 'accelerator': return Users;
      case 'government': return Building;
      case 'corporate': return Briefcase;
      default: return Tag;
    }
  };

  // 프로그램 확장 토글
  const toggleProgramExpansion = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  // 날짜 포맷
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 모집 상태 계산
  const getApplicationStatus = (program: Program) => {
    const now = new Date();
    const start = new Date(program.applicationStartDate);
    const end = new Date(program.applicationEndDate);
    
    if (now < start) {
      const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { status: 'upcoming', text: `${daysUntil}일 후 시작`, color: 'text-blue-600' };
    } else if (now > end) {
      return { status: 'ended', text: '모집 종료', color: 'text-gray-600' };
    } else {
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { status: 'active', text: `${daysLeft}일 남음`, color: 'text-green-600' };
    }
  };

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-dark">프로그램 관리</h1>
            <p className="text-sm text-neutral-gray mt-1">
              투자 및 지원 프로그램을 등록하고 관리합니다
            </p>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            프로그램 등록
          </Button>
        </div>

        {/* 필터 바 */}
        <div className="bg-white p-4 rounded-lg border border-neutral-border">
          <div className="flex gap-4 items-center">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-gray" size={20} />
              <input
                type="text"
                placeholder="프로그램명, 기관명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
              />
            </div>

            {/* 상태 필터 */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
            >
              <option value="all">모든 상태</option>
              <option value="open">모집중</option>
              <option value="closed">마감</option>
              <option value="draft">준비중</option>
              <option value="suspended">중단</option>
            </select>

            {/* 타입 필터 */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
            >
              <option value="all">모든 타입</option>
              <option value="investment">투자</option>
              <option value="accelerator">액셀러레이터</option>
              <option value="government">정부지원</option>
              <option value="corporate">기업</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* 통계 */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-neutral-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-neutral-gray">
                모집중: {programs.filter(p => p.status === 'open').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-sm text-neutral-gray">
                마감: {programs.filter(p => p.status === 'closed').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-neutral-gray" />
              <span className="text-sm text-neutral-gray">
                총 지원: {programs.reduce((sum, p) => sum + (p.currentApplications || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 프로그램 목록 */}
      <div className="space-y-4">
        {filteredPrograms.map(program => {
          const TypeIcon = getTypeIcon(program.type);
          const applicationStatus = getApplicationStatus(program);
          const isExpanded = expandedPrograms.has(program.id);
          
          return (
            <div key={program.id} className="bg-white rounded-lg border border-neutral-border overflow-hidden">
              {/* 프로그램 헤더 */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {/* 아이콘 */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <TypeIcon size={24} className="text-neutral-dark" />
                    </div>
                    
                    {/* 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-dark">
                          {program.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                          {program.status === 'open' ? '모집중' :
                           program.status === 'closed' ? '마감' :
                           program.status === 'draft' ? '준비중' : '중단'}
                        </span>
                        <span className={`text-sm font-medium ${applicationStatus.color}`}>
                          {applicationStatus.text}
                        </span>
                      </div>
                      
                      <p className="text-sm text-neutral-gray mb-2">
                        {program.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-neutral-gray">
                        <span className="flex items-center gap-1">
                          <Building size={14} />
                          {program.organizationName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(program.applicationStartDate)} ~ {formatDate(program.applicationEndDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          지원: {program.currentApplications || 0} / 모집: {program.targetCount || '-'}
                        </span>
                      </div>

                      {/* 태그 */}
                      {program.tags && program.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {program.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleProgramExpansion(program.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProgram(program);
                        setShowDetailModal(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit2 size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 확장 섹션 */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-0 border-t border-neutral-border">
                  <div className="grid grid-cols-3 gap-6 mt-4">
                    {/* 자격 요건 */}
                    <div>
                      <h4 className="font-medium text-neutral-dark mb-3">자격 요건</h4>
                      <div className="space-y-2 text-sm">
                        {program.eligibility.minimumTotalScore && (
                          <div className="flex items-center gap-2">
                            <Target size={14} className="text-neutral-gray" />
                            <span>최소 점수: {program.eligibility.minimumTotalScore}점</span>
                          </div>
                        )}
                        {program.eligibility.allowedStages && (
                          <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-neutral-gray" />
                            <span>대상 단계: {program.eligibility.allowedStages.join(', ')}</span>
                          </div>
                        )}
                        {program.eligibility.allowedSectors && (
                          <div className="flex items-center gap-2">
                            <Tag size={14} className="text-neutral-gray" />
                            <span>대상 섹터: {program.eligibility.allowedSectors.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 혜택 */}
                    <div>
                      <h4 className="font-medium text-neutral-dark mb-3">제공 혜택</h4>
                      <div className="space-y-2">
                        {program.benefits.map(benefit => (
                          <div key={benefit.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              {benefit.type === 'funding' && <DollarSign size={14} className="text-green-600" />}
                              {benefit.type === 'mentoring' && <Users size={14} className="text-blue-600" />}
                              {benefit.type === 'office' && <Building size={14} className="text-purple-600" />}
                              <span className="font-medium">{benefit.title}</span>
                              {benefit.value && (
                                <span className="text-primary-main">({benefit.value})</span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-gray ml-5">{benefit.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 진행 현황 */}
                    <div>
                      <h4 className="font-medium text-neutral-dark mb-3">진행 현황</h4>
                      <div className="space-y-3">
                        {/* 지원율 */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>지원율</span>
                            <span className="font-medium">
                              {program.targetCount 
                                ? Math.round((program.currentApplications || 0) / program.targetCount * 100) 
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-main h-2 rounded-full"
                              style={{ 
                                width: `${program.targetCount 
                                  ? Math.min(100, (program.currentApplications || 0) / program.targetCount * 100) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>

                        {/* 기간 진행률 */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>모집 기간</span>
                            <span className="font-medium">
                              {(() => {
                                const now = new Date();
                                const start = new Date(program.applicationStartDate);
                                const end = new Date(program.applicationEndDate);
                                const total = end.getTime() - start.getTime();
                                const elapsed = now.getTime() - start.getTime();
                                return Math.round(Math.min(100, Math.max(0, elapsed / total * 100)));
                              })()}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ 
                                width: `${(() => {
                                  const now = new Date();
                                  const start = new Date(program.applicationStartDate);
                                  const end = new Date(program.applicationEndDate);
                                  const total = end.getTime() - start.getTime();
                                  const elapsed = now.getTime() - start.getTime();
                                  return Math.min(100, Math.max(0, elapsed / total * 100));
                                })()}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 빈 상태 */}
      {filteredPrograms.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-border p-12 text-center">
          <Briefcase className="mx-auto text-neutral-lighter mb-4" size={48} />
          <p className="text-neutral-gray">등록된 프로그램이 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default Programs;