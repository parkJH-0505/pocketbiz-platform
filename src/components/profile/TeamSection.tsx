import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Briefcase,
  Mail,
  Linkedin,
  Twitter,
  Github,
  Link,
  Award,
  Star,
  Edit3,
  Plus,
  X,
  Check,
  Shield,
  Code,
  Palette,
  TrendingUp,
  DollarSign,
  UserCog,
  MoreVertical
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  role: 'founder' | 'c-level' | 'lead' | 'member';
  department?: 'development' | 'design' | 'marketing' | 'sales' | 'operations' | 'finance' | 'hr';
  imageUrl?: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  bio?: string;
  joinedDate?: string;
  isFounder?: boolean;
  achievements?: string[];
}

interface TeamSectionProps {
  viewMode: 'public' | 'investors' | 'team' | 'private';
  isEditing?: boolean;
}

const TeamSection: React.FC<TeamSectionProps> = ({ viewMode, isEditing = false }) => {
  const [localEditing, setLocalEditing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // 샘플 팀 데이터
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: '김철수',
      position: 'CEO & Co-founder',
      role: 'founder',
      department: 'operations',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      email: 'ceo@company.com',
      linkedin: 'linkedin.com/in/kimcs',
      bio: '10년간의 스타트업 경험을 바탕으로 혁신적인 솔루션을 만들어갑니다.',
      joinedDate: '2023-01',
      isFounder: true,
      achievements: ['Forbes 30 Under 30', '연쇄창업가']
    },
    {
      id: '2',
      name: '이영희',
      position: 'CTO & Co-founder',
      role: 'founder',
      department: 'development',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
      email: 'cto@company.com',
      github: 'github.com/leeyh',
      bio: 'AI/ML 전문가로 구글, 네이버에서 근무한 경험이 있습니다.',
      joinedDate: '2023-01',
      isFounder: true,
      achievements: ['Google Tech Lead 출신', 'AI 특허 3건']
    },
    {
      id: '3',
      name: '박민수',
      position: 'Head of Design',
      role: 'lead',
      department: 'design',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster',
      email: 'design@company.com',
      linkedin: 'linkedin.com/in/parkms',
      bio: '사용자 중심 디자인으로 제품의 가치를 높입니다.',
      joinedDate: '2023-06'
    }
  ]);

  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    position: '',
    role: 'member',
    department: 'development',
    email: '',
    bio: ''
  });

  // 부서별 아이콘
  const getDepartmentIcon = (dept?: string) => {
    const icons = {
      development: Code,
      design: Palette,
      marketing: TrendingUp,
      sales: DollarSign,
      operations: UserCog,
      finance: DollarSign,
      hr: Users
    };
    return icons[dept as keyof typeof icons] || Users;
  };

  // 역할별 색상
  const getRoleColor = (role: string) => {
    const colors = {
      founder: 'bg-purple-100 text-purple-700 border-purple-300',
      'c-level': 'bg-blue-100 text-blue-700 border-blue-300',
      lead: 'bg-green-100 text-green-700 border-green-300',
      member: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[role as keyof typeof colors] || colors.member;
  };

  // 팀 멤버 추가
  const handleAddMember = () => {
    if (newMember.name && newMember.position) {
      const member: TeamMember = {
        id: Date.now().toString(),
        name: newMember.name,
        position: newMember.position,
        role: newMember.role as TeamMember['role'],
        department: newMember.department as TeamMember['department'],
        email: newMember.email,
        bio: newMember.bio,
        imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMember.name}`,
        joinedDate: new Date().toISOString().slice(0, 7)
      };
      setTeamMembers([...teamMembers, member]);
      setNewMember({
        name: '',
        position: '',
        role: 'member',
        department: 'development',
        email: '',
        bio: ''
      });
      setShowAddMember(false);
    }
  };

  // 팀 멤버 삭제
  const handleRemoveMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  // 보기 모드에 따른 필터링
  const getVisibleMembers = () => {
    if (viewMode === 'public') {
      // 공개 모드: 창업자와 주요 리드만
      return teamMembers.filter(m => m.role === 'founder' || m.role === 'c-level');
    } else if (viewMode === 'investors') {
      // 투자자 모드: 모든 리더십
      return teamMembers.filter(m => m.role !== 'member');
    }
    // 팀/비공개 모드: 전체 표시
    return teamMembers;
  };

  const visibleMembers = getVisibleMembers();

  // 부서별 통계
  const departmentStats = teamMembers.reduce((acc, member) => {
    if (member.department) {
      acc[member.department] = (acc[member.department] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">팀 구성</h3>
              <p className="text-sm text-gray-600">
                총 {teamMembers.length}명 · {visibleMembers.length}명 표시
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {localEditing && (
              <button
                onClick={() => setShowAddMember(true)}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                멤버 추가
              </button>
            )}
            {localEditing ? (
              <button
                onClick={() => setLocalEditing(false)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setLocalEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 부서별 통계 (팀/비공개 모드) */}
        {(viewMode === 'team' || viewMode === 'private') && Object.keys(departmentStats).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(departmentStats).map(([dept, count]) => {
              const Icon = getDepartmentIcon(dept);
              return (
                <div key={dept} className="px-3 py-1.5 bg-gray-50 rounded-lg flex items-center gap-2">
                  <Icon className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 capitalize">{dept}</span>
                  <span className="text-xs font-medium text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 팀 멤버 그리드 */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleMembers.map((member) => (
            <div
              key={member.id}
              className={`relative group p-4 rounded-xl border transition-all hover:shadow-md ${
                selectedMember === member.id
                  ? 'border-blue-300 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
            >
              {/* 편집 모드 삭제 버튼 */}
              {localEditing && !member.isFounder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveMember(member.id);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              <div className="flex items-start gap-3">
                {/* 프로필 이미지 */}
                <div className="relative">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-12 h-12 rounded-full bg-gray-100"
                  />
                  {member.isFounder && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* 멤버 정보 */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{member.name}</h4>
                  <p className="text-sm text-gray-600 truncate">{member.position}</p>

                  {/* 역할 배지 */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                      {member.role === 'founder' && '창업자'}
                      {member.role === 'c-level' && 'C-Level'}
                      {member.role === 'lead' && 'Lead'}
                      {member.role === 'member' && 'Member'}
                    </span>
                    {member.department && (
                      <span className="text-xs text-gray-500 capitalize">{member.department}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 상세 정보 (선택됨) */}
              {selectedMember === member.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {member.bio && (
                    <p className="text-sm text-gray-700 mb-3">{member.bio}</p>
                  )}

                  {member.achievements && member.achievements.length > 0 && (
                    <div className="mb-3">
                      {member.achievements.map((achievement, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                          <Award className="w-3 h-3 text-yellow-500" />
                          <span>{achievement}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 연락처 (팀/비공개 모드) */}
                  {(viewMode === 'team' || viewMode === 'private') && (
                    <div className="flex flex-wrap gap-2">
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="text-gray-400 hover:text-gray-600">
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {member.linkedin && (
                        <a href={`https://${member.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {member.github && (
                        <a href={`https://${member.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-800">
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {member.twitter && (
                        <a href={`https://${member.twitter}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400">
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {member.joinedDate && (
                    <p className="text-xs text-gray-500 mt-2">
                      입사: {new Date(member.joinedDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* 빈 상태 */}
          {visibleMembers.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">표시할 팀 멤버가 없습니다</p>
              {localEditing && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  첫 멤버 추가하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 멤버 추가 모달 */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 팀 멤버 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="홍길동"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직책 *</label>
                <input
                  type="text"
                  value={newMember.position}
                  onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Senior Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as TeamMember['role'] })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="lead">Lead</option>
                  <option value="c-level">C-Level</option>
                  <option value="founder">Founder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                <select
                  value={newMember.department}
                  onChange={(e) => setNewMember({ ...newMember, department: e.target.value as TeamMember['department'] })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="development">Development</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                  <option value="sales">Sales</option>
                  <option value="operations">Operations</option>
                  <option value="finance">Finance</option>
                  <option value="hr">HR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="email@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소개</label>
                <textarea
                  value={newMember.bio}
                  onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="간단한 소개를 입력하세요..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setNewMember({
                    name: '',
                    position: '',
                    role: 'member',
                    department: 'development',
                    email: '',
                    bio: ''
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSection;