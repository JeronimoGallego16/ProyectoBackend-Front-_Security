import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AppSettings } from 'src/app/config';
import { MaterialModule } from 'src/app/material.module';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CoreService } from 'src/app/services/core.service';
import { AuthService } from 'src/app/services/auth.service';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { FeedbackCase } from 'src/app/models/feedback-case';

@Component({
  selector: 'app-header',
  imports: [
    MaterialModule,
    TablerIconsModule,
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() optionsChange = new EventEmitter<AppSettings>();
  isLoggingOut = false;
  public options = this.settings.getOptions();

  constructor(
    private readonly settings: CoreService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {}

  public setLightDark(theme: 'light' | 'dark'): void {
    this.options = { ...this.options, theme };
    this.optionsChange.emit(this.options);
  }

  /**
   * Navigates to the profile page for the authenticated user.
   */
  public navigateToProfile(): void {
    void this.router.navigate(['/profiles']);
  }

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.authService
      .logout()
      .pipe(finalize(() => (this.isLoggingOut = false)))
      .subscribe({
        next: () => this.router.navigate(['/authentication/login']),
        error: (error: unknown) =>
          this.feedbackHandlerService.error(
            error instanceof HttpErrorResponse
              ? String(error.status || FeedbackCase.SERVER_ERROR)
              : FeedbackCase.SERVER_ERROR,
            'Could not log out. Please try again.'
          ),
      });
  }

}