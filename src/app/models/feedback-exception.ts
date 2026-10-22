import { ToastType } from './toast.model';

/**
 * Frontend equivalent of the backend ApplicationException:
 * carries a stable code and a human readable message.
 */
export class FeedbackException {
  public readonly code: string;
  public readonly message: string;
  public readonly type?: ToastType;
  public readonly title?: string;

  constructor(code: string, message: string, type?: ToastType, title?: string) {
    this.code = code;
    this.message = message;
    this.type = type;
    this.title = title;
  }
}
