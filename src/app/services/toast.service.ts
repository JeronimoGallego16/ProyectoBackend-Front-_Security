import { Injectable, computed, signal } from '@angular/core';
import {
  TOAST_DEFAULTS,
  TOAST_POSITIONS,
  Toast,
  ToastGroup,
  ToastOptions,
  ToastPosition,
  ToastType,
} from '../models/toast.model';

/**
 * Central authority for toast notifications.
 *
 * Single responsibility: own the reactive collection of toasts and expose a
 * small API to create and dismiss them. It has no knowledge of how a toast
 * looks or where it is rendered, so any page can inject it to publish
 * feedback without dealing with presentation concerns.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  /** Backing store for the active toasts. */
  private readonly toastsState = signal<Toast[]>([]);

  /** Auto-incrementing identifier used to track each toast instance. */
  private nextId = 1;

  /** Read-only view of the active toasts, newest first. */
  public readonly toasts = this.toastsState.asReadonly();

  /**
   * Active toasts grouped by anchor position, including only non-empty groups
   * so the container never renders an unused stack.
   */
  public readonly groups = computed<ToastGroup[]>(() => {
    const toasts = this.toastsState();

    return TOAST_POSITIONS.map((position) => ({
      position,
      toasts: toasts.filter((toast) => toast.position === position),
    })).filter((group) => group.toasts.length > 0);
  });

  /**
   * Publishes a new toast and returns its identifier.
   *
   * @param options - Message plus optional overrides (type, duration, position).
   * @returns The id assigned to the created toast.
   */
  public show(options: ToastOptions): number {
    const id = this.nextId++;
    const toast: Toast = {
      id,
      message: options.message,
      type: options.type ?? TOAST_DEFAULTS.type,
      title: options.title,
      duration: options.duration ?? TOAST_DEFAULTS.duration,
      position: options.position ?? TOAST_DEFAULTS.position,
      dismissible: options.dismissible ?? TOAST_DEFAULTS.dismissible,
    };

    this.toastsState.update((toasts) => [...toasts, toast]);
    return id;
  }

  /**
   * Shorthand for a success toast.
   *
   * @param message - Text shown as the body of the notification.
   * @param options - Additional overrides applied to the toast.
   */
  public success(message: string, options: Partial<ToastOptions> = {}): number {
    return this.show({ ...options, message, type: 'success' });
  }

  /**
   * Shorthand for an error toast.
   *
   * @param message - Text shown as the body of the notification.
   * @param options - Additional overrides applied to the toast.
   */
  public error(message: string, options: Partial<ToastOptions> = {}): number {
    return this.show({ ...options, message, type: 'error' });
  }

  /**
   * Shorthand for a warning toast.
   *
   * @param message - Text shown as the body of the notification.
   * @param options - Additional overrides applied to the toast.
   */
  public warning(message: string, options: Partial<ToastOptions> = {}): number {
    return this.show({ ...options, message, type: 'warning' });
  }

  /**
   * Shorthand for an informational toast.
   *
   * @param message - Text shown as the body of the notification.
   * @param options - Additional overrides applied to the toast.
   */
  public info(message: string, options: Partial<ToastOptions> = {}): number {
    return this.show({ ...options, message, type: 'info' });
  }

  /**
   * Removes a single toast from the collection.
   *
   * @param id - Identifier returned when the toast was created.
   */
  public dismiss(id: number): void {
    this.toastsState.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  /**
   * Removes every active toast. Optionally restricts the removal to one type.
   *
   * @param type - When provided, only toasts of that type are removed.
   */
  public clear(type?: ToastType): void {
    if (!type) {
      this.toastsState.set([]);
      return;
    }

    this.toastsState.update((toasts) => toasts.filter((toast) => toast.type !== type));
  }
}
