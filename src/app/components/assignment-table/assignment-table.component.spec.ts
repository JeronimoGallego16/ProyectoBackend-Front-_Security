import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignmentTableComponent } from './assignment-table.component';

describe('AssignmentTableComponent', () => {
  let fixture: ComponentFixture<AssignmentTableComponent>;
  let component: AssignmentTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignmentTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignmentTableComponent);
    component = fixture.componentInstance;
    component.columns = [{ header: 'Name' }];
    component.rows = [
      {
        id: 17,
        values: ['Alex'],
        status: 'Available',
        selectable: true,
        selected: false,
        actionHint: 'Select to assign',
      },
      {
        id: 23,
        values: ['Sam'],
        status: 'Assigned',
        actionLabel: 'Remove role',
        actionIcon: 'person_remove',
      },
    ];
  });

  it('emits the row identifier when a selection checkbox changes', () => {
    const selectionChange = jasmine.createSpy('selectionChange');
    component.selectionChange.subscribe(selectionChange);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    checkbox.dispatchEvent(new Event('change'));

    expect(selectionChange).toHaveBeenCalledOnceWith(17);
  });

  it('disables selection and row actions while the parent is saving', () => {
    component.disabled = true;
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    const actionButton = fixture.nativeElement.querySelector(
      'button'
    ) as HTMLButtonElement;

    expect(checkbox.disabled).toBeTrue();
    expect(actionButton.disabled).toBeTrue();
  });

  it('emits the row identifier when its action is activated', () => {
    const action = jasmine.createSpy('action');
    component.action.subscribe(action);
    fixture.detectChanges();

    const actionButton = fixture.nativeElement.querySelector(
      'button'
    ) as HTMLButtonElement;
    actionButton.click();

    expect(action).toHaveBeenCalledOnceWith(23);
  });

  it('renders the status column for every assignment table', () => {
    fixture.detectChanges();

    const headerElements = fixture.nativeElement.querySelectorAll(
      'th'
    ) as NodeListOf<HTMLElement>;
    const headers = Array.from(headerElements).map(
      (header) => header.textContent?.trim() ?? ''
    );

    expect(headers).toEqual(['Name', 'Status', 'Action']);
  });
});
