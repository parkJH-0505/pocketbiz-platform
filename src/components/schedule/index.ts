/**
 * Schedule Components Export
 *
 * 스케줄 관련 컴포넌트들을 통합 내보내기
 */

// Main Modal Component
export { UniversalScheduleModal } from './UniversalScheduleModal';
export { default as UniversalScheduleModalDefault } from './UniversalScheduleModal';

// Field Components
export { CommonScheduleFields } from './CommonScheduleFields';
export { default as CommonScheduleFieldsDefault } from './CommonScheduleFields';

export { BuildupMeetingFields } from './BuildupMeetingFields';
export { default as BuildupMeetingFieldsDefault } from './BuildupMeetingFields';

// Type Selector
export { ScheduleTypeSelector } from './ScheduleTypeSelector';
export { default as ScheduleTypeSelectorDefault } from './ScheduleTypeSelector';

// Calendar Header
export { default as CalendarHeader } from './CalendarHeader';
export type { CalendarHeaderProps } from './CalendarHeader';

// Calendar Content
export { default as CalendarContent } from './CalendarContent';
export type { CalendarContentProps } from './CalendarContent';

// Types
export type {
  ScheduleFormData,
  UniversalScheduleModalProps,
  StepComponentProps,
  TypeSpecificFieldsProps,
  ScheduleTypeSelectorProps,
  ValidationErrors,
  ModalMode,
  PhaseTransitionInfo,
  FormFieldConfig,
  FieldConfigByType
} from './types';

// Constants
export {
  MODAL_STEPS,
  STEP_LABELS,
  TYPE_ICONS,
  TYPE_LABELS
} from './types';

// Utility Functions
export {
  // Form Data
  initializeFormData,
  mapScheduleToFormData,
  mapFormDataToSchedule,
  resetTypeSpecificFields,

  // Phase Transition
  getPhaseTransitionTrigger,
  getMeetingSequenceNumber,
  getPhaseTransitionInfo,
  getMeetingSequenceLabel,

  // Validation
  validateScheduleData,
  getFieldError,
  isFormValid,

  // Date & Time
  formatDateTimeLocal,
  parseDateTimeLocal,
  formatScheduleDateTime
} from './utils';

// Type Guards
export {
  isBuildupProjectFormData,
  isMentorSessionFormData
} from './types';