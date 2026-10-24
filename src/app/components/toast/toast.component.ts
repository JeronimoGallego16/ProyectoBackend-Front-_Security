import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { Toast } from 'src/app/models/toast.model';

/**
 * Presentational component responsible for rendering a single toast notification.
 *
 * Single responsibility: display one toast (icon, title, message, dismiss button)
 * and notify the host when the user (or its own timer) requests dismissal.
 * It does not own the collection of toasts.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input({ required: true }) public toast!: Toast; // Toast instance to render.
  @Output() public dismissed = new EventEmitter<number>(); // Emits the toast id when it should be removed.

  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

  public ngOnInit(): void {
    if (this.toast.duration > 0) {
      this.autoDismissTimer = setTimeout(() => this.dismiss(), this.toast.duration);
    }
  }

  public ngOnDestroy(): void {
    if (this.autoDismissTimer !== null) {
      clearTimeout(this.autoDismissTimer);
    }
  }

  /** Requests dismissal of this toast. */
  public dismiss(): void {
    this.dismissed.emit(this.toast.id);
  }

  /** Tailwind classes applied to the whole toast card based on its variant. */
  public cardClasses(): string {
    const base =
      'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border-l-4 ' +
      'px-4 py-3 shadow-md backdrop-blur-sm transition-all text-black';

    switch (this.toast.type) {
      case 'success':
        return `${base} border-success bg-light-success`;
      case 'error':
        return `${base} border-error bg-light-error`;
      case 'warning':
        return `${base} border-warning bg-light-warning`;
      case 'info':
      default:
        return `${base} border-info bg-light-info`;
    }
  }

  /** Tailwind color class applied to the variant icon. */
  public iconColorClass(): string {
    switch (this.toast.type) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      case 'info':
      default:
        return 'text-info';
    }
  }

  /** Material icon name used for the variant badge. */
  public iconName(): string {
    switch (this.toast.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  }

  /** Tailwind classes for the small icon badge container. */
  public iconBadgeClasses(): string {
    return 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/60';
  }
}
