/**
 * Shared HTTP-like status codes used by toast notifications.
 *
 * Kept as a small constant object instead of a large enum so pages only import
 * what they need without coupling domain messages to a heavy model.
 */
export const HTTP_CODE = {
  OK: '200',
  CREATED: '201',
  NO_CONTENT: '204',
  BAD_REQUEST: '400',
  NOT_FOUND: '404',
  CONFLICT: '409',
  SERVER_ERROR: '500',
  CANCELLED: 'CANCELLED',
  INFO: 'INFO',
} as const;

export type HttpFeedbackCode = (typeof HTTP_CODE)[keyof typeof HTTP_CODE];
