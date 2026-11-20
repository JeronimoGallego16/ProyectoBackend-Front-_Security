import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { DetailDialogComponent } from 'src/app/components/detail-dialog/detail-dialog.component';
import {
  DynamicFormComponent,
  FormFieldConfig,
} from 'src/app/components/dynamic-form/dynamic-form.component';
import {
  DataTableComponent,
  TableColumn,
} from 'src/app/components/table-list/table-list.component';
import { CreateTeamDTO, UpdateTeamDTO } from 'src/app/models/dtos/business/team-request.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { Team } from 'src/app/models/business/team.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { TeamService } from 'src/app/services/business/team.service';

/**
 * Presentation page that coordinates team CRUD actions and shared UI components.
 */
@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    DataTableComponent,
    DynamicFormComponent,
    ConfirmDialogComponent,
    DetailDialogComponent,
  ],
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
})
export class TeamsComponent implements OnInit {
  /**
   * Table columns for the team collection.
   */
  public readonly columns: TableColumn[] = [
    { field: 'teamId', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'category', header: 'Category' },
  ];

  /**
   * Form fields rendered by the shared dynamic form component.
   */
  public readonly fields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Team name',
      hint: 'Required; maximum 120 characters.',
    },
    {
      name: 'category',
      label: 'Category',
      type: 'text',
      placeholder: 'Team category',
      hint: 'Required; maximum 80 characters.',
    },
  ];

  /**
   * Fields displayed in the team detail dialog.
   */
  public readonly detailFields = [
    { key: 'teamId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
  ];

  public teams: Team[] = [];
  public teamForm: FormGroup;
  public showForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  public pendingDeleteTeam: Team | null = null;
  public detailOpen = false;
  public selectedTeam: Team | null = null;
  private editingTeamId: number | null = null;
  private originalTeam: Team | null = null;

  /**
   * Creates the teams page and its validated reactive form.
   *
   * @param formBuilder - Angular service used to build the form.
   * @param teamService - Service providing team data access.
   * @param feedbackHandlerService - Service used to publish toast feedback.
   */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly teamService: TeamService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.teamForm = this.formBuilder.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(120),
        ],
      ],
      category: [
        '',
        [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(80),
        ],
      ],
    });
  }

  /**
   * Loads the team collection when the page is initialized.
   */
  public ngOnInit(): void {
    this.loadTeams();
  }

  /**
   * Fetches all teams and updates the table.
   */
  public loadTeams(): void {
    this.isLoading = true;
    this.teamService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (teams: Team[]) => (this.teams = teams),
        error: (error: { status?: number }) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not load teams. Please try again.'
          ),
      });
  }

  /**
   * Opens the form in creation mode.
   */
  public onCreateClick(): void {
    this.isEditing = false;
    this.editingTeamId = null;
    this.originalTeam = null;
    this.teamForm.reset({ name: '', category: '' });
    this.showForm = true;
  }

  /**
   * Opens the form with the selected team's values.
   *
   * @param team - Team selected from the table.
   */
  public onEdit(team: Team): void {
    this.isEditing = true;
    this.editingTeamId = team.teamId;
    this.originalTeam = team;
    this.teamForm.reset({
      name: team.name,
      category: team.category,
    });
    this.showForm = true;
  }

  /**
   * Opens the detail dialog for a team.
   *
   * @param team - Team selected from the table.
   */
  public onView(team: Team): void {
    this.selectedTeam = team;
    this.detailOpen = true;
  }

  /**
   * Closes the detail dialog and clears its selection.
   */
  public onCloseDetail(): void {
    this.detailOpen = false;
    this.selectedTeam = null;
  }

  /**
   * Opens the confirmation dialog for deleting a team.
   *
   * @param team - Team selected for deletion.
   */
  public onDelete(team: Team): void {
    this.pendingDeleteTeam = team;
    this.confirmDeleteOpen = true;
  }

  /**
   * Deletes the confirmed team and refreshes the table.
   */
  public onConfirmDelete(): void {
    if (!this.pendingDeleteTeam) {
      return;
    }

    const team = this.pendingDeleteTeam;
    this.isLoading = true;
    this.teamService
      .delete(team.teamId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Team deleted successfully.'
          );
          this.confirmDeleteOpen = false;
          this.pendingDeleteTeam = null;
          this.loadTeams();
        },
        error: (error: { status?: number }) => {
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            error?.status === 409
              ? 'Cannot delete this team because it participates in one or more matches.'
              : 'Could not delete the team. Please try again.'
          );
          this.confirmDeleteOpen = false;
          this.pendingDeleteTeam = null;
        },
      });
  }

  /**
   * Cancels the pending deletion and informs the user.
   */
  public onCancelDelete(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeleteTeam = null;
    this.feedbackHandlerService.info(
      FeedbackCase.CANCELLED,
      'Deletion cancelled.'
    );
  }

  /**
   * Creates a team or patches the changed backend-supported fields.
   */
  public onSubmit(): void {
    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Please complete all required fields with valid values before saving.'
      );
      return;
    }

    const wasEditing = this.isEditing;
    let request$;

    if (wasEditing && this.editingTeamId !== null) {
      const payload = this.buildUpdatePayload();
      if (Object.keys(payload).length === 0) {
        this.feedbackHandlerService.info(
          FeedbackCase.INFO,
          'No changes to save to the teams API.'
        );
        this.cancelForm();
        return;
      }
      request$ = this.teamService.update(this.editingTeamId, payload);
    } else {
      request$ = this.teamService.create(this.buildCreatePayload());
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing
            ? 'Team updated successfully.'
            : 'Team created successfully.'
        );
        this.cancelForm();
        this.loadTeams();
      },
      error: (error: { status?: number }) =>
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          error?.status === 409
            ? 'The team name and category must be unique.'
            : 'Could not save the team. Please verify the data and try again.'
        ),
    });
  }

  /**
   * Closes the form and resets its state.
   */
  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingTeamId = null;
    this.originalTeam = null;
    this.teamForm.reset({ name: '', category: '' });
  }

  /**
   * Maps form values to the backend team creation contract.
   *
   * @returns Team name and category; frontend-only groupId is omitted.
   */
  private buildCreatePayload(): CreateTeamDTO {
    const formValue = this.teamForm.getRawValue() as {
      name: string;
      category: string;
    };

    return {
      name: formValue.name.trim(),
      category: formValue.category.trim(),
    };
  }

  /**
   * Maps changed form values to the backend team update contract.
   *
   * @returns Only changed name or category fields; groupId is omitted.
   */
  private buildUpdatePayload(): UpdateTeamDTO {
    const formValue = this.teamForm.getRawValue() as {
      name: string;
      category: string;
    };
    const originalTeam = this.originalTeam;
    const payload: UpdateTeamDTO = {};
    const name = formValue.name.trim();
    const category = formValue.category.trim();

    if (originalTeam && name !== originalTeam.name) {
      payload.name = name;
    }
    if (originalTeam && category !== originalTeam.category) {
      payload.category = category;
    }

    return payload;
  }
}
