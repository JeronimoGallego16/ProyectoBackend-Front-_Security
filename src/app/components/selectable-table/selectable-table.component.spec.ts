import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Permission } from 'src/app/models/permission.model';
import { SelectableTableComponent } from './selectable-table.component';

describe('SelectableTableComponent', () => {
  let component: SelectableTableComponent;
  let fixture: ComponentFixture<SelectableTableComponent>;

  const permissions: Permission[] = [
    { id: 1, entity: 'UserRole', method: 'GET', url: '/api/user-roles' },
    {
      id: 2,
      entity: 'UserRole',
      method: 'GET',
      url: '/api/user-roles/roles/{id}',
    },
    {
      id: 3,
      entity: 'UserRole',
      method: 'PATCH',
      url: '/api/user-roles/{id}',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectableTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectableTableComponent);
    component = fixture.componentInstance;
    component.permissions = permissions;
  });

  it('creates a method column for each method found in the permission catalog', () => {
    expect(component.methods).toEqual(['GET', 'PATCH']);
  });

  it('renders every route as an independent checkbox within its entity-method cell', () => {
    fixture.detectChanges();

    const checkboxes = fixture.nativeElement.querySelectorAll('mat-checkbox');
    const text = fixture.nativeElement.textContent as string;

    expect(checkboxes.length).toBe(3);
    expect(text).toContain('/api/user-roles');
    expect(text).toContain('/api/user-roles/roles/{id}');
    expect(text).toContain('/api/user-roles/{id}');
  });

  it('emits selected permission IDs without merging routes in the same cell', () => {
    component.selectedPermissionIds = [1];
    const selectionChange = jasmine.createSpy('selectionChange');
    component.selectedPermissionIdsChange.subscribe(selectionChange);

    component.togglePermission(2, true);

    expect(selectionChange).toHaveBeenCalledOnceWith([1, 2]);
  });

  it('removes only the permission whose checkbox was unchecked', () => {
    component.selectedPermissionIds = [1, 2, 3];
    const selectionChange = jasmine.createSpy('selectionChange');
    component.selectedPermissionIdsChange.subscribe(selectionChange);

    component.togglePermission(2, false);

    expect(selectionChange).toHaveBeenCalledOnceWith([1, 3]);
  });
});
