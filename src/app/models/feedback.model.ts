import { ToastOptions, ToastType } from './toast.model';

/**
 * Stable codes shared between the frontend and the backend semantics.
 * They are displayed next to the toast message so the user can reference
 * what just happened (success, error, warning or info).
 */
export enum FeedbackCode {
  // Generic
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',

  // Roles page
  ROLE_LOAD_ERROR = 'ROLE_LOAD_ERROR',
  ROLE_CREATE_SUCCESS = 'ROLE_CREATE_SUCCESS',
  ROLE_UPDATE_SUCCESS = 'ROLE_UPDATE_SUCCESS',
  ROLE_DELETE_SUCCESS = 'ROLE_DELETE_SUCCESS',
  ROLE_SAVE_ERROR = 'ROLE_SAVE_ERROR',
  ROLE_DELETE_ERROR = 'ROLE_DELETE_ERROR',
  ROLE_DELETE_CANCELLED = 'ROLE_DELETE_CANCELLED',
  ROLE_FORM_INVALID = 'ROLE_FORM_INVALID',
  ROLE_VIEW_INFO = 'ROLE_VIEW_INFO',

  // Profiles page
  PROFILE_LOAD_ERROR = 'PROFILE_LOAD_ERROR',
  PROFILE_CREATE_SUCCESS = 'PROFILE_CREATE_SUCCESS',
  PROFILE_UPDATE_SUCCESS = 'PROFILE_UPDATE_SUCCESS',
  PROFILE_DELETE_SUCCESS = 'PROFILE_DELETE_SUCCESS',
  PROFILE_SAVE_ERROR = 'PROFILE_SAVE_ERROR',
  PROFILE_DELETE_ERROR = 'PROFILE_DELETE_ERROR',
  PROFILE_DELETE_CANCELLED = 'PROFILE_DELETE_CANCELLED',
  PROFILE_FORM_INVALID = 'PROFILE_FORM_INVALID',
  PROFILE_VIEW_INFO = 'PROFILE_VIEW_INFO',
  PROFILE_ALREADY_EXISTS = 'PROFILE_ALREADY_EXISTS',
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  PROFILE_CANCELLED = 'PROFILE_CANCELLED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_LOAD_ERROR = 'USER_LOAD_ERROR',
}

/**
 * Canonical description of a piece of user feedback.
 */
export interface Feedback {
  /** Stable identifier of the event. */
  code: FeedbackCode | string;
  /** Human readable message shown in the toast. */
  message: string;
  /** Visual variant of the toast. */
  type?: ToastType;
  /** Optional bold heading displayed above the message. */
  title?: string;
  /** Extra overrides forwarded to {@link ToastOptions}. */
  options?: Partial<Omit<ToastOptions, 'message' | 'type' | 'code'>>;
}
