import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RolePermissionsComponent } from './role-permissions.component';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { PermissionService } from 'src/app/services/permission.service';
import { RolePermissionService } from 'src/app/services/role-permission.service';
import { RoleService } from 'src/app/services/role.service';
import { Permission } from 'src/app/models/permission.model';
import { Role } from 'src/app/models/role.model';

describe('RolePermissionsComponent', () => {
  let fixture: ComponentFixture<RolePermissionsComponent>;
  let component: RolePermissionsComponent;
  let createAssignment: jasmine.Spy;
  let deleteAssignment: jasmine.Spy;
  let feedbackHandler: jasmine.SpyObj<FeedbackHandlerService>;

  const role: Role = { id: 1, name: 'Admin', description: 'Administrator' };
  const assignedPermissions: Permission[] = [
    { id: 10, url: '/api/widgets/{id}', method: 'GET', entity: 'Widget' },
    { id: 11, url: '/api/widgets/details/{id}', method: 'GET', entity: 'Widget' },
    { id: 12, url: '/api/widgets/{id}', method: 'PATCH', entity: 'Widget' },
  ];

  beforeEach(async () => {
    createAssignment = jasmine.createSpy('create').and.returnValue(of({}));
    deleteAssignment = jasmine.createSpy('delete').and.returnValue(of(undefined));
    feedbackHandler = jasmine.createSpyObj<FeedbackHandlerService>(
      'FeedbackHandlerService',
      ['error', 'success', 'warning', 'info']
    );

    await TestBed.configureTestingModule({
      imports: [RolePermissionsComponent],
      providers: [
        {
          provide: FeedbackHandlerService,
          useValue: feedbackHandler,
        },
        {
          provide: PermissionService,
          useValue: { findAll: () => of(assignedPermissions) },
        },
        {
          provide: RolePermissionService,
          useValue: {
            create: createAssignment,
            delete: deleteAssignment,
          },
        },
        {
          provide: RoleService,
          useValue: {
            findAll: () => of([role]),
            findByIdWithPermissions: () =>
              of({
                ...role,
                permissions: assignedPermissions.map((permission, index) => ({
                  id: index + 1,
                  roleId: role.id,
                  permission,
                })),
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RolePermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.onRoleSelect(role);
  });

  it('preserves assigned permissions when saving without changing the matrix', () => {
    component.onAssignPermissions();

    expect(createAssignment).not.toHaveBeenCalled();
    expect(deleteAssignment).not.toHaveBeenCalled();
    expect(feedbackHandler.info).toHaveBeenCalled();
  });

  it('preserves assigned permission IDs that are absent from the permission catalog', () => {
    component.permissions = [assignedPermissions[0]];

    component.onPermissionSelectionChange([10]);

    expect(component.selectedPermissionIds.sort()).toEqual([10, 11, 12]);
  });

  it('deletes only the assigned permission explicitly unchecked in the matrix', () => {
    component.onPermissionSelectionChange([10, 12]);

    component.onAssignPermissions();

    expect(createAssignment).not.toHaveBeenCalled();
    expect(deleteAssignment).toHaveBeenCalledOnceWith(1, 11);
  });

  it('does not save permissions when role details failed to load', () => {
    component.rolePermissionsLoadError = 'Could not load role details.';

    component.onAssignPermissions();

    expect(createAssignment).not.toHaveBeenCalled();
    expect(deleteAssignment).not.toHaveBeenCalled();
  });
});
