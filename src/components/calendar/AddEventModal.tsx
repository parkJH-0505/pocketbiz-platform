/**
 * 일정 추가 모달 컴포넌트
 * 새로운 미팅 및 검토 일정을 추가하고 외부 캘린더와 연동
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Video,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useCalendarContext } from '../../contexts/CalendarContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { CalendarIntegration } from '../../utils/calendarIntegration';
import { EventMetadataUtils, DEFAULT_EVENT_TAGS } from '../../utils/calendarMetadata';
import { MEETING_TYPE_CONFIG } from '../../types/meeting.types';
import type { CalendarEventInput } from '../../types/calendar.types';
import type {
  MeetingType,
  CreateMeetingInput,
  PMMeetingData,
  PocketMentorData,
  BuildupProjectMeetingData,
  PocketWebinarData,
  ExternalMeetingData
} from '../../types/meeting.types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDate?: Date;
  preselectedProject?: string;
}

export default function AddEventModal({
  isOpen,
  onClose,
  preselectedDate,
  preselectedProject
}: AddEventModalProps) {
  const { createEvent } = useCalendarContext();
  const { projects } = useBuildupContext();

  // 기본 상태 - 모든 일정은 미팅 타입
  const [meetingType, setMeetingType] = useState<MeetingType>('buildup_project');

  // 공통 필드
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(preselectedProject || '');
  const [date, setDate] = useState(preselectedDate || new Date());
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState(60);
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [tags, setTags] = useState<string[]>([]);

  // 미팅 관련 필드
  const [location, setLocation] = useState<'online' | 'offline' | 'hybrid'>('online');
  const [meetingLink, setMeetingLink] = useState('');
  const [offlineLocation, setOfflineLocation] = useState('');

  // PM 미팅 필드
  const [pmMeetingData, setPMMeetingData] = useState<Partial<PMMeetingData>>({
    담당PM: '',
    PM직함: 'PM',
    세션회차: 1,
    아젠다: ''
  });

  // 빌드업 프로젝트 미팅 필드
  const [buildupMeetingData, setBuildupMeetingData] = useState<Partial<BuildupProjectMeetingData>>({
    프로젝트명: '',
    프로젝트ID: '',
    미팅목적: 'progress',
    PM명: '',
    참여자목록: [],
    아젠다: ''
  });

  // 포켓멘토 필드
  const [mentorData, setMentorData] = useState<Partial<PocketMentorData>>({
    멘토명: '',
    멘토직함: '',
    세션주제: '',
    세션회차: 1
  });

  // 웨비나 필드
  const [webinarData, setWebinarData] = useState<Partial<PocketWebinarData>>({
    웨비나제목: '',
    발표자: '',
    발표자소속: '',
    예상참여자수: 0
  });

  // 외부 미팅 필드
  const [externalData, setExternalData] = useState<Partial<ExternalMeetingData>>({
    미팅제목: '',
    회사명: '',
    담당자명: '',
    미팅목적: ''
  });

  // 검토 타입 제거 - 모든 일정은 미팅으로 통합

  // 알림 설정
  const [reminders, setReminders] = useState([
    { type: 'push', timing: 30 }
  ]);

  // 캘린더 연동
  const [exportToGoogle, setExportToGoogle] = useState(false);
  const [downloadICS, setDownloadICS] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 선택된 프로젝트
  const selectedProject = useMemo(() =>
    projects.find(p => p.id === projectId),
    [projects, projectId]
  );

  // 미팅 타입별 필수 필드 체크
  const isValidMeetingData = useMemo(() => {

    const config = MEETING_TYPE_CONFIG[meetingType];
    if (!config) return false;

    switch (meetingType) {
      case 'pm_meeting':
        return !!(pmMeetingData.담당PM && pmMeetingData.아젠다);
      case 'buildup_project':
        return !!(buildupMeetingData.아젠다 && buildupMeetingData.PM명);
      case 'pocket_mentor':
        return !!(mentorData.멘토명 && mentorData.세션주제);
      case 'pocket_webinar':
        return !!(webinarData.웨비나제목 && webinarData.발표자);
      case 'external':
        return !!(externalData.미팅제목);
      default:
        return false;
    }
  }, [meetingType, pmMeetingData, buildupMeetingData, mentorData, webinarData, externalData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId) return;

    setIsSubmitting(true);

    try {
      // 이벤트 입력 데이터 구성
      const input: CalendarEventInput = {
        title,
        type: 'meeting',  // 모든 일정은 meeting 타입
        date,
        time,
        duration,
        projectId,
        priority,
        tags
      };

      // 미팅 데이터 구성
      const meetingInput: CreateMeetingInput = {
          meetingType,
          title,
          날짜: date,
          시작시간: time,
          종료시간: calculateEndTime(time, duration),
          location,
          meetingLink: location === 'online' || location === 'hybrid' ? meetingLink : undefined,
          offlineLocation: location === 'offline' || location === 'hybrid' ? offlineLocation : undefined,
          meetingData: getMeetingDataByType(),
          reminders: reminders as any,
          tags
        };

        // EnhancedMeetingData 구성
        input.meetingData = {
          meetingType,
          title,
          날짜: date,
          시작시간: time,
          종료시간: calculateEndTime(time, duration),
          location,
          meetingLink: meetingLink || undefined,
          offlineLocation: offlineLocation || undefined,
          status: 'scheduled',
          ...getMeetingSpecificData()
        } as any;

      // 이벤트 생성
      const newEvent = await createEvent(input);

      // 외부 캘린더 연동
      if (exportToGoogle) {
        const googleUrl = CalendarIntegration.generateGoogleCalendarURL(newEvent);
        window.open(googleUrl, '_blank');
      }

      if (downloadICS) {
        CalendarIntegration.downloadICSFile([newEvent], `${title}.ics`);
      }

      // 초기화 및 닫기
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMeetingDataByType = () => {
    switch (meetingType) {
      case 'pm_meeting':
        return { type: 'pm_meeting' as const, data: pmMeetingData };
      case 'buildup_project':
        return { type: 'buildup_project' as const, data: buildupMeetingData };
      case 'pocket_mentor':
        return { type: 'pocket_mentor' as const, data: mentorData };
      case 'pocket_webinar':
        return { type: 'pocket_webinar' as const, data: webinarData };
      case 'external':
        return { type: 'external' as const, data: externalData };
      default:
        return { type: 'buildup_project' as const, data: {} };
    }
  };

  const getMeetingSpecificData = () => {
    const data: any = {};

    switch (meetingType) {
      case 'pm_meeting':
        data.pmMeetingData = pmMeetingData;
        break;
      case 'buildup_project':
        data.buildupProjectData = buildupMeetingData;
        break;
      case 'pocket_mentor':
        data.pocketMentorData = mentorData;
        break;
      case 'pocket_webinar':
        data.pocketWebinarData = webinarData;
        break;
      case 'external':
        data.externalMeetingData = externalData;
        break;
    }

    return data;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const resetForm = () => {
    setTitle('');
    setProjectId('');
    setDate(new Date());
    setTime('14:00');
    setDuration(60);
    setPriority('medium');
    setTags([]);
    setLocation('online');
    setMeetingLink('');
    setOfflineLocation('');
    setReminders([{ type: 'push', timing: 30 }]);
    setExportToGoogle(false);
    setDownloadICS(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">새 일정 추가</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-lightest rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* 미팅 타입 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              미팅 종류
            </label>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value as MeetingType)}
              className="w-full px-3 py-2 border border-neutral-lighter rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
            >
              {Object.entries(MEETING_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-lighter rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                프로젝트 *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-lighter rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                required
              >
                <option value="">프로젝트 선택</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 날짜 및 시간 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                날짜 *
              </label>
              <input
                type="date"
                value={date.toISOString().split('T')[0]}
                onChange={(e) => setDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-lighter rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                시작 시간
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-lighter rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                소요 시간 (분)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="15"
                step="15"
                className="w-full px-3 py-2 border border-neutral-lighter rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
              />
            </div>
          </div>

          {/* 미팅 타입별 추가 필드 */}
          {/* PM 미팅 필드 */}
          {meetingType === 'pm_meeting' && (
                <div className="mb-6 p-4 bg-primary-light/30 rounded-lg">
                  <h4 className="font-medium mb-3">PM 미팅 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="담당 PM *"
                      value={pmMeetingData.담당PM}
                      onChange={(e) => setPMMeetingData(prev => ({ ...prev, 담당PM: e.target.value }))}
                      className="px-3 py-2 border border-neutral-lighter rounded-lg"
                      required
                    />
                    <input
                      type="number"
                      placeholder="세션 회차"
                      value={pmMeetingData.세션회차}
                      onChange={(e) => setPMMeetingData(prev => ({ ...prev, 세션회차: Number(e.target.value) }))}
                      className="px-3 py-2 border border-neutral-lighter rounded-lg"
                      min="1"
                    />
                  </div>
                  <textarea
                    placeholder="아젠다 *"
                    value={pmMeetingData.아젠다}
                    onChange={(e) => setPMMeetingData(prev => ({ ...prev, 아젠다: e.target.value }))}
                    className="w-full mt-3 px-3 py-2 border border-neutral-lighter rounded-lg"
                    rows={3}
                    required
                  />
                </div>
              )}

              {/* 빌드업 프로젝트 미팅 필드 */}
              {meetingType === 'buildup_project' && (
                <div className="mb-6 p-4 bg-primary-light/30 rounded-lg">
                  <h4 className="font-medium mb-3">프로젝트 미팅 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="PM 이름 *"
                      value={buildupMeetingData.PM명}
                      onChange={(e) => setBuildupMeetingData(prev => ({ ...prev, PM명: e.target.value }))}
                      className="px-3 py-2 border border-neutral-lighter rounded-lg"
                      required
                    />
                    <select
                      value={buildupMeetingData.미팅목적}
                      onChange={(e) => setBuildupMeetingData(prev => ({ ...prev, 미팅목적: e.target.value as any }))}
                      className="px-3 py-2 border border-neutral-lighter rounded-lg"
                    >
                      <option value="kickoff">킥오프</option>
                      <option value="progress">진행 점검</option>
                      <option value="review">리뷰</option>
                      <option value="closing">마무리</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="아젠다 *"
                    value={buildupMeetingData.아젠다}
                    onChange={(e) => setBuildupMeetingData(prev => ({ ...prev, 아젠다: e.target.value }))}
                    className="w-full mt-3 px-3 py-2 border border-neutral-lighter rounded-lg"
                    rows={3}
                    required
                  />
                </div>
              )}

          {/* 장소 설정 */}
          <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  장소
                </label>
                <div className="flex gap-2 mb-3">
                  {(['online', 'offline', 'hybrid'] as const).map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        location === loc
                          ? 'border-primary-main bg-primary-light text-primary-main'
                          : 'border-neutral-lighter hover:border-neutral-light'
                      }`}
                    >
                      {loc === 'online' ? '온라인' : loc === 'offline' ? '오프라인' : '하이브리드'}
                    </button>
                  ))}
                </div>
                {(location === 'online' || location === 'hybrid') && (
                  <input
                    type="url"
                    placeholder="미팅 링크"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-lighter rounded-lg mb-2"
                  />
                )}
                {(location === 'offline' || location === 'hybrid') && (
                  <input
                    type="text"
                    placeholder="오프라인 장소"
                    value={offlineLocation}
                    onChange={(e) => setOfflineLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-lighter rounded-lg"
                  />
                )}
          </div>

          {/* 우선순위 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              우선순위
            </label>
            <div className="flex gap-2">
              {(['critical', 'high', 'medium', 'low'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    priority === p
                      ? p === 'critical' ? 'border-accent-red bg-accent-red/10 text-accent-red' :
                        p === 'high' ? 'border-accent-orange bg-accent-orange/10 text-accent-orange' :
                        p === 'medium' ? 'border-accent-yellow bg-accent-yellow/10 text-accent-yellow' :
                        'border-neutral-lighter bg-neutral-lightest text-neutral-light'
                      : 'border-neutral-lighter hover:border-neutral-light'
                  }`}
                >
                  {p === 'critical' ? '긴급' :
                   p === 'high' ? '높음' :
                   p === 'medium' ? '보통' : '낮음'}
                </button>
              ))}
            </div>
          </div>

          {/* 태그 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              태그
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_EVENT_TAGS.slice(0, 8).map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    setTags(prev =>
                      prev.includes(tag.label)
                        ? prev.filter(t => t !== tag.label)
                        : [...prev, tag.label]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    tags.includes(tag.label)
                      ? 'bg-primary-main text-white'
                      : 'bg-neutral-lightest text-neutral-dark hover:bg-neutral-lighter'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* 캘린더 연동 옵션 */}
          <div className="mb-6 p-4 bg-neutral-lightest rounded-lg">
            <h4 className="font-medium mb-3">캘린더 연동</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportToGoogle}
                  onChange={(e) => setExportToGoogle(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Google Calendar에 추가</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={downloadICS}
                  onChange={(e) => setDownloadICS(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">ICS 파일 다운로드 (Outlook, Apple Calendar용)</span>
              </label>
            </div>
          </div>
        </form>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-neutral-dark hover:bg-neutral-lightest rounded-lg transition-colors"
          >
            취소
          </button>
          <div className="flex gap-2">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !projectId || !isValidMeetingData}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isSubmitting || !title || !projectId || !isValidMeetingData
                  ? 'bg-neutral-lighter text-neutral-light cursor-not-allowed'
                  : 'bg-primary-main text-white hover:bg-primary-dark'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>추가 중...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>일정 추가</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}