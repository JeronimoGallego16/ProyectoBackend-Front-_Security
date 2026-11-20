import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntitySelectorComponent } from './entity-selector.component';

describe('EntitySelectorComponent', () => {
  let fixture: ComponentFixture<EntitySelectorComponent>;
  let component: EntitySelectorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntitySelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntitySelectorComponent);
    component = fixture.componentInstance;
    component.title = 'Roles';
    component.options = [
      { id: 2, label: 'Administrator', description: 'Full access' },
      { id: 5, label: 'Auditor' },
    ];
  });

  it('displays the heading and entity labels', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Roles');
    expect(text).toContain('Administrator');
    expect(text).toContain('Full access');
    expect(text).toContain('Auditor');
  });

  it('emits the selected entity identifier', () => {
    const selectionChange = jasmine.createSpy('selectionChange');
    component.selectionChange.subscribe(selectionChange);
    fixture.detectChanges();

    const optionButtons = fixture.nativeElement.querySelectorAll(
      'button'
    ) as NodeListOf<HTMLButtonElement>;
    optionButtons[1].click();

    expect(selectionChange).toHaveBeenCalledOnceWith(5);
  });

  it('displays its empty-state message when there are no options', () => {
    component.options = [];
    component.emptyMessage = 'No roles available';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No roles available');
  });
});
