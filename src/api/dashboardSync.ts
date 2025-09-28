/**
 * Dashboard Sync API
 * 대시보드 레이아웃 및 프로필 서버 동기화
 */

import type { DashboardLayout, UserProfile } from '../stores/dashboardLayoutStore';

// API 엔드포인트
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const DASHBOARD_API = `${API_BASE_URL}/dashboard`;

/**
 * API 응답 타입
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

interface SyncStatus {
  lastSynced: number;
  pendingChanges: number;
  syncInProgress: boolean;
  conflicts: any[];
}

/**
 * 레이아웃 동기화 API
 */
export class LayoutSyncAPI {
  private static token?: string;
  private static userId?: string;

  /**
   * 인증 설정
   */
  static setAuth(token: string, userId: string) {
    this.token = token;
    this.userId = userId;
  }

  /**
   * API 요청 헤더
   */
  private static getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : '',
      'X-User-Id': this.userId || ''
    };
  }

  /**
   * 레이아웃 목록 가져오기
   */
  static async getLayouts(): Promise<DashboardLayout[]> {
    try {
      const response = await fetch(`${DASHBOARD_API}/layouts`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const result: ApiResponse<DashboardLayout[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch layouts');
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch layouts:', error);
      // 오프라인 모드에서는 빈 배열 반환
      return [];
    }
  }

  /**
   * 레이아웃 저장
   */
  static async saveLayout(layout: DashboardLayout): Promise<DashboardLayout> {
    try {
      const response = await fetch(`${DASHBOARD_API}/layouts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(layout)
      });

      const result: ApiResponse<DashboardLayout> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save layout');
      }

      return result.data!;
    } catch (error) {
      console.error('Failed to save layout:', error);
      // 오프라인 모드에서는 로컬 버전 반환
      return layout;
    }
  }

  /**
   * 레이아웃 업데이트
   */
  static async updateLayout(layout: DashboardLayout): Promise<DashboardLayout> {
    try {
      const response = await fetch(`${DASHBOARD_API}/layouts/${layout.id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(layout)
      });

      const result: ApiResponse<DashboardLayout> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update layout');
      }

      return result.data!;
    } catch (error) {
      console.error('Failed to update layout:', error);
      return layout;
    }
  }

  /**
   * 레이아웃 삭제
   */
  static async deleteLayout(layoutId: string): Promise<boolean> {
    try {
      const response = await fetch(`${DASHBOARD_API}/layouts/${layoutId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const result: ApiResponse<void> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to delete layout:', error);
      return false;
    }
  }
}

/**
 * 프로필 동기화 API
 */
export class ProfileSyncAPI {
  /**
   * 프로필 목록 가져오기
   */
  static async getProfiles(): Promise<UserProfile[]> {
    try {
      const response = await fetch(`${DASHBOARD_API}/profiles`, {
        method: 'GET',
        headers: LayoutSyncAPI['getHeaders']()
      });

      const result: ApiResponse<UserProfile[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profiles');
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
      return [];
    }
  }

  /**
   * 프로필 저장
   */
  static async saveProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      const response = await fetch(`${DASHBOARD_API}/profiles`, {
        method: 'POST',
        headers: LayoutSyncAPI['getHeaders'](),
        body: JSON.stringify(profile)
      });

      const result: ApiResponse<UserProfile> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save profile');
      }

      return result.data!;
    } catch (error) {
      console.error('Failed to save profile:', error);
      return profile;
    }
  }

  /**
   * 프로필 업데이트
   */
  static async updateProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      const response = await fetch(`${DASHBOARD_API}/profiles/${profile.id}`, {
        method: 'PUT',
        headers: LayoutSyncAPI['getHeaders'](),
        body: JSON.stringify(profile)
      });

      const result: ApiResponse<UserProfile> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      return result.data!;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return profile;
    }
  }

  /**
   * 프로필 삭제
   */
  static async deleteProfile(profileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${DASHBOARD_API}/profiles/${profileId}`, {
        method: 'DELETE',
        headers: LayoutSyncAPI['getHeaders']()
      });

      const result: ApiResponse<void> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to delete profile:', error);
      return false;
    }
  }
}

/**
 * 동기화 관리자
 */
export class SyncManager {
  private static syncInterval: NodeJS.Timeout | null = null;
  private static syncStatus: SyncStatus = {
    lastSynced: 0,
    pendingChanges: 0,
    syncInProgress: false,
    conflicts: []
  };

  /**
   * 자동 동기화 시작
   */
  static startAutoSync(intervalMs: number = 30000) {
    this.stopAutoSync();

    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, intervalMs);

    // 초기 동기화
    this.performSync();
  }

  /**
   * 자동 동기화 중지
   */
  static stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * 수동 동기화 실행
   */
  static async performSync(): Promise<SyncStatus> {
    if (this.syncStatus.syncInProgress) {
      console.log('Sync already in progress');
      return this.syncStatus;
    }

    this.syncStatus.syncInProgress = true;

    try {
      // 레이아웃 동기화
      const localLayouts = this.getLocalLayouts();
      const serverLayouts = await LayoutSyncAPI.getLayouts();

      const mergedLayouts = await this.mergeLayouts(localLayouts, serverLayouts);
      await this.saveLayouts(mergedLayouts);

      // 프로필 동기화
      const localProfiles = this.getLocalProfiles();
      const serverProfiles = await ProfileSyncAPI.getProfiles();

      const mergedProfiles = await this.mergeProfiles(localProfiles, serverProfiles);
      await this.saveProfiles(mergedProfiles);

      // 동기화 상태 업데이트
      this.syncStatus.lastSynced = Date.now();
      this.syncStatus.pendingChanges = 0;
      this.syncStatus.conflicts = [];

    } catch (error) {
      console.error('Sync failed:', error);
      this.syncStatus.conflicts.push({
        type: 'sync_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    } finally {
      this.syncStatus.syncInProgress = false;
    }

    return this.syncStatus;
  }

  /**
   * 로컬 레이아웃 가져오기
   */
  private static getLocalLayouts(): DashboardLayout[] {
    const stored = localStorage.getItem('dashboard_layouts');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * 로컬 프로필 가져오기
   */
  private static getLocalProfiles(): UserProfile[] {
    const stored = localStorage.getItem('dashboard_profiles');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * 레이아웃 병합
   */
  private static async mergeLayouts(
    local: DashboardLayout[],
    server: DashboardLayout[]
  ): Promise<DashboardLayout[]> {
    const merged = new Map<string, DashboardLayout>();

    // 서버 레이아웃 추가
    server.forEach(layout => {
      merged.set(layout.id, layout);
    });

    // 로컬 레이아웃 병합 (최신 버전 우선)
    local.forEach(localLayout => {
      const serverLayout = merged.get(localLayout.id);

      if (!serverLayout || localLayout.updatedAt > serverLayout.updatedAt) {
        merged.set(localLayout.id, localLayout);
      } else if (localLayout.updatedAt < serverLayout.updatedAt) {
        // 서버가 더 최신인 경우 충돌로 기록
        this.syncStatus.conflicts.push({
          type: 'layout_conflict',
          localVersion: localLayout,
          serverVersion: serverLayout,
          resolved: 'server' // 서버 버전 사용
        });
      }
    });

    return Array.from(merged.values());
  }

  /**
   * 프로필 병합
   */
  private static async mergeProfiles(
    local: UserProfile[],
    server: UserProfile[]
  ): Promise<UserProfile[]> {
    const merged = new Map<string, UserProfile>();

    // 서버 프로필 추가
    server.forEach(profile => {
      merged.set(profile.id, profile);
    });

    // 로컬 프로필 병합
    local.forEach(localProfile => {
      const serverProfile = merged.get(localProfile.id);

      if (!serverProfile ||
          (localProfile.updatedAt && serverProfile.updatedAt &&
           localProfile.updatedAt > serverProfile.updatedAt)) {
        merged.set(localProfile.id, localProfile);
      }
    });

    return Array.from(merged.values());
  }

  /**
   * 레이아웃 저장
   */
  private static async saveLayouts(layouts: DashboardLayout[]): Promise<void> {
    // 로컬 저장
    localStorage.setItem('dashboard_layouts', JSON.stringify(layouts));

    // 서버 저장 (변경된 항목만)
    for (const layout of layouts) {
      if (this.isLayoutModified(layout)) {
        await LayoutSyncAPI.updateLayout(layout);
      }
    }
  }

  /**
   * 프로필 저장
   */
  private static async saveProfiles(profiles: UserProfile[]): Promise<void> {
    // 로컬 저장
    localStorage.setItem('dashboard_profiles', JSON.stringify(profiles));

    // 서버 저장
    for (const profile of profiles) {
      if (this.isProfileModified(profile)) {
        await ProfileSyncAPI.updateProfile(profile);
      }
    }
  }

  /**
   * 레이아웃 변경 확인
   */
  private static isLayoutModified(layout: DashboardLayout): boolean {
    // TODO: 실제 변경 추적 구현
    return false;
  }

  /**
   * 프로필 변경 확인
   */
  private static isProfileModified(profile: UserProfile): boolean {
    // TODO: 실제 변경 추적 구현
    return false;
  }

  /**
   * 동기화 상태 가져오기
   */
  static getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * 충돌 해결
   */
  static resolveConflict(conflictId: string, resolution: 'local' | 'server') {
    // TODO: 충돌 해결 로직 구현
    console.log(`Resolving conflict ${conflictId} with ${resolution}`);
  }
}

// 싱글톤 내보내기
export const syncManager = SyncManager;