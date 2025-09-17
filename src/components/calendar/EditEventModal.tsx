/**
 * 캘린더 일정 수정 모달
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Link,
  Users,
  FileText,
  Save,
  Trash2,
  AlertCircle,
  Video,
  Building,
  GraduationCap,
  Presentation,
  Briefcase
} from 'lucide-react';
import type { CalendarEvent } from '../../types/calendar.types';
import type { EnhancedMeetingData, MeetingType } from '../../types/meeting.types';
import { useCalendarContext } from '../../contexts/CalendarContext';
import { CalendarService } from '../../services/calendarService';

interface EditEventModalProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
}

const MEETING_TYPE_INFO = {
  pm_meeting: {
    label: 'PM 정기미팅',
    icon: Users,
    color: 'bg-primary-main',
    lightColor: 'bg-primary-light'
  },
  pocket_mentor: {
    label: '포켓멘토 온라인강의',
    icon: GraduationCap,
    color: 'bg-accent-purple',
    lightColor: 'bg-accent-purple/10'
  },
  buildup_project: {
    label: '프로젝트 미팅',
    icon: Briefcase,
    color: 'bg-secondary-main',
    lightColor: 'bg-secondary-light'
  },
  pocket_webinar: {
    label: '포켓 웨비나',
    icon: Presentation,
    color: 'bg-accent-orange',
    lightColor: 'bg-accent-orange/10'
  },
  external: {
    label: '외부 미팅',
    icon: Building,
    color: 'bg-neutral-light',
    lightColor: 'bg-neutral-lightest'
  }
};

export default function EditEventModal({ event, isOpen, onClose }: EditEventModalProps) {
  const { updateEvent, deleteEvent } = useCalendarContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title,
    date: event.date,
    time: event.time || '14:00',
    duration: event.duration || 60,
    location: (event.meetingData as EnhancedMeetingData)?.location || 'online',
    meetingLink: (event.meetingData as EnhancedMeetingData)?.meetingLink || '',
    notes: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        date: event.date,
        time: event.time || '14:00',
        duration: event.duration || 60,
        location: (event.meetingData as EnhancedMeetingData)?.location || 'online',
        meetingLink: (event.meetingData as EnhancedMeetingData)?.meetingLink || '',
        notes: ''
      });
    }
  }, [event]);

  if (!isOpen) return null;

  const meetingData = event.meetingData as EnhancedMeetingData;
  const meetingType = meetingData?.meetingType || 'pm_meeting';
  const meetingInfo = MEETING_TYPE_INFO[meetingType];
  const Icon = meetingInfo.icon;

  const handleSave = async () => {
    const updatedMeetingData: EnhancedMeetingData = {
      ...meetingData,
      title: formData.title,
      날짜: new Date(formData.date),
      시작시간: formData.time,
      location: formData.location as 'online' | 'offline',
      meetingLink: formData.meetingLink
    };

    await updateEvent(event.id, {
      title: formData.title,
      date: new Date(formData.date),
      time: formData.time,
      duration: formData.duration,
      meetingData: updatedMeetingData
    });

    setIsEditing(false);
    onClose();
  };

  const handleDelete = async () => {
    await deleteEvent(event.id);
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getStatusBadge = () => {
    switch (event.status) {
      case 'completed':
        return (
          <span className="px-2 py-1 bg-secondary-light text-secondary-main text-xs rounded-full">
            완료됨
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 bg-accent-red/10 text-accent-red text-xs rounded-full">
            취소됨
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-primary-light text-primary-main text-xs rounded-full">
            예정됨
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${meetingInfo.lightColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 ${meetingInfo.color} text-white rounded-lg`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-xl font-bold bg-white/50 border border-neutral-border rounded px-2 py-1 w-full"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-neutral-darkest">{event.title}</h2>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-neutral-dark">{meetingInfo.label}</span>
                  {getStatusBadge()}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-dark" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-neutral-lighter mt-1" />
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="date"
                    value={new Date(formData.date).toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                    className="px-3 py-2 border border-neutral-border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="px-3 py-2 border border-neutral-border rounded-lg"
                    />
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      placeholder="시간(분)"
                      className="px-3 py-2 border border-neutral-border rounded-lg w-24"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium text-neutral-darkest">{formatDate(event.date)}</p>
                  <p className="text-sm text-neutral-dark">
                    {event.time || '14:00'} ({event.duration || 60}분)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-neutral-lighter mt-1" />
            <div className="flex-1">
              {isEditing ? (
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="px-3 py-2 border border-neutral-border rounded-lg w-full"
                >
                  <option value="online">온라인</option>
                  <option value="offline">오프라인</option>
                </select>
              ) : (
                <p className="text-neutral-darkest">
                  {meetingData?.location === 'online' ? '온라인 미팅' : '오프라인 미팅'}
                </p>
              )}
            </div>
          </div>

          {/* Meeting Link */}
          {meetingData?.location === 'online' && (
            <div className="flex items-start gap-3">
              <Link className="w-5 h-5 text-neutral-lighter mt-1" />
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    placeholder="미팅 링크"
                    className="px-3 py-2 border border-neutral-border rounded-lg w-full"
                  />
                ) : (
                  <a
                    href={meetingData.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-main hover:underline"
                  >
                    {meetingData.meetingLink || '미팅 링크 없음'}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Meeting Type Specific Info */}
          {meetingData && (
            <div className="bg-neutral-lightest rounded-lg p-4 space-y-3">
              {/* PM Meeting */}
              {meetingType === 'pm_meeting' && meetingData.pmMeetingData && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-dark">담당 PM</span>
                    <span className="text-sm font-medium">{meetingData.pmMeetingData.담당PM}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-dark">세션 회차</span>
                    <span className="text-sm font-medium">{meetingData.pmMeetingData.세션회차}차</span>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-dark">아젠다</span>
                    <p className="text-sm font-medium mt-1">{meetingData.pmMeetingData.아젠다}</p>
                  </div>
                </>
              )}

              {/* Pocket Mentor */}
              {meetingType === 'pocket_mentor' && meetingData.pocketMentorData && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-dark">강사</span>
                    <span className="text-sm font-medium">{meetingData.pocketMentorData.멘토명}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-dark">주차</span>
                    <span className="text-sm font-medium">{meetingData.pocketMentorData.세션회차}주차</span>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-dark">강의 주제</span>
                    <p className="text-sm font-medium mt-1">{meetingData.pocketMentorData.세션주제}</p>
                  </div>
                  {meetingData.pocketMentorData.강의자료 && (
                    <div>
                      <a
                        href={meetingData.pocketMentorData.강의자료}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-main hover:underline"
                      >
                        강의 자료 보기 →
                      </a>
                    </div>
                  )}
                </>
              )}

              {/* Project Meeting */}
              {meetingType === 'buildup_project' && meetingData.buildupProjectData && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-dark">프로젝트</span>
                    <span className="text-sm font-medium">{meetingData.buildupProjectData.프로젝트명}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-dark">미팅 목적</span>
                    <span className="text-sm font-medium">{meetingData.buildupProjectData.미팅목적}</span>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-dark">아젠다</span>
                    <p className="text-sm font-medium mt-1">{meetingData.buildupProjectData.아젠다}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Project Info */}
          {event.projectTitle && (
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-neutral-lighter mt-1" />
              <div>
                <p className="text-sm text-neutral-dark">연결된 프로젝트</p>
                <p className="font-medium text-neutral-darkest">{event.projectTitle}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-lightest border-t border-neutral-border">
          <div className="flex justify-between">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="px-4 py-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-neutral-dark hover:bg-neutral-lighter/20 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-primary-main text-white hover:bg-primary-dark rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    저장
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-primary-main text-white hover:bg-primary-dark rounded-lg transition-colors"
                >
                  수정
                </button>
              )}
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-accent-red/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-accent-red" />
                <p className="text-sm font-medium text-accent-red">정말로 삭제하시겠습니까?</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-sm text-neutral-dark hover:bg-white/50 rounded transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-sm bg-accent-red text-white hover:bg-accent-red/80 rounded transition-colors"
                >
                  삭제 확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}