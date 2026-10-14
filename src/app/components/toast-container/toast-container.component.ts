import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastPosition } from 'src/app/models/toast.model';
import { ToastService } from 'src/app/services/toast.service';
import { ToastComponent } from '../toast/toast.component';

/**
 * Global host that renders every active toast grouped by anchor position.
 *
 * Single responsibility: subscribe (through the injected service) to the
 * reactive toast collection and render the corresponding stacks. It performs
 * no state mutation beyond forwarding dismissal requests to the service.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    @for (group of toastService.groups(); track group.position) {
      <section class="toast-stack" [class]="stackClasses(group.position)">
        @for (toast of group.toasts; track toast.id) {
          <app-toast
            [toast]="toast"
            (dismissed)="toastService.dismiss($event)"
          ></app-toast>
        }
      </section>
    }
  `,
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent {
  public constructor(public readonly toastService: ToastService) {}

  /** CSS classes that anchor a stack to its configured screen region. */
  public stackClasses(position: ToastPosition): string {
    const base = 'pointer-events-none fixed z-[9999] flex flex-col gap-3';

    switch (position) {
      case 'top-left':
        return `${base} top-4 left-4 items-start`;
      case 'top-center':
        return `${base} top-4 left-1/2 -translate-x-1/2 items-center`;
      case 'top-right':
        return `${base} top-4 right-4 items-end`;
      case 'bottom-left':
        return `${base} bottom-4 left-4 items-start`;
      case 'bottom-center':
        return `${base} bottom-4 left-1/2 -translate-x-1/2 items-center`;
      case 'bottom-right':
        return `${base} bottom-4 right-4 items-end`;
      default:
        return `${base} top-4 right-4 items-end`;
    }
  }
}
