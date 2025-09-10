
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Shield, 
  Activity,
  Key,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import type { User, UserRole, UserStatus, ActivityLog, UserInvitation, UserStats } from '../../types/user';

// 더미 데이터
const dummyUsers: User[] = [
  {
    id: '1',
    email: 'admin@pocketbiz.com',
    name: '김관리',
    role: 'admin',
    status: 'active',
    organizationName: 'PocketBiz',
    department: '시스템 관리',
    position: '관리자',
    lastLoginAt: new Date('2024-03-20T10:30:00'),
    loginCount: 245,
    failedLoginAttempts: 0,
    mustChangePassword: false,
    assignedStartups: ['startup1', 'startup2', 'startup3'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-20')
  },
  {
    id: '2',
    email: 'manager@techcorp.com',
    name: '이매니저',
    role: 'manager',
    status: 'active',
    organizationName: 'TechCorp',
    department: '투자팀',
    position: '팀장',
    lastLoginAt: new Date('2024-03-19T14:20:00'),
    loginCount: 156,
    failedLoginAttempts: 0,
    mustChangePassword: false,
    assignedStartups: ['startup4', 'startup5'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-19')
  },
  {
    id: '3',
    email: 'user@startup.com',
    name: '박창업',
    role: 'user',
    status: 'active',
    organizationName: 'Startup Inc',
    department: '경영지원',
    position: '대표',
    lastLoginAt: new Date('2024-03-18T09:00:00'),
    loginCount: 89,
    failedLoginAttempts: 1,
    mustChangePassword: false,
    assignedStartups: ['startup6'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-18')
  },
  {
    id: '4',
    email: 'viewer@investor.com',
    name: '최투자',
    role: 'viewer',
    status: 'suspended',
    organizationName: 'Investor Group',
    department: '심사팀',
    position: '애널리스트',
    lastLoginAt: new Date('2024-03-10T11:30:00'),
    loginCount: 34,
    failedLoginAttempts: 5,
    mustChangePassword: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-15'),
    statusChangedAt: new Date('2024-03-15'),
    statusReason: '다중 로그인 실패'
  }
];

const dummyActivities: ActivityLog[] = [
  {
    id: '1',
    userId: '1',
    userName: '김관리',
    action: 'UPDATE',
    resource: 'user',
    resourceId: '3',
    details: '사용자 상태 변경: active',
    timestamp: new Date('2024-03-20T10:30:00'),
    status: 'success'
  },
  {
    id: '2',
    userId: '2',
    userName: '이매니저',
    action: 'CREATE',
    resource: 'evaluation',
    resourceId: 'eval1',
    details: '새 평가 생성',
    timestamp: new Date('2024-03-19T14:20:00'),
    status: 'success'
  },
  {
    id: '3',
    userId: '4',
    userName: '최투자',
    action: 'LOGIN',
    resource: 'session',
    details: '로그인 실패',
    timestamp: new Date('2024-03-15T11:00:00'),
    status: 'failure',
    errorMessage: '잘못된 비밀번호'
  }
];

const dummyInvitations: UserInvitation[] = [
  {
    id: '1',
    email: 'newuser@company.com',
    role: 'user',
    invitedBy: '김관리',
    invitedAt: new Date('2024-03-18'),
    expiresAt: new Date('2024-03-25'),
    status: 'pending',
    token: 'inv_token_123'
  },
  {
    id: '2',
    email: 'analyst@vc.com',
    role: 'viewer',
    invitedBy: '이매니저',
    invitedAt: new Date('2024-03-15'),
    acceptedAt: new Date('2024-03-16'),
    expiresAt: new Date('2024-03-22'),
    status: 'accepted',
    token: 'inv_token_456'
  }
];

const dummyStats: UserStats = {
  totalUsers: 143,
  activeUsers: 128,
  inactiveUsers: 10,
  suspendedUsers: 3,
  pendingUsers: 2,
  roleDistribution: {
    admin: 5,
    manager: 23,
    user: 89,
    viewer: 26
  },
  averageLoginFrequency: 4.2,
  lastDayActiveUsers: 67,
  lastWeekActiveUsers: 112,
  lastMonthActiveUsers: 128
};

const Users = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'activity' | 'invitations'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredUsers = dummyUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-50';
      case 'manager': return 'text-blue-600 bg-blue-50';
      case 'user': return 'text-green-600 bg-green-50';
      case 'viewer': return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'suspended': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-600 mt-2">시스템 사용자 및 권한 관리</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{dummyStats.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 사용자</p>
                <p className="text-2xl font-bold text-green-600">{dummyStats.activeUsers}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">정지 계정</p>
                <p className="text-2xl font-bold text-red-600">{dummyStats.suspendedUsers}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">오늘 접속</p>
                <p className="text-2xl font-bold text-blue-600">{dummyStats.lastDayActiveUsers}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                사용자 목록
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'roles'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                역할 및 권한
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'activity'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                활동 로그
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'invitations'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                초대 관리
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="이름 또는 이메일 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">모든 역할</option>
                    <option value="admin">관리자</option>
                    <option value="manager">매니저</option>
                    <option value="user">사용자</option>
                    <option value="viewer">뷰어</option>
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as UserStatus | 'all')}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">모든 상태</option>
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="suspended">정지</option>
                    <option value="pending">대기</option>
                  </select>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    사용자 초대
                  </button>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">사용자</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">역할</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">상태</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">조직</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">마지막 접속</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(user.status)}
                              <span className="text-sm capitalize">{user.status}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium">{user.organizationName}</p>
                              <p className="text-xs text-gray-500">{user.department}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-600">
                              {user.lastLoginAt?.toLocaleDateString('ko-KR')}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowEditModal(true);
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Edit2 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                {user.status === 'active' ? (
                                  <Lock className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <Unlock className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-6">
                {/* Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['admin', 'manager', 'user', 'viewer'] as UserRole[]).map(role => (
                    <div key={role} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getRoleColor(role).replace('text-', 'bg-').replace('-600', '-100')}`}>
                            <Shield className={`w-5 h-5 ${getRoleColor(role).split(' ')[0]}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold capitalize">{role}</h3>
                            <p className="text-sm text-gray-500">
                              {dummyStats.roleDistribution[role]} 사용자
                            </p>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                          권한 편집
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>모든 데이터 읽기</span>
                        </div>
                        {role === 'admin' && (
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>사용자 관리</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>시스템 설정</span>
                            </div>
                          </>
                        )}
                        {(role === 'admin' || role === 'manager') && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>데이터 수정</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Permission Matrix */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">권한 매트릭스</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">리소스</th>
                          <th className="text-center py-2 px-3">Admin</th>
                          <th className="text-center py-2 px-3">Manager</th>
                          <th className="text-center py-2 px-3">User</th>
                          <th className="text-center py-2 px-3">Viewer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { resource: '사용자 관리', permissions: ['CRUD', 'R', '-', '-'] },
                          { resource: 'KPI 관리', permissions: ['CRUD', 'CRUD', 'R', 'R'] },
                          { resource: '평가 데이터', permissions: ['CRUD', 'CRUD', 'CRU', 'R'] },
                          { resource: '프로그램 관리', permissions: ['CRUD', 'CRU', 'R', 'R'] },
                          { resource: '시스템 설정', permissions: ['CRUD', 'R', '-', '-'] },
                        ].map(item => (
                          <tr key={item.resource} className="border-b">
                            <td className="py-2 px-3 font-medium">{item.resource}</td>
                            {item.permissions.map((perm, idx) => (
                              <td key={idx} className="text-center py-2 px-3">
                                {perm === '-' ? (
                                  <span className="text-gray-400">-</span>
                                ) : (
                                  <span className="text-green-600 font-medium">{perm}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {/* Activity Filters */}
                <div className="flex gap-4 mb-4">
                  <select className="px-3 py-2 border rounded-lg text-sm">
                    <option>모든 활동</option>
                    <option>로그인</option>
                    <option>데이터 수정</option>
                    <option>권한 변경</option>
                  </select>
                  <select className="px-3 py-2 border rounded-lg text-sm">
                    <option>최근 24시간</option>
                    <option>최근 7일</option>
                    <option>최근 30일</option>
                  </select>
                  <button className="ml-auto px-4 py-2 border rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50">
                    <Download className="w-4 h-4" />
                    로그 내보내기
                  </button>
                </div>

                {/* Activity List */}
                <div className="space-y-2">
                  {dummyActivities.map(activity => (
                    <div key={activity.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            activity.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            {activity.status === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {activity.userName} - {activity.action} {activity.resource}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                            {activity.errorMessage && (
                              <p className="text-sm text-red-600 mt-1">{activity.errorMessage}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {activity.timestamp.toLocaleString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="space-y-4">
                {/* Invitation List */}
                {dummyInvitations.map(invitation => (
                  <div key={invitation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          invitation.status === 'pending' ? 'bg-yellow-50' : 'bg-green-50'
                        }`}>
                          <Mail className={`w-5 h-5 ${
                            invitation.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-gray-600">
                            역할: {invitation.role} | 초대자: {invitation.invitedBy}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            만료: {invitation.expiresAt.toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {invitation.status === 'pending' ? (
                          <>
                            <button className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50">
                              재전송
                            </button>
                            <button className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                              취소
                            </button>
                          </>
                        ) : (
                          <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg">
                            수락됨
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">사용자 초대</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 주소
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  역할
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="viewer">뷰어</option>
                  <option value="user">사용자</option>
                  <option value="manager">매니저</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  조직 (선택사항)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="조직명"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                초대 보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">사용자 정보 수정</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  defaultValue={selectedUser.name}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  defaultValue={selectedUser.email}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  역할
                </label>
                <select 
                  defaultValue={selectedUser.role}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">관리자</option>
                  <option value="manager">매니저</option>
                  <option value="user">사용자</option>
                  <option value="viewer">뷰어</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select 
                  defaultValue={selectedUser.status}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="suspended">정지</option>
                  <option value="pending">대기</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  조직
                </label>
                <input
                  type="text"
                  defaultValue={selectedUser.organizationName}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  부서
                </label>
                <input
                  type="text"
                  defaultValue={selectedUser.department}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked={selectedUser.mustChangePassword}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  다음 로그인 시 비밀번호 변경 필요
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;