/**
 * Layout Version Manager
 * 레이아웃 버전 관리 및 히스토리 추적
 */

import type { DashboardLayout } from '../components/dashboard/grid/GridLayoutConfig';

export interface LayoutVersion {
  id: string;
  layoutId: string;
  version: string;
  snapshot: DashboardLayout;
  changes: LayoutChange[];
  author?: string;
  message?: string;
  timestamp: number;
  parentVersion?: string;
}

export interface LayoutChange {
  type: 'widget_added' | 'widget_removed' | 'widget_moved' | 'widget_resized' | 'widget_updated' | 'layout_renamed' | 'settings_changed';
  widgetId?: string;
  before?: any;
  after?: any;
  description: string;
}

export interface LayoutDiff {
  added: string[];
  removed: string[];
  modified: string[];
  moved: string[];
  resized: string[];
  details: LayoutChange[];
}

export class LayoutVersionManager {
  private static readonly VERSION_PREFIX = 'layout-version-';
  private static readonly VERSION_INDEX_KEY = 'layout-version-index';
  private static readonly MAX_VERSIONS_PER_LAYOUT = 20;

  /**
   * 새 버전 생성
   */
  static createVersion(
    layout: DashboardLayout,
    changes: LayoutChange[],
    message?: string,
    author?: string
  ): LayoutVersion {
    const version: LayoutVersion = {
      id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      layoutId: layout.id,
      version: this.generateVersionNumber(layout.id),
      snapshot: JSON.parse(JSON.stringify(layout)), // Deep clone
      changes,
      author,
      message,
      timestamp: Date.now(),
      parentVersion: this.getLatestVersion(layout.id)?.id
    };

    this.saveVersion(version);
    return version;
  }

  /**
   * 버전 저장
   */
  private static saveVersion(version: LayoutVersion): void {
    const key = `${this.VERSION_PREFIX}${version.id}`;
    localStorage.setItem(key, JSON.stringify(version));

    // 인덱스 업데이트
    const index = this.getVersionIndex();
    if (!index[version.layoutId]) {
      index[version.layoutId] = [];
    }
    index[version.layoutId].push({
      id: version.id,
      version: version.version,
      timestamp: version.timestamp
    });

    // 최대 버전 수 제한
    if (index[version.layoutId].length > this.MAX_VERSIONS_PER_LAYOUT) {
      const toRemove = index[version.layoutId].shift();
      if (toRemove) {
        localStorage.removeItem(`${this.VERSION_PREFIX}${toRemove.id}`);
      }
    }

    localStorage.setItem(this.VERSION_INDEX_KEY, JSON.stringify(index));
  }

  /**
   * 버전 불러오기
   */
  static loadVersion(versionId: string): LayoutVersion | null {
    const key = `${this.VERSION_PREFIX}${versionId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * 레이아웃의 모든 버전 가져오기
   */
  static getLayoutVersions(layoutId: string): LayoutVersion[] {
    const index = this.getVersionIndex();
    const versionRefs = index[layoutId] || [];
    const versions: LayoutVersion[] = [];

    for (const ref of versionRefs) {
      const version = this.loadVersion(ref.id);
      if (version) {
        versions.push(version);
      }
    }

    return versions.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 최신 버전 가져오기
   */
  static getLatestVersion(layoutId: string): LayoutVersion | null {
    const versions = this.getLayoutVersions(layoutId);
    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * 특정 버전으로 복원
   */
  static restoreVersion(versionId: string): DashboardLayout | null {
    const version = this.loadVersion(versionId);
    if (!version) return null;

    const restoredLayout: DashboardLayout = {
      ...version.snapshot,
      updatedAt: Date.now()
    };

    // 복원 버전 생성
    this.createVersion(
      restoredLayout,
      [{
        type: 'settings_changed',
        description: `Restored from version ${version.version}`,
        before: null,
        after: version.version
      }],
      `Restored from version ${version.version}`
    );

    return restoredLayout;
  }

  /**
   * 두 버전 간 차이 계산
   */
  static compareVersions(versionId1: string, versionId2: string): LayoutDiff | null {
    const version1 = this.loadVersion(versionId1);
    const version2 = this.loadVersion(versionId2);

    if (!version1 || !version2) return null;

    const layout1 = version1.snapshot;
    const layout2 = version2.snapshot;

    const diff: LayoutDiff = {
      added: [],
      removed: [],
      modified: [],
      moved: [],
      resized: [],
      details: []
    };

    // 위젯 비교
    const widgets1 = Object.keys(layout1.widgets);
    const widgets2 = Object.keys(layout2.widgets);

    // 추가된 위젯
    diff.added = widgets2.filter(id => !widgets1.includes(id));

    // 제거된 위젯
    diff.removed = widgets1.filter(id => !widgets2.includes(id));

    // 변경된 위젯
    for (const id of widgets1.filter(id => widgets2.includes(id))) {
      const widget1 = layout1.widgets[id];
      const widget2 = layout2.widgets[id];

      if (JSON.stringify(widget1) !== JSON.stringify(widget2)) {
        diff.modified.push(id);
        diff.details.push({
          type: 'widget_updated',
          widgetId: id,
          before: widget1,
          after: widget2,
          description: `Widget ${id} modified`
        });
      }

      // 위치/크기 변경 확인 (레이아웃에서)
      const layoutItem1 = layout1.layouts.lg?.find(item => item.i === id);
      const layoutItem2 = layout2.layouts.lg?.find(item => item.i === id);

      if (layoutItem1 && layoutItem2) {
        if (layoutItem1.x !== layoutItem2.x || layoutItem1.y !== layoutItem2.y) {
          diff.moved.push(id);
          diff.details.push({
            type: 'widget_moved',
            widgetId: id,
            before: { x: layoutItem1.x, y: layoutItem1.y },
            after: { x: layoutItem2.x, y: layoutItem2.y },
            description: `Widget ${id} moved`
          });
        }

        if (layoutItem1.w !== layoutItem2.w || layoutItem1.h !== layoutItem2.h) {
          diff.resized.push(id);
          diff.details.push({
            type: 'widget_resized',
            widgetId: id,
            before: { w: layoutItem1.w, h: layoutItem1.h },
            after: { w: layoutItem2.w, h: layoutItem2.h },
            description: `Widget ${id} resized`
          });
        }
      }
    }

    return diff;
  }

  /**
   * 버전 병합 (3-way merge)
   */
  static mergeVersions(
    baseVersionId: string,
    version1Id: string,
    version2Id: string
  ): DashboardLayout | null {
    const base = this.loadVersion(baseVersionId);
    const version1 = this.loadVersion(version1Id);
    const version2 = this.loadVersion(version2Id);

    if (!base || !version1 || !version2) return null;

    // 간단한 병합 전략: version2의 변경사항을 version1에 적용
    const merged: DashboardLayout = JSON.parse(JSON.stringify(version1.snapshot));

    // version2의 변경사항 적용
    const diff = this.compareVersions(baseVersionId, version2Id);
    if (diff) {
      // 추가된 위젯
      for (const widgetId of diff.added) {
        merged.widgets[widgetId] = version2.snapshot.widgets[widgetId];
        // 레이아웃에도 추가
        Object.keys(merged.layouts).forEach(breakpoint => {
          const layoutItem = version2.snapshot.layouts[breakpoint]?.find(item => item.i === widgetId);
          if (layoutItem) {
            merged.layouts[breakpoint].push(layoutItem);
          }
        });
      }

      // 수정된 위젯
      for (const widgetId of diff.modified) {
        if (merged.widgets[widgetId]) {
          merged.widgets[widgetId] = version2.snapshot.widgets[widgetId];
        }
      }
    }

    merged.updatedAt = Date.now();
    merged.name = `${merged.name} (Merged)`;

    return merged;
  }

  /**
   * 버전 번호 생성
   */
  private static generateVersionNumber(layoutId: string): string {
    const versions = this.getLayoutVersions(layoutId);
    const latestVersion = versions[0];

    if (!latestVersion) {
      return '1.0.0';
    }

    const [major, minor, patch] = latestVersion.version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * 버전 인덱스 가져오기
   */
  private static getVersionIndex(): Record<string, Array<{ id: string; version: string; timestamp: number }>> {
    const data = localStorage.getItem(this.VERSION_INDEX_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * 버전 히스토리 내보내기
   */
  static exportVersionHistory(layoutId: string): string {
    const versions = this.getLayoutVersions(layoutId);
    return JSON.stringify(versions, null, 2);
  }

  /**
   * 버전 히스토리 가져오기
   */
  static importVersionHistory(jsonString: string, layoutId: string): number {
    try {
      const versions = JSON.parse(jsonString) as LayoutVersion[];
      let imported = 0;

      for (const version of versions) {
        version.layoutId = layoutId;
        version.id = `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.saveVersion(version);
        imported++;
      }

      return imported;
    } catch (error) {
      console.error('Failed to import version history:', error);
      return 0;
    }
  }

  /**
   * 버전 정리 (오래된 버전 삭제)
   */
  static cleanupOldVersions(layoutId: string, keepCount: number = 10): number {
    const versions = this.getLayoutVersions(layoutId);
    let deleted = 0;

    if (versions.length > keepCount) {
      const toDelete = versions.slice(keepCount);

      for (const version of toDelete) {
        const key = `${this.VERSION_PREFIX}${version.id}`;
        localStorage.removeItem(key);
        deleted++;
      }

      // 인덱스 업데이트
      const index = this.getVersionIndex();
      index[layoutId] = versions.slice(0, keepCount).map(v => ({
        id: v.id,
        version: v.version,
        timestamp: v.timestamp
      }));
      localStorage.setItem(this.VERSION_INDEX_KEY, JSON.stringify(index));
    }

    return deleted;
  }

  /**
   * 버전 태그 추가
   */
  static tagVersion(versionId: string, tag: string): boolean {
    const version = this.loadVersion(versionId);
    if (!version) return false;

    version.message = `${version.message || ''} [${tag}]`;
    const key = `${this.VERSION_PREFIX}${version.id}`;
    localStorage.setItem(key, JSON.stringify(version));

    return true;
  }

  /**
   * 변경 사항 감지
   */
  static detectChanges(
    oldLayout: DashboardLayout,
    newLayout: DashboardLayout
  ): LayoutChange[] {
    const changes: LayoutChange[] = [];

    // 이름 변경 확인
    if (oldLayout.name !== newLayout.name) {
      changes.push({
        type: 'layout_renamed',
        before: oldLayout.name,
        after: newLayout.name,
        description: `Layout renamed from "${oldLayout.name}" to "${newLayout.name}"`
      });
    }

    // 위젯 변경 확인
    const oldWidgetIds = Object.keys(oldLayout.widgets);
    const newWidgetIds = Object.keys(newLayout.widgets);

    // 추가된 위젯
    const added = newWidgetIds.filter(id => !oldWidgetIds.includes(id));
    for (const id of added) {
      changes.push({
        type: 'widget_added',
        widgetId: id,
        after: newLayout.widgets[id],
        description: `Widget "${newLayout.widgets[id].title}" added`
      });
    }

    // 제거된 위젯
    const removed = oldWidgetIds.filter(id => !newWidgetIds.includes(id));
    for (const id of removed) {
      changes.push({
        type: 'widget_removed',
        widgetId: id,
        before: oldLayout.widgets[id],
        description: `Widget "${oldLayout.widgets[id].title}" removed`
      });
    }

    // 수정된 위젯
    for (const id of oldWidgetIds.filter(id => newWidgetIds.includes(id))) {
      if (JSON.stringify(oldLayout.widgets[id]) !== JSON.stringify(newLayout.widgets[id])) {
        changes.push({
          type: 'widget_updated',
          widgetId: id,
          before: oldLayout.widgets[id],
          after: newLayout.widgets[id],
          description: `Widget "${newLayout.widgets[id].title}" updated`
        });
      }
    }

    return changes;
  }
}