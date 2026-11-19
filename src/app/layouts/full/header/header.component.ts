import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
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
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  isLoggingOut = false;
  public profileImageUrl: string | null = null;

  constructor(
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