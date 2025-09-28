/**
 * Layout Storage Utility
 * LocalStorage 레이아웃 저장/불러오기 유틸리티
 */

import type { DashboardLayout } from '../components/dashboard/grid/GridLayoutConfig';

const STORAGE_PREFIX = 'dashboard-layout-';
const LAYOUT_IDS_KEY = 'dashboard-layout-ids';
const PROFILES_KEY = 'dashboard-profiles';
const CURRENT_PROFILE_KEY = 'dashboard-current-profile';

export class LayoutStorage {
  /**
   * 레이아웃 저장
   */
  static saveLayout(layout: DashboardLayout): void {
    try {
      const key = `${STORAGE_PREFIX}${layout.id}`;
      localStorage.setItem(key, JSON.stringify(layout));

      // 레이아웃 ID 목록 업데이트
      const ids = this.getLayoutIds();
      if (!ids.includes(layout.id)) {
        ids.push(layout.id);
        localStorage.setItem(LAYOUT_IDS_KEY, JSON.stringify(ids));
      }

      console.log(`✅ Layout "${layout.name}" saved successfully`);
    } catch (error) {
      console.error('Failed to save layout:', error);
      throw new Error('레이아웃 저장 실패');
    }
  }

  /**
   * 레이아웃 불러오기
   */
  static loadLayout(layoutId: string): DashboardLayout | null {
    try {
      const key = `${STORAGE_PREFIX}${layoutId}`;
      const data = localStorage.getItem(key);

      if (!data) {
        console.warn(`Layout ${layoutId} not found`);
        return null;
      }

      return JSON.parse(data) as DashboardLayout;
    } catch (error) {
      console.error('Failed to load layout:', error);
      return null;
    }
  }

  /**
   * 모든 레이아웃 불러오기
   */
  static loadAllLayouts(): DashboardLayout[] {
    const ids = this.getLayoutIds();
    const layouts: DashboardLayout[] = [];

    for (const id of ids) {
      const layout = this.loadLayout(id);
      if (layout) {
        layouts.push(layout);
      }
    }

    return layouts.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 레이아웃 삭제
   */
  static deleteLayout(layoutId: string): boolean {
    try {
      const key = `${STORAGE_PREFIX}${layoutId}`;
      localStorage.removeItem(key);

      // ID 목록에서 제거
      const ids = this.getLayoutIds().filter(id => id !== layoutId);
      localStorage.setItem(LAYOUT_IDS_KEY, JSON.stringify(ids));

      console.log(`✅ Layout ${layoutId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Failed to delete layout:', error);
      return false;
    }
  }

  /**
   * 레이아웃 ID 목록 가져오기
   */
  static getLayoutIds(): string[] {
    try {
      const data = localStorage.getItem(LAYOUT_IDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * 레이아웃 존재 여부 확인
   */
  static hasLayout(layoutId: string): boolean {
    return this.getLayoutIds().includes(layoutId);
  }

  /**
   * 레이아웃 개수 가져오기
   */
  static getLayoutCount(): number {
    return this.getLayoutIds().length;
  }

  /**
   * 저장 공간 사용량 확인 (KB)
   */
  static getStorageUsage(): number {
    let totalSize = 0;
    const ids = this.getLayoutIds();

    for (const id of ids) {
      const key = `${STORAGE_PREFIX}${id}`;
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    }

    return Math.round(totalSize / 1024); // KB 단위
  }

  /**
   * 저장 공간 정리 (오래된 레이아웃 삭제)
   */
  static cleanupOldLayouts(keepCount: number = 10): number {
    const layouts = this.loadAllLayouts();
    let deletedCount = 0;

    if (layouts.length > keepCount) {
      // 오래된 순으로 정렬
      const toDelete = layouts
        .sort((a, b) => a.updatedAt - b.updatedAt)
        .slice(0, layouts.length - keepCount);

      for (const layout of toDelete) {
        if (this.deleteLayout(layout.id)) {
          deletedCount++;
        }
      }
    }

    console.log(`🧹 Cleaned up ${deletedCount} old layouts`);
    return deletedCount;
  }

  /**
   * 레이아웃 복제
   */
  static duplicateLayout(layoutId: string, newName?: string): DashboardLayout | null {
    const original = this.loadLayout(layoutId);
    if (!original) return null;

    const duplicated: DashboardLayout = {
      ...original,
      id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName || `${original.name} (복사본)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false
    };

    this.saveLayout(duplicated);
    return duplicated;
  }

  /**
   * 레이아웃 내보내기 (JSON)
   */
  static exportLayout(layoutId: string): string | null {
    const layout = this.loadLayout(layoutId);
    if (!layout) return null;

    return JSON.stringify(layout, null, 2);
  }

  /**
   * 레이아웃 가져오기 (JSON)
   */
  static importLayout(jsonString: string, overwriteId?: boolean): DashboardLayout | null {
    try {
      const layout = JSON.parse(jsonString) as DashboardLayout;

      // ID 중복 방지
      if (!overwriteId || this.hasLayout(layout.id)) {
        layout.id = `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      layout.createdAt = Date.now();
      layout.updatedAt = Date.now();
      layout.isDefault = false;

      this.saveLayout(layout);
      return layout;
    } catch (error) {
      console.error('Failed to import layout:', error);
      return null;
    }
  }

  /**
   * 모든 레이아웃 내보내기
   */
  static exportAll(): string {
    const layouts = this.loadAllLayouts();
    return JSON.stringify(layouts, null, 2);
  }

  /**
   * 여러 레이아웃 가져오기
   */
  static importMultiple(jsonString: string): number {
    try {
      const layouts = JSON.parse(jsonString) as DashboardLayout[];
      let importedCount = 0;

      for (const layout of layouts) {
        // 새 ID 할당
        layout.id = `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        layout.createdAt = Date.now();
        layout.updatedAt = Date.now();
        layout.isDefault = false;

        this.saveLayout(layout);
        importedCount++;
      }

      return importedCount;
    } catch (error) {
      console.error('Failed to import layouts:', error);
      return 0;
    }
  }

  /**
   * 백업 생성
   */
  static createBackup(): Blob {
    const backup = {
      version: '1.0.0',
      timestamp: Date.now(),
      layouts: this.loadAllLayouts(),
      profiles: this.loadProfiles(),
      currentProfile: this.getCurrentProfileId()
    };

    const json = JSON.stringify(backup, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * 백업 복원
   */
  static restoreBackup(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string);

          // 레이아웃 복원
          if (backup.layouts && Array.isArray(backup.layouts)) {
            for (const layout of backup.layouts) {
              this.saveLayout(layout);
            }
          }

          // 프로필 복원
          if (backup.profiles) {
            localStorage.setItem(PROFILES_KEY, JSON.stringify(backup.profiles));
          }

          // 현재 프로필 복원
          if (backup.currentProfile) {
            localStorage.setItem(CURRENT_PROFILE_KEY, backup.currentProfile);
          }

          console.log('✅ Backup restored successfully');
          resolve(true);
        } catch (error) {
          console.error('Failed to restore backup:', error);
          resolve(false);
        }
      };

      reader.readAsText(file);
    });
  }

  /**
   * 프로필 관련 메서드
   */
  static saveProfiles(profiles: any[]): void {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }

  static loadProfiles(): any[] {
    try {
      const data = localStorage.getItem(PROFILES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveCurrentProfileId(profileId: string): void {
    localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
  }

  static getCurrentProfileId(): string | null {
    return localStorage.getItem(CURRENT_PROFILE_KEY);
  }

  /**
   * 전체 초기화
   */
  static clearAll(): void {
    const ids = this.getLayoutIds();

    // 모든 레이아웃 삭제
    for (const id of ids) {
      this.deleteLayout(id);
    }

    // 프로필 및 설정 삭제
    localStorage.removeItem(PROFILES_KEY);
    localStorage.removeItem(CURRENT_PROFILE_KEY);
    localStorage.removeItem(LAYOUT_IDS_KEY);

    console.log('🗑️ All dashboard data cleared');
  }
}

// 자동 저장 매니저
export class AutoSaveManager {
  private timer: NodeJS.Timeout | null = null;
  private callback: (() => void) | null = null;
  private interval: number = 60000; // 기본 1분

  start(callback: () => void, interval?: number): void {
    this.stop(); // 기존 타이머 정리

    this.callback = callback;
    if (interval) this.interval = interval;

    this.timer = setInterval(() => {
      this.callback?.();
    }, this.interval);

    console.log(`⏱️ Auto-save started (interval: ${this.interval}ms)`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('⏹️ Auto-save stopped');
    }
  }

  trigger(): void {
    this.callback?.();
  }

  setInterval(interval: number): void {
    this.interval = interval;
    if (this.timer && this.callback) {
      this.start(this.callback, interval);
    }
  }

  isRunning(): boolean {
    return this.timer !== null;
  }
}