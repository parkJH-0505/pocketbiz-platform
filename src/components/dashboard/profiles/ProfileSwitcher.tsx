/**
 * Profile Switcher Component
 * 사용자 프로필 전환 UI
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDashboardLayoutStore } from '../../../stores/dashboardLayoutStore';
import { getRoleDefaultLayout } from './ProfileLayouts';
import type { UserProfile } from '../../../stores/dashboardLayoutStore';

const PROFILE_OPTIONS: UserProfile[] = [
  {
    id: 'developer',
    name: '개발자',
    role: 'developer',
    preferences: {
      theme: 'dark',
      language: 'ko',
      notifications: true,
      autoSave: true
    }
  },
  {
    id: 'pm',
    name: 'PM',
    role: 'pm',
    preferences: {
      theme: 'light',
      language: 'ko',
      notifications: true,
      autoSave: true
    }
  },
  {
    id: 'ceo',
    name: 'CEO',
    role: 'ceo',
    preferences: {
      theme: 'light',
      language: 'ko',
      notifications: false,
      autoSave: true
    }
  },
  {
    id: 'founder',
    name: '창업자',
    role: 'founder',
    preferences: {
      theme: 'dark',
      language: 'ko',
      notifications: true,
      autoSave: true
    }
  }
];

interface ProfileSwitcherProps {
  className?: string;
  onProfileChange?: (profile: UserProfile) => void;
}

export const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({
  className = '',
  onProfileChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    currentProfile,
    setProfile,
    currentLayout,
    setCurrentLayout,
    isDirty,
    saveLayout
  } = useDashboardLayoutStore();

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleProfileSelect = async (profile: UserProfile) => {
    // 현재 레이아웃이 수정되었는지 확인
    if (isDirty && currentLayout) {
      setPendingProfile(profile);
      setShowConfirmModal(true);
      setIsOpen(false);
      return;
    }

    await switchProfile(profile);
  };

  const switchProfile = async (profile: UserProfile) => {
    // 프로필 변경
    setProfile(profile);

    // 역할에 맞는 기본 레이아웃 로드
    const defaultLayout = getRoleDefaultLayout(profile.role);
    setCurrentLayout(defaultLayout);

    // 콜백 호출
    if (onProfileChange) {
      onProfileChange(profile);
    }

    setIsOpen(false);
    setPendingProfile(null);
  };

  const handleConfirmSwitch = async () => {
    if (pendingProfile) {
      // 현재 레이아웃 저장
      if (currentLayout) {
        await saveLayout(currentLayout);
      }

      // 프로필 전환
      await switchProfile(pendingProfile);
    }
    setShowConfirmModal(false);
  };

  const handleCancelSwitch = () => {
    setShowConfirmModal(false);
    setPendingProfile(null);
  };

  const getProfileIcon = (role: string) => {
    switch (role) {
      case 'developer':
        return '👨‍💻';
      case 'pm':
        return '📋';
      case 'ceo':
        return '👔';
      case 'founder':
        return '🚀';
      default:
        return '👤';
    }
  };

  return (
    <>
      <div ref={dropdownRef} className={`profile-switcher ${className}`}>
        <button
          className="profile-switcher__trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="프로필 전환"
        >
          <span className="profile-icon">
            {getProfileIcon(currentProfile?.role || 'founder')}
          </span>
          <span className="profile-name">
            {currentProfile?.name || '프로필 선택'}
          </span>
          <svg
            className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="profile-switcher__dropdown">
            <div className="dropdown-header">
              <span>프로필 전환</span>
              {isDirty && (
                <span className="unsaved-indicator" title="저장되지 않은 변경사항">
                  •
                </span>
              )}
            </div>

            <div className="profile-list">
              {PROFILE_OPTIONS.map(profile => (
                <button
                  key={profile.id}
                  className={`profile-item ${
                    currentProfile?.id === profile.id ? 'active' : ''
                  }`}
                  onClick={() => handleProfileSelect(profile)}
                >
                  <span className="profile-item__icon">
                    {getProfileIcon(profile.role)}
                  </span>
                  <div className="profile-item__info">
                    <span className="profile-item__name">{profile.name}</span>
                    <span className="profile-item__role">{profile.role}</span>
                  </div>
                  {currentProfile?.id === profile.id && (
                    <span className="checkmark">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="dropdown-footer">
              <button
                className="custom-profile-btn"
                onClick={() => {
                  // TODO: 커스텀 프로필 생성 모달 열기
                  console.log('커스텀 프로필 생성');
                  setIsOpen(false);
                }}
              >
                + 커스텀 프로필 만들기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>프로필 전환</h3>
            <p>
              현재 레이아웃에 저장되지 않은 변경사항이 있습니다.
              <br />
              저장하고 프로필을 전환하시겠습니까?
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={handleCancelSwitch}
              >
                취소
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  if (pendingProfile) {
                    switchProfile(pendingProfile);
                  }
                  setShowConfirmModal(false);
                }}
              >
                저장하지 않고 전환
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmSwitch}
              >
                저장 후 전환
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-switcher {
          position: relative;
        }

        .profile-switcher__trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-switcher__trigger:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .profile-icon {
          font-size: 18px;
        }

        .profile-name {
          font-weight: 500;
        }

        .dropdown-arrow {
          transition: transform 0.2s;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .profile-switcher__dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
          animation: dropdownSlide 0.2s ease;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          color: #1f2937;
        }

        .unsaved-indicator {
          color: #f59e0b;
          font-size: 20px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .profile-list {
          padding: 8px;
        }

        .profile-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .profile-item:hover {
          background: #f3f4f6;
        }

        .profile-item.active {
          background: #eff6ff;
        }

        .profile-item__icon {
          font-size: 24px;
          margin-right: 12px;
        }

        .profile-item__info {
          flex: 1;
          text-align: left;
        }

        .profile-item__name {
          display: block;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .profile-item__role {
          display: block;
          font-size: 12px;
          color: #6b7280;
        }

        .checkmark {
          color: #3b82f6;
          font-weight: 600;
        }

        .dropdown-footer {
          padding: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .custom-profile-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .custom-profile-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          color: #4b5563;
        }

        /* 확인 모달 */
        .confirm-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .confirm-modal {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          animation: modalSlide 0.2s ease;
        }

        @keyframes modalSlide {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .confirm-modal h3 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .confirm-modal p {
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .modal-actions button {
          padding: 8px 16px;
          border-radius: 6px;
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

        .btn-danger {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .btn-danger:hover {
          background: #fee2e2;
          border-color: #f87171;
        }
      `}</style>
    </>
  );
};

export default ProfileSwitcher;