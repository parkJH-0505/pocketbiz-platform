/**
 * Profile Manager Component
 * 프로필 관리 전체 기능 UI
 */

import React, { useState } from 'react';
import { useDashboardLayoutStore } from '../../../stores/dashboardLayoutStore';
import { getRoleDefaultLayout } from './ProfileLayouts';
import type { UserProfile, DashboardLayout } from '../../../stores/dashboardLayoutStore';

interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileFormData {
  name: string;
  role: 'developer' | 'pm' | 'ceo' | 'founder' | 'custom';
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  notifications: boolean;
  autoSave: boolean;
  defaultLayout?: string;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  isOpen,
  onClose
}) => {
  const {
    profiles,
    currentProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    setProfile,
    savedLayouts,
    currentLayout,
    setCurrentLayout
  } = useDashboardLayoutStore();

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    role: 'custom',
    theme: 'light',
    language: 'ko',
    notifications: true,
    autoSave: true,
    defaultLayout: undefined
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  if (!isOpen) return null;

  const handleCreateProfile = () => {
    // 유효성 검사
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '프로필 이름을 입력해주세요';
    }

    if (profiles.some(p => p.name === formData.name.trim())) {
      newErrors.name = '이미 존재하는 프로필 이름입니다';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 새 프로필 생성
    const newProfile: UserProfile = {
      id: `profile-${Date.now()}`,
      name: formData.name.trim(),
      role: formData.role === 'custom' ? 'founder' : formData.role,
      preferences: {
        theme: formData.theme,
        language: formData.language,
        notifications: formData.notifications,
        autoSave: formData.autoSave,
        defaultLayoutId: formData.defaultLayout
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addProfile(newProfile);

    // 프로필 활성화 및 레이아웃 적용
    setProfile(newProfile);

    if (formData.defaultLayout) {
      const layout = savedLayouts.find(l => l.id === formData.defaultLayout);
      if (layout) {
        setCurrentLayout(layout);
      }
    } else if (formData.role !== 'custom') {
      // 역할별 기본 레이아웃 적용
      const defaultLayout = getRoleDefaultLayout(formData.role);
      setCurrentLayout(defaultLayout);
    }

    // 폼 초기화
    setFormData({
      name: '',
      role: 'custom',
      theme: 'light',
      language: 'ko',
      notifications: true,
      autoSave: true,
      defaultLayout: undefined
    });
    setErrors({});
    setActiveTab('list');
  };

  const handleUpdateProfile = () => {
    if (!selectedProfile) return;

    // 유효성 검사
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '프로필 이름을 입력해주세요';
    }

    if (profiles.some(p => p.id !== selectedProfile.id && p.name === formData.name.trim())) {
      newErrors.name = '이미 존재하는 프로필 이름입니다';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 프로필 업데이트
    const updatedProfile: UserProfile = {
      ...selectedProfile,
      name: formData.name.trim(),
      role: formData.role === 'custom' ? 'founder' : formData.role,
      preferences: {
        theme: formData.theme,
        language: formData.language,
        notifications: formData.notifications,
        autoSave: formData.autoSave,
        defaultLayoutId: formData.defaultLayout
      },
      updatedAt: Date.now()
    };

    updateProfile(updatedProfile);

    // 현재 프로필이면 즉시 적용
    if (currentProfile?.id === selectedProfile.id) {
      setProfile(updatedProfile);
    }

    setSelectedProfile(null);
    setActiveTab('list');
  };

  const handleDeleteProfile = (profile: UserProfile) => {
    if (confirm(`"${profile.name}" 프로필을 삭제하시겠습니까?`)) {
      deleteProfile(profile.id);

      // 삭제된 프로필이 현재 프로필이면 다른 프로필로 전환
      if (currentProfile?.id === profile.id && profiles.length > 1) {
        const nextProfile = profiles.find(p => p.id !== profile.id);
        if (nextProfile) {
          setProfile(nextProfile);
        }
      }
    }
  };

  const handleEditProfile = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      role: profile.role === 'founder' ? 'custom' : profile.role as any,
      theme: profile.preferences.theme || 'light',
      language: profile.preferences.language || 'ko',
      notifications: profile.preferences.notifications ?? true,
      autoSave: profile.preferences.autoSave ?? true,
      defaultLayout: profile.preferences.defaultLayoutId
    });
    setErrors({});
    setActiveTab('edit');
  };

  const getProfileIcon = (role: string) => {
    switch (role) {
      case 'developer': return '👨‍💻';
      case 'pm': return '📋';
      case 'ceo': return '👔';
      case 'founder': return '🚀';
      default: return '⚙️';
    }
  };

  return (
    <div className="profile-manager-overlay">
      <div className="profile-manager">
        <div className="manager-header">
          <h2>프로필 관리</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="manager-tabs">
          <button
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            프로필 목록
          </button>
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            새 프로필 만들기
          </button>
          {selectedProfile && (
            <button
              className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              프로필 편집
            </button>
          )}
        </div>

        <div className="manager-content">
          {activeTab === 'list' && (
            <div className="profile-list-view">
              {profiles.length === 0 ? (
                <div className="empty-state">
                  <p>생성된 프로필이 없습니다</p>
                  <button
                    className="btn-primary"
                    onClick={() => setActiveTab('create')}
                  >
                    첫 프로필 만들기
                  </button>
                </div>
              ) : (
                <div className="profile-grid">
                  {profiles.map(profile => (
                    <div
                      key={profile.id}
                      className={`profile-card ${
                        currentProfile?.id === profile.id ? 'active' : ''
                      }`}
                    >
                      <div className="profile-card__header">
                        <span className="profile-icon">
                          {getProfileIcon(profile.role)}
                        </span>
                        {currentProfile?.id === profile.id && (
                          <span className="active-badge">사용중</span>
                        )}
                      </div>
                      <h3>{profile.name}</h3>
                      <p className="profile-role">{profile.role}</p>
                      <div className="profile-meta">
                        <span>테마: {profile.preferences.theme || 'light'}</span>
                        <span>언어: {profile.preferences.language || 'ko'}</span>
                      </div>
                      <div className="profile-actions">
                        <button
                          className="btn-text"
                          onClick={() => setProfile(profile)}
                          disabled={currentProfile?.id === profile.id}
                        >
                          활성화
                        </button>
                        <button
                          className="btn-text"
                          onClick={() => handleEditProfile(profile)}
                        >
                          편집
                        </button>
                        <button
                          className="btn-text danger"
                          onClick={() => handleDeleteProfile(profile)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'create' || activeTab === 'edit') && (
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="name">프로필 이름 *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="예: 개발 작업용"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="role">역할</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({
                    ...formData,
                    role: e.target.value as ProfileFormData['role']
                  })}
                >
                  <option value="developer">개발자</option>
                  <option value="pm">PM</option>
                  <option value="ceo">CEO</option>
                  <option value="founder">창업자</option>
                  <option value="custom">커스텀</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="theme">테마</label>
                <select
                  id="theme"
                  value={formData.theme}
                  onChange={(e) => setFormData({
                    ...formData,
                    theme: e.target.value as ProfileFormData['theme']
                  })}
                >
                  <option value="light">라이트</option>
                  <option value="dark">다크</option>
                  <option value="auto">자동</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="language">언어</label>
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({
                    ...formData,
                    language: e.target.value as ProfileFormData['language']
                  })}
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="defaultLayout">기본 레이아웃</label>
                <select
                  id="defaultLayout"
                  value={formData.defaultLayout || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    defaultLayout: e.target.value || undefined
                  })}
                >
                  <option value="">역할 기본값 사용</option>
                  {savedLayouts.map(layout => (
                    <option key={layout.id} value={layout.id}>
                      {layout.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.notifications}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: e.target.checked
                    })}
                  />
                  알림 받기
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.autoSave}
                    onChange={(e) => setFormData({
                      ...formData,
                      autoSave: e.target.checked
                    })}
                  />
                  자동 저장
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setActiveTab('list');
                    setSelectedProfile(null);
                    setErrors({});
                  }}
                >
                  취소
                </button>
                <button
                  className="btn-primary"
                  onClick={activeTab === 'create' ? handleCreateProfile : handleUpdateProfile}
                >
                  {activeTab === 'create' ? '프로필 생성' : '변경사항 저장'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-manager-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .profile-manager {
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          background: white;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .manager-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .manager-header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 20px;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e5e7eb;
          color: #4b5563;
        }

        .manager-tabs {
          display: flex;
          gap: 4px;
          padding: 0 24px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab {
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #4b5563;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .manager-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        /* 프로필 목록 */
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .profile-card {
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .profile-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .profile-card.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .profile-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .profile-icon {
          font-size: 32px;
        }

        .active-badge {
          padding: 4px 8px;
          background: #3b82f6;
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .profile-card h3 {
          margin: 0 0 4px 0;
          color: #1f2937;
          font-size: 16px;
        }

        .profile-role {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 12px 0;
        }

        .profile-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 16px;
          font-size: 12px;
          color: #9ca3af;
        }

        .profile-actions {
          display: flex;
          gap: 8px;
        }

        .btn-text {
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .btn-text:hover {
          background: #eff6ff;
        }

        .btn-text:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }

        .btn-text.danger {
          color: #ef4444;
        }

        .btn-text.danger:hover {
          background: #fef2f2;
        }

        /* 빈 상태 */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 20px;
        }

        /* 폼 */
        .profile-form {
          max-width: 500px;
          margin: 0 auto;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #374151;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input.error {
          border-color: #ef4444;
        }

        .error-message {
          display: block;
          margin-top: 4px;
          color: #ef4444;
          font-size: 12px;
        }

        .checkbox-group {
          display: flex;
          gap: 24px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #4b5563;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default ProfileManager;