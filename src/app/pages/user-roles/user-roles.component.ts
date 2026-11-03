import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { EMPTY, forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { Role } from 'src/app/models/role.model';
import { User } from 'src/app/models/user.model';
import { UserRole, UserRoleReference } from 'src/app/models/user-role.model';
import { UserRoleRequestDTO } from 'src/app/models/dtos/user-role-request.dto';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { RoleService } from 'src/app/services/role.service';
import { UserRoleService } from 'src/app/services/user-role.service';
import { UserService } from 'src/app/services/user.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [CommonModule, MaterialModule, ConfirmDialogComponent],
  templateUrl: './user-roles.component.html',
  styleUrls: ['./user-roles.component.scss'],
})
export class UserRolesComponent implements OnInit {
  public roles: Role[] = [];
  public users: User[] = [];
  public assignedUsers: User[] = [];
  public availableUsers: User[] = [];
  public selectedUserIds = new Set<number>();
  public selectedRole: Role | null = null;
  public pendingRemoval: User | null = null;
  public isLoading = false;
  public isSaving = false;
  public confirmRemovalOpen = false;
  public assignmentLoadError: string | null = null;
  public rolesPageIndex = 0;
  public usersPageIndex = 0;
  public readonly pageSize = 10;

  private assignments: UserRole[] = [];

  public get pagedRoles(): Role[] {
    return this.roles.slice(this.rolesPageIndex * this.pageSize, (this.rolesPageIndex + 1) * this.pageSize);
  }

  public get pagedUsers(): User[] {
    return this.users.slice(this.usersPageIndex * this.pageSize, (this.usersPageIndex + 1) * this.pageSize);
  }

  public onRolesPageChange(event: PageEvent): void {
    this.rolesPageIndex = event.pageIndex;
  }

  public onUsersPageChange(event: PageEvent): void {
    this.usersPageIndex = event.pageIndex;
  }

  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService,
    private readonly userRoleService: UserRoleService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {}

  public ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      roles: this.roleService.findAll().pipe(
        catchError(() => {
          this.feedbackHandlerService.error(
            FeedbackCase.SERVER_ERROR,
            'Could not load roles. Please try again.'
          );
          return of([] as Role[]);
        })
      ),
      users: this.userService.findAll().pipe(
        catchError(() => {
          this.feedbackHandlerService.error(
            FeedbackCase.SERVER_ERROR,
            'Could not load users. Please try again.'
          );
          return of([] as User[]);
        })
      ),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(({ roles, users }) => {
        this.roles = roles;
        this.users = users;
        this.rolesPageIndex = 0;
        this.usersPageIndex = 0;
      });
  }

  public onRoleSelect(role: Role): void {
    this.selectedRole = role;
    this.selectedUserIds.clear();
    this.assignments = [];
    this.assignedUsers = [];
    this.availableUsers = [];
    this.assignmentLoadError = null;
    this.isLoading = true;

    this.userRoleService
      .findByRoleId(role.id)
      .pipe(
        catchError(() => {
          const message =
            'Could not load this role assignments. Check your session and try again.';
          this.assignmentLoadError = message;
          this.feedbackHandlerService.error(
            FeedbackCase.SERVER_ERROR,
            message
          );
          return EMPTY;
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe((assignments) => {
        this.assignments = assignments;
        this.refreshUserLists();
      });
  }

  public toggleUser(userId: number): void {
    if (this.isAssigned(userId)) {
      return;
    }

    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  }

  public assignSelectedUsers(): void {
    if (!this.selectedRole || this.selectedUserIds.size === 0) {
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Select at least one available user.'
      );
      return;
    }

    const roleId = this.selectedRole.id;
    const requests: Observable<UserRole>[] = Array.from(this.selectedUserIds).map(
      (userId): Observable<UserRole> =>
        this.userRoleService.create({ userId, roleId } satisfies UserRoleRequestDTO)
    );

    this.isSaving = true;
    forkJoin(requests)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.CREATED,
            'Users assigned successfully.'
          );
          this.onRoleSelect(this.selectedRole!);
        },
        error: (error) => {
          if (error?.status === 409) {
            this.feedbackHandlerService.error(
              FeedbackCase.CONFLICT,
              'One or more selected users already have this role.'
            );
            return;
          }
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not assign users to the role.'
          );
        },
      });
  }

  public requestRemoval(user: User): void {
    this.pendingRemoval = user;
    this.confirmRemovalOpen = true;
  }

  public cancelRemoval(): void {
    this.confirmRemovalOpen = false;
    this.pendingRemoval = null;
  }

  public confirmRemoval(): void {
    if (!this.selectedRole || !this.pendingRemoval) {
      return;
    }

    this.isSaving = true;
    this.userRoleService
      .delete(this.pendingRemoval.id, this.selectedRole.id)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Role removed from the user.'
          );
          this.cancelRemoval();
          this.onRoleSelect(this.selectedRole!);
        },
        error: (error) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not remove the role from the user.'
          ),
      });
  }

  public isSelected(userId: number): boolean {
    return this.selectedUserIds.has(userId);
  }

  public isAssigned(userId: number): boolean {
    return this.assignments.some(
      (assignment) => this.getAssignmentUserId(assignment) === userId
    );
  }

  private refreshUserLists(): void {
    const assignedIds = new Set(
      this.assignments
        .map((assignment) => this.getAssignmentUserId(assignment))
        .filter((userId): userId is number => userId !== undefined)
    );
    this.assignedUsers = this.users.filter((user) => assignedIds.has(user.id));
    this.availableUsers = this.users.filter((user) => !assignedIds.has(user.id));
    this.selectedUserIds = new Set(
      Array.from(this.selectedUserIds).filter((id) =>
        this.availableUsers.some((user) => user.id === id)
      )
    );
  }

  private getReferenceId(reference: UserRoleReference | undefined): number | undefined {
    const id = typeof reference === 'number' ? reference : reference?.id;
    return id === undefined ? undefined : Number(id);
  }

  private getAssignmentUserId(assignment: UserRole): number | undefined {
    const userId = assignment.userId ?? this.getReferenceId(assignment.user);
    return userId === undefined ? undefined : Number(userId);
  }

}
