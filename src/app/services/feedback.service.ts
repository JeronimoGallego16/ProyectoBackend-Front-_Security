import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';
import { ToastOptions, ToastType } from '../models/toast.model';
import { Feedback, FeedbackCode } from '../models/feedback.model';

/**
 * Single responsibility: translate a domain-level {@link Feedback} into a
 * published toast notification, always attaching its code to the message.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private readonly toastService: ToastService) {}

  public publish(feedback: Feedback): number {
    const type: ToastType = feedback.type ?? 'info';
    const options: Partial<ToastOptions> = {
      ...feedback.options,
      title: feedback.title ?? feedback.options?.title,
      code: String(feedback.code),
    };

    switch (type) {
      case 'success':
        return this.toastService.success(feedback.message, options);
      case 'error':
        return this.toastService.error(feedback.message, options);
      case 'warning':
        return this.toastService.warning(feedback.message, options);
      case 'info':
      default:
        return this.toastService.info(feedback.message, options);
    }
  }

  public success(code: FeedbackCode | string, message: string, options: Partial<ToastOptions> = {}): number {
    return this.toastService.success(message, { ...options, code: String(code) });
  }

  public error(code: FeedbackCode | string, message: string, options: Partial<ToastOptions> = {}): number {
    return this.toastService.error(message, { ...options, code: String(code) });
  }

  public warning(code: FeedbackCode | string, message: string, options: Partial<ToastOptions> = {}): number {
    return this.toastService.warning(message, { ...options, code: String(code) });
  }

  public info(code: FeedbackCode | string, message: string, options: Partial<ToastOptions> = {}): number {
    return this.toastService.info(message, { ...options, code: String(code) });
  }
}
