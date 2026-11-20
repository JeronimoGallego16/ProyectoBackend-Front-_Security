import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { DynamicFormComponent } from './dynamic-form.component';

describe('DynamicFormComponent', () => {
  let fixture: ComponentFixture<DynamicFormComponent>;
  let component: DynamicFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({
      isThirdPlace: new FormControl(false),
    });
    component.fields = [
      {
        name: 'isThirdPlace',
        label: 'Third-place match',
        type: 'checkbox',
      },
    ];
  });

  it('renders checkbox fields outside a Material form field', () => {
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('mat-form-field')
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('mat-checkbox')
    ).not.toBeNull();
  });
});
