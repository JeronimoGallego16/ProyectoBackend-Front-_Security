import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
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
import { ProfileService } from 'src/app/services/profile.service';
import { Profile } from 'src/app/models/profile.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [
    MaterialModule,
    TablerIconsModule,
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() optionsChange = new EventEmitter<AppSettings>();
  isLoggingOut = false;
  public profileImageUrl: string | null = null;
  public options = this.settings.getOptions();

  constructor(
    private readonly settings: CoreService,
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly router: Router,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {}

  public ngOnInit(): void {
    this.profileService.profileChanges$.subscribe((profile) => this.setProfileImage(profile));
    this.authService.getSession().pipe(
      catchError(() => of(null))
    ).subscribe((session) => {
      if (!session) return;
      this.profileService.findByUserId(session.id).pipe(
        catchError(() => of(null))
      ).subscribe((profile) => this.setProfileImage(profile));
    });
  }

  private setProfileImage(profile: Profile | null): void {
    this.profileImageUrl = this.profileService.resolveImageUrl(profile?.profileImageUrl);
  }

  public setLightDark(theme: 'light' | 'dark'): void {
    this.options = { ...this.options, theme };
    this.optionsChange.emit(this.options);
  }

  /**
   * Navigates to the profile page for the authenticated user.
   */
  public navigateToProfile(): void {
    void this.router.navigate(['/my-profile']);
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