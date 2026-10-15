/**
 * Visual variants supported by the toast notifications. Each variant maps to a
 * color and an icon in the presentational layer.
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Screen region where a toast stack is anchored. The position is chosen per
 * message, so different notifications can appear in different corners.
 */
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

/**
 * Options accepted when a new toast is requested. Only the message is
 * mandatory; every other value falls back to {@link TOAST_DEFAULTS}.
 */
export interface ToastOptions {
  /** Text shown as the body of the notification. */
  message: string;
  /** Visual variant used to style and pick an icon. */
  type?: ToastType;
  /** Optional bold heading displayed above the message. */
  title?: string;
  /** Optional domain/application code shown next to the message (e.g. ROLE_CREATE_SUCCESS). */
  code?: string;
  /** Milliseconds before the toast auto-dismisses. Use 0 to keep it open. */
  duration?: number;
  /** Screen region where the toast is anchored. */
  position?: ToastPosition;
  /** Whether the user can close the toast manually. */
  dismissible?: boolean;
}

/**
 * Fully resolved toast instance handled by the service and rendered by the UI.
 */
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  title?: string;
  code?: string;
  duration: number;
  position: ToastPosition;
  dismissible: boolean;
}

/**
 * Active toasts anchored to a single screen position.
 */
export interface ToastGroup {
  position: ToastPosition;
  toasts: Toast[];
}

/**
 * Default values applied to any option the caller does not provide.
 */
export const TOAST_DEFAULTS: Required<
  Pick<ToastOptions, 'type' | 'duration' | 'position' | 'dismissible'>
> = {
  type: 'info',
  duration: 4000,
  position: 'top-right',
  dismissible: true,
};

/**
 * Ordered list of every supported anchor position. Used by the container to
 * render the stacks in a deterministic order.
 */
export const TOAST_POSITIONS: readonly ToastPosition[] = [
  'top-right',
  'top-left',
  'top-center',
  'bottom-right',
  'bottom-left',
  'bottom-center',
];
