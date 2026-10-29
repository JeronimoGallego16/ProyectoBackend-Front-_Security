/**
 * Stable codes used by toast notifications, similar to the backend ErrorCase.
 */
export enum FeedbackCase {
  OK = '200',
  CREATED = '201',
  NO_CONTENT = '204',
  BAD_REQUEST = '400',
  UNAUTHORIZED = '401',
  NOT_FOUND = '404',
  CONFLICT = '409',
  SERVER_ERROR = '500',
  CANCELLED = 'CANCELLED',
  INFO = 'INFO',
}
