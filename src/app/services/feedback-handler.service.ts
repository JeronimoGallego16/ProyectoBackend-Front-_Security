import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';
import { ToastOptions } from '../models/toast.model';
import { FeedbackException } from '../models/feedback-exception';

/**
 * Single responsibility: translate a frontend feedback case (similar to the
 * backend ApplicationException) into a published toast notification.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackHandlerService {
  constructor(private readonly toastService: ToastService) {}

  public publish(feedback: FeedbackException, options: Partial<ToastOptions> = {}): number {
    const type = feedback.type ?? 'info';
    const mergedOptions: Partial<ToastOptions> = {
      ...options,
      title: feedback.title ?? options.title,
      code: feedback.code,
    };

    switch (type) {
      case 'success':
        return this.toastService.success(feedback.message, mergedOptions);
      case 'error':
        return this.toastService.error(feedback.message, mergedOptions);
      case 'warning':
        return this.toastService.warning(feedback.message, mergedOptions);
      case 'info':
      default:
        return this.toastService.info(feedback.message, mergedOptions);
    }
  }

  public success(code: string, message: string, options: Partial<ToastOptions> = {}): number {
    return this.toastService.success(message, { ...options, code });
  }

  public error(code: string, message: string, options: Partial<ToastOptions> = {}): number {
    return this.toastService.error(message, { ...options, code });
  }

  public warning(code: string, message: string, options: Partial<ToastOptions> = {}): number {
    return this.toastService.warning(message, { ...options, code });
  }

  public info(code: string, message: string, options: Partial<ToastOptions> = {}): number {
    return this.toastService.info(message, { ...options, code });
  }
}
