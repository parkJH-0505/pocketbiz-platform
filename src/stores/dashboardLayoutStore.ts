/**
 * Dashboard Layout Store
 * 대시보드 레이아웃 상태 관리 (Zustand)
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Layout, Layouts } from 'react-grid-layout';
import type { DashboardLayout, WidgetConfig, GridLayoutItem } from '../components/dashboard/grid/GridLayoutConfig';

// 레이아웃 히스토리 아이템
interface LayoutHistoryItem {
  id: string;
  layout: DashboardLayout;
  timestamp: number;
  action: 'save' | 'load' | 'import' | 'reset' | 'undo' | 'redo';
  description?: string;
}

// 사용자 프로필
export interface UserProfile {
  id: string;
  name: string;
  role: 'developer' | 'pm' | 'ceo' | 'custom';
  avatar?: string;
  defaultLayoutId?: string;
  preferences: {
    autoSave: boolean;
    saveInterval: number; // ms
    maxHistoryItems: number;
    theme?: 'light' | 'dark' | 'auto';
    compactMode: boolean;
  };
  permissions: string[];
  createdAt: number;
  updatedAt: number;
}

// Store 상태 인터페이스
interface DashboardLayoutState {
  // 현재 레이아웃
  currentLayout: DashboardLayout | null;
  layouts: DashboardLayout[];

  // 위젯
  widgets: Record<string, WidgetConfig>;

  // 히스토리
  history: LayoutHistoryItem[];
  historyIndex: number;
  maxHistorySize: number;

  // 사용자 프로필
  currentProfile: UserProfile | null;
  profiles: UserProfile[];

  // UI 상태
  isEditMode: boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: number | null;
  error: string | null;

  // 설정
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
}

// Store 액션 인터페이스
interface DashboardLayoutActions {
  // 레이아웃 관리
  saveLayout: (name?: string, description?: string) => Promise<void>;
  loadLayout: (layoutId: string) => Promise<void>;
  deleteLayout: (layoutId: string) => Promise<void>;
  duplicateLayout: (layoutId: string, newName: string) => Promise<void>;
  renameLayout: (layoutId: string, newName: string) => Promise<void>;
  setCurrentLayout: (layout: DashboardLayout) => void;
  updateLayoutGrid: (layouts: Layouts) => void;

  // 위젯 관리
  addWidget: (widget: WidgetConfig, position?: Partial<Layout>) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  reorderWidgets: (widgetIds: string[]) => void;

  // 히스토리 관리
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  addToHistory: (action: LayoutHistoryItem['action'], description?: string) => void;

  // 프로필 관리
  setProfile: (profileId: string) => Promise<void>;
  createProfile: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfile: (profileId: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;

  // Import/Export
  exportLayout: (layoutId?: string) => string;
  importLayout: (jsonString: string) => Promise<void>;
  exportAllLayouts: () => string;
  importLayouts: (jsonString: string) => Promise<void>;

  // UI 상태
  setEditMode: (isEdit: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setError: (error: string | null) => void;

  // 유틸리티
  resetToDefault: () => void;
  syncWithServer: () => Promise<void>;
  validateLayout: (layout: DashboardLayout) => boolean;
}

type DashboardLayoutStore = DashboardLayoutState & DashboardLayoutActions;

// 기본 프로필 생성
const createDefaultProfiles = (): UserProfile[] => [
  {
    id: 'developer-default',
    name: '개발자',
    role: 'developer',
    preferences: {
      autoSave: true,
      saveInterval: 30000,
      maxHistoryItems: 50,
      compactMode: false
    },
    permissions: ['edit', 'delete', 'export', 'import'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'pm-default',
    name: 'PM',
    role: 'pm',
    preferences: {
      autoSave: true,
      saveInterval: 60000,
      maxHistoryItems: 30,
      compactMode: false
    },
    permissions: ['edit', 'export'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'ceo-default',
    name: 'CEO',
    role: 'ceo',
    preferences: {
      autoSave: true,
      saveInterval: 120000,
      maxHistoryItems: 20,
      compactMode: true
    },
    permissions: ['view', 'export'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// Store 생성
export const useDashboardLayoutStore = create<DashboardLayoutStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        immer((set, get) => ({
          // 초기 상태
          currentLayout: null,
          layouts: [],
          widgets: {},
          history: [],
          historyIndex: -1,
          maxHistorySize: 50,
          currentProfile: null,
          profiles: createDefaultProfiles(),
          isEditMode: false,
          isSaving: false,
          isLoading: false,
          lastSaved: null,
          error: null,
          autoSaveEnabled: true,
          autoSaveInterval: 60000,

          // 레이아웃 저장
          saveLayout: async (name, description) => {
            set(state => {
              state.isSaving = true;
              state.error = null;
            });

            try {
              const currentLayout = get().currentLayout;
              if (!currentLayout) {
                throw new Error('No layout to save');
              }

              const layoutToSave: DashboardLayout = {
                ...currentLayout,
                name: name || currentLayout.name,
                description: description || currentLayout.description,
                updatedAt: Date.now()
              };

              // LocalStorage에 저장
              const storageKey = `dashboard-layout-${layoutToSave.id}`;
              localStorage.setItem(storageKey, JSON.stringify(layoutToSave));

              // Store 업데이트
              set(state => {
                const existingIndex = state.layouts.findIndex(l => l.id === layoutToSave.id);
                if (existingIndex >= 0) {
                  state.layouts[existingIndex] = layoutToSave;
                } else {
                  state.layouts.push(layoutToSave);
                }
                state.currentLayout = layoutToSave;
                state.lastSaved = Date.now();
                state.isSaving = false;
              });

              // 히스토리 추가
              get().addToHistory('save', `Layout "${layoutToSave.name}" saved`);

              // 레이아웃 목록 저장
              const layoutIds = get().layouts.map(l => l.id);
              localStorage.setItem('dashboard-layout-ids', JSON.stringify(layoutIds));

            } catch (error) {
              set(state => {
                state.error = error instanceof Error ? error.message : 'Save failed';
                state.isSaving = false;
              });
              throw error;
            }
          },

          // 레이아웃 불러오기
          loadLayout: async (layoutId) => {
            set(state => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const storageKey = `dashboard-layout-${layoutId}`;
              const layoutJson = localStorage.getItem(storageKey);

              if (!layoutJson) {
                throw new Error(`Layout ${layoutId} not found`);
              }

              const layout = JSON.parse(layoutJson) as DashboardLayout;

              set(state => {
                state.currentLayout = layout;
                state.widgets = layout.widgets;
                state.isLoading = false;
              });

              get().addToHistory('load', `Layout "${layout.name}" loaded`);

            } catch (error) {
              set(state => {
                state.error = error instanceof Error ? error.message : 'Load failed';
                state.isLoading = false;
              });
              throw error;
            }
          },

          // 레이아웃 삭제
          deleteLayout: async (layoutId) => {
            try {
              // LocalStorage에서 삭제
              localStorage.removeItem(`dashboard-layout-${layoutId}`);

              set(state => {
                state.layouts = state.layouts.filter(l => l.id !== layoutId);
                if (state.currentLayout?.id === layoutId) {
                  state.currentLayout = null;
                }
              });

              // 레이아웃 목록 업데이트
              const layoutIds = get().layouts.map(l => l.id);
              localStorage.setItem('dashboard-layout-ids', JSON.stringify(layoutIds));

            } catch (error) {
              set(state => {
                state.error = error instanceof Error ? error.message : 'Delete failed';
              });
              throw error;
            }
          },

          // 레이아웃 복제
          duplicateLayout: async (layoutId, newName) => {
            const layout = get().layouts.find(l => l.id === layoutId);
            if (!layout) {
              throw new Error(`Layout ${layoutId} not found`);
            }

            const duplicated: DashboardLayout = {
              ...layout,
              id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: newName,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };

            await get().saveLayout(duplicated.name, duplicated.description);
          },

          // 레이아웃 이름 변경
          renameLayout: async (layoutId, newName) => {
            const layout = get().layouts.find(l => l.id === layoutId);
            if (!layout) {
              throw new Error(`Layout ${layoutId} not found`);
            }

            const updated = { ...layout, name: newName, updatedAt: Date.now() };
            await get().saveLayout(updated.name, updated.description);
          },

          // 현재 레이아웃 설정
          setCurrentLayout: (layout) => {
            set(state => {
              state.currentLayout = layout;
              state.widgets = layout.widgets;
            });
          },

          // 그리드 레이아웃 업데이트
          updateLayoutGrid: (layouts) => {
            set(state => {
              if (state.currentLayout) {
                state.currentLayout.layouts = layouts;
                state.currentLayout.updatedAt = Date.now();
              }
            });
          },

          // 위젯 추가
          addWidget: (widget, position) => {
            set(state => {
              state.widgets[widget.id] = widget;

              if (state.currentLayout && position) {
                // 모든 브레이크포인트에 위젯 추가
                Object.keys(state.currentLayout.layouts).forEach(breakpoint => {
                  state.currentLayout!.layouts[breakpoint].push({
                    i: widget.id,
                    ...position
                  } as Layout);
                });
              }
            });
          },

          // 위젯 제거
          removeWidget: (widgetId) => {
            set(state => {
              delete state.widgets[widgetId];

              if (state.currentLayout) {
                Object.keys(state.currentLayout.layouts).forEach(breakpoint => {
                  state.currentLayout!.layouts[breakpoint] =
                    state.currentLayout!.layouts[breakpoint].filter(item => item.i !== widgetId);
                });
              }
            });
          },

          // 위젯 업데이트
          updateWidget: (widgetId, updates) => {
            set(state => {
              if (state.widgets[widgetId]) {
                state.widgets[widgetId] = {
                  ...state.widgets[widgetId],
                  ...updates
                };
              }
            });
          },

          // 위젯 순서 변경
          reorderWidgets: (widgetIds) => {
            // 구현 예정
          },

          // 실행 취소
          undo: () => {
            const { history, historyIndex } = get();
            if (historyIndex > 0) {
              const previousItem = history[historyIndex - 1];
              // 이전 상태로 복원
              set(state => {
                state.historyIndex = historyIndex - 1;
                state.currentLayout = previousItem.layout;
              });
            }
          },

          // 다시 실행
          redo: () => {
            const { history, historyIndex } = get();
            if (historyIndex < history.length - 1) {
              const nextItem = history[historyIndex + 1];
              // 다음 상태로 복원
              set(state => {
                state.historyIndex = historyIndex + 1;
                state.currentLayout = nextItem.layout;
              });
            }
          },

          // 히스토리 초기화
          clearHistory: () => {
            set(state => {
              state.history = [];
              state.historyIndex = -1;
            });
          },

          // 히스토리에 추가
          addToHistory: (action, description) => {
            const { currentLayout, history, historyIndex, maxHistorySize } = get();
            if (!currentLayout) return;

            const historyItem: LayoutHistoryItem = {
              id: `history-${Date.now()}`,
              layout: currentLayout,
              timestamp: Date.now(),
              action,
              description
            };

            set(state => {
              // 현재 위치 이후의 히스토리 제거
              state.history = history.slice(0, historyIndex + 1);

              // 새 아이템 추가
              state.history.push(historyItem);

              // 최대 크기 제한
              if (state.history.length > maxHistorySize) {
                state.history = state.history.slice(-maxHistorySize);
              }

              state.historyIndex = state.history.length - 1;
            });
          },

          // 프로필 설정
          setProfile: async (profileId) => {
            const profile = get().profiles.find(p => p.id === profileId);
            if (!profile) {
              throw new Error(`Profile ${profileId} not found`);
            }

            set(state => {
              state.currentProfile = profile;
              state.autoSaveEnabled = profile.preferences.autoSave;
              state.autoSaveInterval = profile.preferences.saveInterval;
              state.maxHistorySize = profile.preferences.maxHistoryItems;
            });

            // 프로필의 기본 레이아웃 로드
            if (profile.defaultLayoutId) {
              await get().loadLayout(profile.defaultLayoutId);
            }
          },

          // 프로필 생성
          createProfile: async (profileData) => {
            const newProfile: UserProfile = {
              ...profileData,
              id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };

            set(state => {
              state.profiles.push(newProfile);
            });

            // LocalStorage에 저장
            localStorage.setItem('dashboard-profiles', JSON.stringify(get().profiles));
          },

          // 프로필 업데이트
          updateProfile: async (profileId, updates) => {
            set(state => {
              const index = state.profiles.findIndex(p => p.id === profileId);
              if (index >= 0) {
                state.profiles[index] = {
                  ...state.profiles[index],
                  ...updates,
                  updatedAt: Date.now()
                };
              }
            });

            localStorage.setItem('dashboard-profiles', JSON.stringify(get().profiles));
          },

          // 프로필 삭제
          deleteProfile: async (profileId) => {
            set(state => {
              state.profiles = state.profiles.filter(p => p.id !== profileId);
              if (state.currentProfile?.id === profileId) {
                state.currentProfile = null;
              }
            });

            localStorage.setItem('dashboard-profiles', JSON.stringify(get().profiles));
          },

          // 레이아웃 내보내기
          exportLayout: (layoutId) => {
            const layout = layoutId
              ? get().layouts.find(l => l.id === layoutId)
              : get().currentLayout;

            if (!layout) {
              throw new Error('No layout to export');
            }

            return JSON.stringify(layout, null, 2);
          },

          // 레이아웃 가져오기
          importLayout: async (jsonString) => {
            try {
              const layout = JSON.parse(jsonString) as DashboardLayout;

              // 유효성 검증
              if (!get().validateLayout(layout)) {
                throw new Error('Invalid layout format');
              }

              // 새 ID 할당 (중복 방지)
              layout.id = `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              layout.createdAt = Date.now();
              layout.updatedAt = Date.now();

              await get().saveLayout(layout.name, layout.description);
              get().addToHistory('import', `Layout "${layout.name}" imported`);

            } catch (error) {
              set(state => {
                state.error = error instanceof Error ? error.message : 'Import failed';
              });
              throw error;
            }
          },

          // 모든 레이아웃 내보내기
          exportAllLayouts: () => {
            return JSON.stringify(get().layouts, null, 2);
          },

          // 여러 레이아웃 가져오기
          importLayouts: async (jsonString) => {
            try {
              const layouts = JSON.parse(jsonString) as DashboardLayout[];

              for (const layout of layouts) {
                if (get().validateLayout(layout)) {
                  layout.id = `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  layout.createdAt = Date.now();
                  layout.updatedAt = Date.now();
                  await get().saveLayout(layout.name, layout.description);
                }
              }

            } catch (error) {
              set(state => {
                state.error = error instanceof Error ? error.message : 'Import failed';
              });
              throw error;
            }
          },

          // 편집 모드 설정
          setEditMode: (isEdit) => {
            set(state => {
              state.isEditMode = isEdit;
            });
          },

          // 자동 저장 설정
          setAutoSave: (enabled) => {
            set(state => {
              state.autoSaveEnabled = enabled;
            });
          },

          // 에러 설정
          setError: (error) => {
            set(state => {
              state.error = error;
            });
          },

          // 기본값으로 초기화
          resetToDefault: () => {
            set(state => {
              state.currentLayout = null;
              state.layouts = [];
              state.widgets = {};
              state.history = [];
              state.historyIndex = -1;
              state.isEditMode = false;
              state.error = null;
            });

            get().clearHistory();
          },

          // 서버 동기화
          syncWithServer: async () => {
            // API 구현 예정
            console.log('Server sync not implemented yet');
          },

          // 레이아웃 유효성 검증
          validateLayout: (layout) => {
            if (!layout.id || !layout.name) return false;
            if (!layout.layouts || typeof layout.layouts !== 'object') return false;
            if (!layout.widgets || typeof layout.widgets !== 'object') return false;
            return true;
          }
        })),
        {
          name: 'dashboard-layout-store',
          partialize: (state) => ({
            currentLayout: state.currentLayout,
            layouts: state.layouts,
            currentProfile: state.currentProfile,
            profiles: state.profiles,
            autoSaveEnabled: state.autoSaveEnabled,
            autoSaveInterval: state.autoSaveInterval
          })
        }
      )
    )
  )
);

// 자동 저장 설정
if (typeof window !== 'undefined') {
  let autoSaveTimer: NodeJS.Timeout;

  useDashboardLayoutStore.subscribe(
    state => state.autoSaveEnabled,
    (autoSaveEnabled) => {
      if (autoSaveEnabled) {
        const interval = useDashboardLayoutStore.getState().autoSaveInterval;
        autoSaveTimer = setInterval(() => {
          const { currentLayout, isEditMode } = useDashboardLayoutStore.getState();
          if (currentLayout && !isEditMode) {
            useDashboardLayoutStore.getState().saveLayout();
          }
        }, interval);
      } else {
        clearInterval(autoSaveTimer);
      }
    }
  );
}