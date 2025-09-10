// 사용자 역할
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

// 사용자 상태
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// 권한 정의
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// 역할 정의
export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  isDefault?: boolean;
}

// 사용자 정보
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  
  // 조직 정보
  organizationId?: string;
  organizationName?: string;
  department?: string;
  position?: string;
  
  // 계정 정보
  profileImage?: string;
  phoneNumber?: string;
  lastLoginAt?: Date;
  loginCount: number;
  failedLoginAttempts: number;
  passwordChangedAt?: Date;
  mustChangePassword: boolean;
  
  // 권한
  customPermissions?: Permission[];
  
  // 담당 스타트업
  assignedStartups?: string[];
  
  // 메타 정보
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  statusChangedAt?: Date;
  statusChangedBy?: string;
  statusReason?: string;
}

// 활동 로그
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'success' | 'failure';
  errorMessage?: string;
}

// 세션 정보
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

// 사용자 초대
export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: Date;
  acceptedAt?: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  organizationId?: string;
}

// 사용자 통계
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  roleDistribution: Record<UserRole, number>;
  averageLoginFrequency: number;
  lastDayActiveUsers: number;
  lastWeekActiveUsers: number;
  lastMonthActiveUsers: number;
}

// 권한 체크 결과
export interface PermissionCheck {
  userId: string;
  resource: string;
  action: string;
  allowed: boolean;
  reason?: string;
  checkedAt: Date;
}