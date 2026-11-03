import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PasswordRecoveryService } from 'src/app/services/password-recovery.service';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let recoveryService: jasmine.SpyObj<PasswordRecoveryService>;
  let queryToken: string | null;

  const setValidPasswords = (): void => {
    component.form.controls.newPassword.setValue('ValidPass1!');
    component.form.controls.confirmPassword.setValue('ValidPass1!');
  };

  beforeEach(async () => {
    queryToken = 'recovery-token';
    recoveryService = jasmine.createSpyObj<PasswordRecoveryService>(
      'PasswordRecoveryService',
      ['resetPassword']
    );

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useFactory: () => ({
            snapshot: {
              queryParamMap: convertToParamMap(
                queryToken ? { token: queryToken } : {}
              ),
            },
          }),
        },
        { provide: PasswordRecoveryService, useValue: recoveryService },
      ],
    }).compileComponents();
  });

  it('rejects passwords that violate the shared password policy', () => {
    createComponent();
    component.form.controls.newPassword.setValue('password');
    component.form.controls.confirmPassword.setValue('password');

    component.submit();

    expect(component.form.controls.newPassword.hasError('pattern')).toBeTrue();
    expect(recoveryService.resetPassword).not.toHaveBeenCalled();
  });

  it('requires matching password confirmation', () => {
    createComponent();
    component.form.controls.newPassword.setValue('ValidPass1!');
    component.form.controls.confirmPassword.setValue('DifferentPass1!');

    component.submit();

    expect(component.form.hasError('passwordsMismatch')).toBeTrue();
    expect(component.showPasswordMismatch).toBeTrue();
    expect(component.form.controls.confirmPassword.touched).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Las contraseñas no coinciden.'
    );
    expect(recoveryService.resetPassword).not.toHaveBeenCalled();
  });

  it('updates the mismatch feedback as the confirmation changes', () => {
    createComponent();
    component.form.controls.newPassword.setValue('ValidPass1!');
    component.form.controls.confirmPassword.setValue('DifferentPass1!');
    component.form.controls.confirmPassword.markAsTouched();

    expect(component.showPasswordMismatch).toBeTrue();

    component.form.controls.confirmPassword.setValue('ValidPass1!');

    expect(component.showPasswordMismatch).toBeFalse();
  });

  it('toggles visibility independently for each password field', () => {
    createComponent();

    component.toggleNewPasswordVisibility();
    expect(component.isNewPasswordVisible).toBeTrue();
    expect(component.isConfirmPasswordVisible).toBeFalse();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
        'input[formControlName="newPassword"]'
      )?.type
    ).toBe('text');

    component.toggleNewPasswordVisibility();
    component.toggleConfirmPasswordVisibility();
    expect(component.isNewPasswordVisible).toBeFalse();
    expect(component.isConfirmPasswordVisible).toBeTrue();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
        'input[formControlName="newPassword"]'
      )?.type
    ).toBe('password');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
        'input[formControlName="confirmPassword"]'
      )?.type
    ).toBe('text');
  });

  it('submits the token from the URL and reports confirmed success', () => {
    createComponent();
    recoveryService.resetPassword.and.returnValue(of(void 0));
    setValidPasswords();

    component.submit();

    expect(recoveryService.resetPassword).toHaveBeenCalledOnceWith(
      'recovery-token',
      'ValidPass1!'
    );
    expect(component.isComplete).toBeTrue();
  });

  it('shows an invalid-link state for an expired or consumed token', () => {
    createComponent();
    recoveryService.resetPassword.and.returnValue(
      throwError(() => ({ status: 400 }))
    );
    setValidPasswords();

    component.submit();

    expect(component.isInvalidToken).toBeTrue();
    expect(component.errorMessage).toBe('');
  });

  it('does not submit when the URL contains no recovery token', () => {
    queryToken = null;
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    setValidPasswords();

    component.submit();

    expect(component.isInvalidToken).toBeTrue();
    expect(recoveryService.resetPassword).not.toHaveBeenCalled();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }
});
