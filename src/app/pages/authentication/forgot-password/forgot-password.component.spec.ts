import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { PasswordRecoveryService } from 'src/app/services/password-recovery.service';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let recoveryService: jasmine.SpyObj<PasswordRecoveryService>;

  beforeEach(async () => {
    recoveryService = jasmine.createSpyObj<PasswordRecoveryService>(
      'PasswordRecoveryService',
      ['requestRecovery']
    );

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        { provide: PasswordRecoveryService, useValue: recoveryService },
      ],
    })
      .overrideComponent(ForgotPasswordComponent, {
        set: { template: '', imports: [ReactiveFormsModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
  });

  it('does not request recovery for an invalid email', () => {
    component.form.controls.email.setValue('not-an-email');

    component.submit();

    expect(recoveryService.requestRecovery).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBeTrue();
  });

  it('shows the neutral message returned by the backend', () => {
    const message =
      'Si existe una cuenta compatible, recibirás instrucciones para recuperar la contraseña.';
    recoveryService.requestRecovery.and.returnValue(of({ message }));
    component.form.controls.email.setValue('user@example.com');

    component.submit();

    expect(recoveryService.requestRecovery).toHaveBeenCalledOnceWith(
      'user@example.com'
    );
    expect(component.confirmationMessage).toBe(message);
    expect(component.errorMessage).toBe('');
  });

  it('shows a neutral error when the request fails', () => {
    recoveryService.requestRecovery.and.returnValue(
      throwError(() => new Error('backend failure'))
    );
    component.form.controls.email.setValue('user@example.com');

    component.submit();

    expect(component.confirmationMessage).toBe('');
    expect(component.errorMessage).toContain('No se pudo procesar la solicitud');
  });
});
