/**
 * Mock Dashboard Server
 * 개발 및 테스트용 모의 서버 엔드포인트
 */

import type { DashboardLayout, UserProfile } from '../stores/dashboardLayoutStore';

// 모의 데이터 저장소
class MockDatabase {
  private layouts: Map<string, DashboardLayout> = new Map();
  private profiles: Map<string, UserProfile> = new Map();
  private users: Map<string, any> = new Map();

  constructor() {
    // 초기 샘플 데이터
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // 샘플 레이아웃
    const sampleLayout: DashboardLayout = {
      id: 'sample-layout-1',
      name: '샘플 대시보드',
      description: '서버 동기화 테스트용',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000,
      isDefault: false,
      layouts: {
        lg: [],
        md: [],
        sm: [],
        xs: [],
        xxs: []
      },
      widgets: {}
    };

    this.layouts.set(sampleLayout.id, sampleLayout);

    // 샘플 프로필
    const sampleProfile: UserProfile = {
      id: 'sample-profile-1',
      name: '테스트 프로필',
      role: 'developer',
      preferences: {
        theme: 'dark',
        language: 'ko',
        notifications: true,
        autoSave: true
      },
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000
    };

    this.profiles.set(sampleProfile.id, sampleProfile);
  }

  // 레이아웃 CRUD
  getLayouts(userId: string): DashboardLayout[] {
    // 실제로는 userId로 필터링
    return Array.from(this.layouts.values());
  }

  getLayout(layoutId: string): DashboardLayout | undefined {
    return this.layouts.get(layoutId);
  }

  saveLayout(layout: DashboardLayout): DashboardLayout {
    const saved = {
      ...layout,
      id: layout.id || `layout-${Date.now()}`,
      updatedAt: Date.now()
    };
    this.layouts.set(saved.id, saved);
    return saved;
  }

  updateLayout(layoutId: string, layout: DashboardLayout): DashboardLayout {
    const existing = this.layouts.get(layoutId);
    if (!existing) {
      throw new Error('Layout not found');
    }

    const updated = {
      ...layout,
      id: layoutId,
      updatedAt: Date.now()
    };
    this.layouts.set(layoutId, updated);
    return updated;
  }

  deleteLayout(layoutId: string): boolean {
    return this.layouts.delete(layoutId);
  }

  // 프로필 CRUD
  getProfiles(userId: string): UserProfile[] {
    return Array.from(this.profiles.values());
  }

  getProfile(profileId: string): UserProfile | undefined {
    return this.profiles.get(profileId);
  }

  saveProfile(profile: UserProfile): UserProfile {
    const saved = {
      ...profile,
      id: profile.id || `profile-${Date.now()}`,
      updatedAt: Date.now()
    };
    this.profiles.set(saved.id, saved);
    return saved;
  }

  updateProfile(profileId: string, profile: UserProfile): UserProfile {
    const existing = this.profiles.get(profileId);
    if (!existing) {
      throw new Error('Profile not found');
    }

    const updated = {
      ...profile,
      id: profileId,
      updatedAt: Date.now()
    };
    this.profiles.set(profileId, updated);
    return updated;
  }

  deleteProfile(profileId: string): boolean {
    return this.profiles.delete(profileId);
  }
}

// 모의 서버 인스턴스
const mockDb = new MockDatabase();

/**
 * 모의 API 응답 생성
 */
function createResponse<T>(data?: T, error?: string) {
  return {
    success: !error,
    data,
    error,
    timestamp: Date.now()
  };
}

/**
 * 네트워크 지연 시뮬레이션
 */
function simulateDelay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 모의 서버 API
 */
export class MockDashboardAPI {
  private static isOnline = true;
  private static errorRate = 0; // 0-1 사이의 값 (오류 발생 확률)

  /**
   * 온라인/오프라인 상태 설정
   */
  static setOnlineStatus(online: boolean) {
    this.isOnline = online;
    console.log(`Mock server is now ${online ? 'online' : 'offline'}`);
  }

  /**
   * 오류율 설정 (테스트용)
   */
  static setErrorRate(rate: number) {
    this.errorRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * 오류 시뮬레이션
   */
  private static shouldSimulateError(): boolean {
    return Math.random() < this.errorRate;
  }

  /**
   * 레이아웃 API
   */
  static async getLayouts(userId: string) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    if (this.shouldSimulateError()) {
      return createResponse(undefined, 'Server error');
    }

    const layouts = mockDb.getLayouts(userId);
    return createResponse(layouts);
  }

  static async getLayout(layoutId: string) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    const layout = mockDb.getLayout(layoutId);
    if (!layout) {
      return createResponse(undefined, 'Layout not found');
    }

    return createResponse(layout);
  }

  static async saveLayout(layout: DashboardLayout) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    if (this.shouldSimulateError()) {
      return createResponse(undefined, 'Failed to save layout');
    }

    const saved = mockDb.saveLayout(layout);
    return createResponse(saved);
  }

  static async updateLayout(layoutId: string, layout: DashboardLayout) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    try {
      const updated = mockDb.updateLayout(layoutId, layout);
      return createResponse(updated);
    } catch (error) {
      return createResponse(undefined, (error as Error).message);
    }
  }

  static async deleteLayout(layoutId: string) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    const deleted = mockDb.deleteLayout(layoutId);
    return createResponse(deleted);
  }

  /**
   * 프로필 API
   */
  static async getProfiles(userId: string) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    if (this.shouldSimulateError()) {
      return createResponse(undefined, 'Server error');
    }

    const profiles = mockDb.getProfiles(userId);
    return createResponse(profiles);
  }

  static async getProfile(profileId: string) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    const profile = mockDb.getProfile(profileId);
    if (!profile) {
      return createResponse(undefined, 'Profile not found');
    }

    return createResponse(profile);
  }

  static async saveProfile(profile: UserProfile) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    if (this.shouldSimulateError()) {
      return createResponse(undefined, 'Failed to save profile');
    }

    const saved = mockDb.saveProfile(profile);
    return createResponse(saved);
  }

  static async updateProfile(profileId: string, profile: UserProfile) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    try {
      const updated = mockDb.updateProfile(profileId, profile);
      return createResponse(updated);
    } catch (error) {
      return createResponse(undefined, (error as Error).message);
    }
  }

  static async deleteProfile(profileId: string) {
    await simulateDelay();

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    const deleted = mockDb.deleteProfile(profileId);
    return createResponse(deleted);
  }

  /**
   * 벌크 동기화
   */
  static async bulkSync(data: {
    layouts: DashboardLayout[];
    profiles: UserProfile[];
  }) {
    await simulateDelay(500);

    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    if (this.shouldSimulateError()) {
      return createResponse(undefined, 'Sync failed');
    }

    // 레이아웃 동기화
    const syncedLayouts = data.layouts.map(layout => {
      const existing = mockDb.getLayout(layout.id);
      if (!existing || layout.updatedAt > existing.updatedAt) {
        return mockDb.saveLayout(layout);
      }
      return existing;
    });

    // 프로필 동기화
    const syncedProfiles = data.profiles.map(profile => {
      const existing = mockDb.getProfile(profile.id);
      if (!existing || (profile.updatedAt && existing.updatedAt &&
                        profile.updatedAt > existing.updatedAt)) {
        return mockDb.saveProfile(profile);
      }
      return existing;
    });

    return createResponse({
      layouts: syncedLayouts,
      profiles: syncedProfiles,
      syncedAt: Date.now()
    });
  }

  /**
   * 충돌 감지
   */
  static async detectConflicts(data: {
    layouts: Array<{ id: string; updatedAt: number }>;
    profiles: Array<{ id: string; updatedAt: number }>;
  }) {
    await simulateDelay(200);

    const conflicts: any[] = [];

    // 레이아웃 충돌 확인
    data.layouts.forEach(local => {
      const server = mockDb.getLayout(local.id);
      if (server && server.updatedAt !== local.updatedAt) {
        conflicts.push({
          type: 'layout',
          id: local.id,
          localVersion: local.updatedAt,
          serverVersion: server.updatedAt
        });
      }
    });

    // 프로필 충돌 확인
    data.profiles.forEach(local => {
      const server = mockDb.getProfile(local.id);
      if (server && server.updatedAt !== local.updatedAt) {
        conflicts.push({
          type: 'profile',
          id: local.id,
          localVersion: local.updatedAt,
          serverVersion: server.updatedAt
        });
      }
    });

    return createResponse({
      hasConflicts: conflicts.length > 0,
      conflicts
    });
  }
}

// 개발 모드에서 전역 접근 가능하도록 설정
if (process.env.NODE_ENV === 'development') {
  (window as any).mockDashboardAPI = MockDashboardAPI;
  (window as any).mockDb = mockDb;

  console.log('Mock Dashboard API available at window.mockDashboardAPI');
}

export default MockDashboardAPI;