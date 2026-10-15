import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';
import { ToastOptions } from '../models/toast.model';

/**
 * Single responsibility: expose convenience helpers to publish toast
 * notifications always attaching a stable (HTTP-like) code.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private readonly toastService: ToastService) {}

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
