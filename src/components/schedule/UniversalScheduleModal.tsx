/**
 * UniversalScheduleModal Component
 *
 * 통합 스케줄 생성/편집/조회를 위한 범용 모달 컴포넌트
 * 다양한 스케줄 타입을 지원하며, 단계별 입력 프로세스를 제공
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useScheduleContext } from '../../contexts/ScheduleContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import type {
  UniversalScheduleModalProps,
  ScheduleFormData,
  ValidationErrors,
  ModalMode
} from './types';
import {
  MODAL_STEPS,
  STEP_LABELS,
  TYPE_LABELS
} from './types';
import {
  initializeFormData,
  validateScheduleData,
  isFormValid,
  resetTypeSpecificFields,
  mapFormDataToSchedule
} from './utils';

// 컴포넌트 임포트
import ScheduleTypeSelector from './ScheduleTypeSelector';
import CommonScheduleFields from './CommonScheduleFields';
import BuildupMeetingFields from './BuildupMeetingFields';
import MentorSessionFields from './MentorSessionFields';
import WebinarFields from './WebinarFields';
import PersonalFields from './PersonalFields';

/**
 * 통합 스케줄 모달 컴포넌트
 */
export const UniversalScheduleModal: React.FC<UniversalScheduleModalProps> = ({
  isOpen,
  onClose,
  schedule,
  mode = 'create',
  defaultType = 'general',
  projectId,
  onSuccess,
  className = ''
}) => {
  // Context
  const { createSchedule, updateSchedule } = useScheduleContext();
  const { projects } = useBuildupContext();

  // 상태 관리
  const [currentStep, setCurrentStep] = useState(
    mode === 'view' ? MODAL_STEPS.REVIEW : MODAL_STEPS.TYPE_SELECTION
  );
  const [formData, setFormData] = useState<ScheduleFormData>(() =>
    initializeFormData(schedule, defaultType, projectId)
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 프로젝트 정보 (빌드업 미팅의 경우)
  const selectedProject = useMemo(() => {
    if (!projectId && !formData.projectId) return undefined;
    return projects.find(p => p.id === (projectId || formData.projectId));
  }, [projectId, formData.projectId, projects]);

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData(initializeFormData(schedule, defaultType, projectId));
      setErrors({});
      setCurrentStep(
        mode === 'view' ? MODAL_STEPS.REVIEW :
        mode === 'edit' ? MODAL_STEPS.COMMON_FIELDS :
        MODAL_STEPS.TYPE_SELECTION
      );
    }
  }, [isOpen, schedule, mode, defaultType, projectId]);

  // 폼 데이터 업데이트
  const handleFormDataChange = useCallback((updates: Partial<ScheduleFormData>) => {
    setFormData(prev => {
      // 타입이 변경된 경우 특화 필드 초기화
      if (updates.type && updates.type !== prev.type) {
        return resetTypeSpecificFields({ ...prev, ...updates }, updates.type);
      }
      return { ...prev, ...updates };
    });

    // 변경 시 에러 클리어
    const updatedFields = Object.keys(updates);
    if (updatedFields.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        updatedFields.forEach(field => {
          delete newErrors[field];
        });
        return newErrors;
      });
    }
  }, []);

  // 스텝 이동
  const handleNextStep = useCallback(() => {
    // 현재 스텝 검증
    const stepErrors = validateStepData(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    // 다음 스텝으로 이동
    if (currentStep === MODAL_STEPS.TYPE_SELECTION) {
      setCurrentStep(MODAL_STEPS.COMMON_FIELDS);
    } else if (currentStep === MODAL_STEPS.COMMON_FIELDS) {
      // 타입별 특화 필드가 필요한 경우
      if (needsTypeSpecificFields(formData.type)) {
        setCurrentStep(MODAL_STEPS.TYPE_SPECIFIC_FIELDS);
      } else {
        setCurrentStep(MODAL_STEPS.REVIEW);
      }
    } else if (currentStep === MODAL_STEPS.TYPE_SPECIFIC_FIELDS) {
      setCurrentStep(MODAL_STEPS.REVIEW);
    }
  }, [currentStep, formData]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep === MODAL_STEPS.REVIEW) {
      if (needsTypeSpecificFields(formData.type)) {
        setCurrentStep(MODAL_STEPS.TYPE_SPECIFIC_FIELDS);
      } else {
        setCurrentStep(MODAL_STEPS.COMMON_FIELDS);
      }
    } else if (currentStep === MODAL_STEPS.TYPE_SPECIFIC_FIELDS) {
      setCurrentStep(MODAL_STEPS.COMMON_FIELDS);
    } else if (currentStep === MODAL_STEPS.COMMON_FIELDS) {
      setCurrentStep(MODAL_STEPS.TYPE_SELECTION);
    }
  }, [currentStep, formData.type]);

  // 스텝별 데이터 검증
  const validateStepData = (step: number): ValidationErrors => {
    const stepErrors: ValidationErrors = {};

    if (step === MODAL_STEPS.TYPE_SELECTION) {
      if (!formData.type) {
        stepErrors.type = '일정 유형을 선택해주세요';
      }
    } else if (step === MODAL_STEPS.COMMON_FIELDS) {
      const allErrors = validateScheduleData(formData, mode);
      // 공통 필드 에러만 추출
      const commonFields = ['title', 'startDateTime', 'endDateTime', 'onlineLink'];
      commonFields.forEach(field => {
        if (allErrors[field]) {
          stepErrors[field] = allErrors[field];
        }
      });
    } else if (step === MODAL_STEPS.TYPE_SPECIFIC_FIELDS) {
      const allErrors = validateScheduleData(formData, mode);
      // 타입별 필드 에러만 추출
      if (formData.type === 'buildup_project') {
        ['projectId', 'meetingSequenceType'].forEach(field => {
          if (allErrors[field]) {
            stepErrors[field] = allErrors[field];
          }
        });
      }
    }

    return stepErrors;
  };

  // 타입별 특화 필드 필요 여부
  const needsTypeSpecificFields = (type: string): boolean => {
    return ['buildup_project', 'mentor_session', 'webinar', 'personal'].includes(type);
  };

  // 제출 처리
  const handleSubmit = useCallback(async () => {
    // 전체 검증
    const validationErrors = validateScheduleData(formData, mode);
    if (!isFormValid(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduleData = mapFormDataToSchedule(formData, schedule);

      let result;
      if (mode === 'edit' && schedule) {
        result = await updateSchedule(schedule.id, scheduleData);
      } else {
        result = await createSchedule(scheduleData);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      setErrors({
        submit: '일정 저장에 실패했습니다. 다시 시도해주세요.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, schedule, mode, createSchedule, updateSchedule, onSuccess, onClose]);

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) {
    return null;
  }

  // 스텝 인디케이터 렌더링
  const renderStepIndicator = () => {
    if (mode === 'view') return null;

    const steps = mode === 'edit'
      ? STEP_LABELS.slice(1) // 편집 모드에서는 타입 선택 제외
      : STEP_LABELS;

    const adjustedCurrentStep = mode === 'edit'
      ? currentStep - 1
      : currentStep;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === adjustedCurrentStep;
            const isCompleted = stepNumber < adjustedCurrentStep;

            return (
              <div key={index} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${isActive ? 'bg-blue-600 text-white' :
                      isCompleted ? 'bg-green-500 text-white' :
                      'bg-gray-200 text-gray-500'}
                  `}>
                    {isCompleted ? '✓' : stepNumber}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 스텝별 컨텐츠 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case MODAL_STEPS.TYPE_SELECTION:
        return (
          <ScheduleTypeSelector
            value={formData.type}
            onChange={(type) => handleFormDataChange({ type })}
            disabled={mode === 'view'}
          />
        );

      case MODAL_STEPS.COMMON_FIELDS:
        return (
          <CommonScheduleFields
            formData={formData}
            onChange={handleFormDataChange}
            errors={errors}
            mode={mode}
          />
        );

      case MODAL_STEPS.TYPE_SPECIFIC_FIELDS:
        switch (formData.type) {
          case 'buildup_project':
            return (
              <BuildupMeetingFields
                formData={formData}
                onChange={handleFormDataChange}
                errors={errors}
                mode={mode}
                project={selectedProject}
              />
            );
          case 'mentor_session':
            return (
              <MentorSessionFields
                formData={formData}
                onChange={handleFormDataChange}
                errors={errors}
                mode={mode}
              />
            );
          case 'webinar':
            return (
              <WebinarFields
                formData={formData}
                onChange={handleFormDataChange}
                errors={errors}
                mode={mode}
              />
            );
          case 'personal':
            return (
              <PersonalFields
                formData={formData}
                onChange={handleFormDataChange}
                errors={errors}
                mode={mode}
              />
            );
          default:
            return (
              <div className="text-center py-8">
                <p className="text-gray-500">해당 일정 타입의 추가 설정이 필요하지 않습니다.</p>
              </div>
            );
        }

      case MODAL_STEPS.REVIEW:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">일정 확인</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">유형:</span>
                <span className="ml-2 text-sm text-gray-900">{TYPE_LABELS[formData.type]}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">제목:</span>
                <span className="ml-2 text-sm text-gray-900">{formData.title}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">시간:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(formData.startDateTime).toLocaleString('ko-KR')} ~
                  {new Date(formData.endDateTime).toLocaleString('ko-KR')}
                </span>
              </div>
              {formData.description && (
                <div>
                  <span className="text-sm font-medium text-gray-500">설명:</span>
                  <p className="mt-1 text-sm text-gray-900">{formData.description}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* 모달 배경 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className={`fixed inset-0 z-50 overflow-y-auto ${className}`}>
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {mode === 'create' ? '새 일정 만들기' :
                   mode === 'edit' ? '일정 수정' :
                   '일정 상세'}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 바디 */}
            <div className="px-6 py-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
              {renderStepIndicator()}
              {renderStepContent()}
              {errors.submit && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between">
                <div>
                  {currentStep > MODAL_STEPS.TYPE_SELECTION && mode !== 'view' && (
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      이전
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {mode === 'view' ? '닫기' : '취소'}
                  </button>
                  {mode !== 'view' && (
                    currentStep === MODAL_STEPS.REVIEW ? (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSubmitting ? '저장 중...' :
                         mode === 'edit' ? '수정하기' : '생성하기'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        다음
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UniversalScheduleModal;