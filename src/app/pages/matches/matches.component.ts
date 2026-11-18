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
import {
  CreateMatchDTO,
  UpdateMatchDTO,
} from 'src/app/models/dtos/match-request.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { Match } from 'src/app/models/match.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { MatchService } from 'src/app/services/match.service';

/**
 * Presentation page that coordinates match CRUD actions and shared UI components.
 */
@Component({
  selector: 'app-matches',
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
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.scss'],
})
export class MatchesComponent implements OnInit {
  /**
   * Table columns for the match collection.
   */
  public readonly columns: TableColumn[] = [
    { field: 'matchId', header: 'ID' },
    { field: 'duration', header: 'Duration' },
    { field: 'state', header: 'State' },
    { field: 'homeTeamId', header: 'Home team ID' },
    { field: 'awayTeamId', header: 'Away team ID' },
    { field: 'phaseId', header: 'Phase ID' },
  ];

  /**
   * Form fields rendered by the shared dynamic form component.
   */
  public readonly fields: FormFieldConfig[] = [
    {
      name: 'duration',
      label: 'Duration',
      type: 'text',
      placeholder: 'Match duration',
      hint: 'Required; maximum 50 characters.',
    },
    {
      name: 'state',
      label: 'State',
      type: 'text',
      placeholder: 'Match state',
      hint: 'Required; maximum 50 characters.',
    },
    {
      name: 'homeTeamId',
      label: 'Home team ID',
      type: 'text',
      placeholder: 'Positive integer for an existing team',
    },
    {
      name: 'awayTeamId',
      label: 'Away team ID',
      type: 'text',
      placeholder: 'Positive integer for a different existing team',
    },
    {
      name: 'phaseId',
      label: 'Phase ID',
      type: 'text',
      placeholder: 'Optional numeric phase ID',
      hint: 'Kept in the frontend form, but not sent to the current matches API.',
    },
  ];

  /**
   * Fields displayed in the match detail dialog.
   */
  public readonly detailFields = [
    { key: 'matchId', label: 'ID' },
    { key: 'duration', label: 'Duration' },
    { key: 'state', label: 'State' },
    { key: 'homeTeamId', label: 'Home team ID' },
    { key: 'awayTeamId', label: 'Away team ID' },
    { key: 'phaseId', label: 'Phase ID' },
  ];

  public matches: Match[] = [];
  public matchForm: FormGroup;
  public showForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  public pendingDeleteMatch: Match | null = null;
  public detailOpen = false;
  public selectedMatch: Match | null = null;
  private editingMatchId: number | null = null;
  private originalMatch: Match | null = null;

  /**
   * Creates the matches page and its validated reactive form.
   *
   * @param formBuilder - Angular service used to build the form.
   * @param matchService - Service providing match data access.
   * @param feedbackHandlerService - Service used to publish toast feedback.
   */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly matchService: MatchService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.matchForm = this.formBuilder.group({
      duration: [
        '',
        [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(50),
        ],
      ],
      state: [
        '',
        [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(50),
        ],
      ],
      homeTeamId: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[1-9]\d*$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
      awayTeamId: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[1-9]\d*$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
      phaseId: [
        '',
        [
          Validators.pattern(/^[1-9]\d*$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
    });
  }

  /**
   * Loads the match collection when the page is initialized.
   */
  public ngOnInit(): void {
    this.loadMatches();
  }

  /**
   * Fetches all matches and updates the table.
   */
  public loadMatches(): void {
    this.isLoading = true;
    this.matchService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (matches: Match[]) => (this.matches = matches),
        error: (error: { status?: number }) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not load matches. Please try again.'
          ),
      });
  }

  /**
   * Opens the form in creation mode.
   */
  public onCreateClick(): void {
    this.isEditing = false;
    this.editingMatchId = null;
    this.originalMatch = null;
    this.matchForm.reset(this.emptyFormValue());
    this.showForm = true;
  }

  /**
   * Opens the form with the selected match's values.
   *
   * @param match - Match selected from the table.
   */
  public onEdit(match: Match): void {
    this.isEditing = true;
    this.editingMatchId = match.matchId;
    this.originalMatch = match;
    this.matchForm.reset({
      duration: match.duration,
      state: match.state,
      homeTeamId: String(match.homeTeamId),
      awayTeamId: String(match.awayTeamId),
      phaseId: match.phaseId == null ? '' : String(match.phaseId),
    });
    this.showForm = true;
  }

  /**
   * Opens the detail dialog for a match.
   *
   * @param match - Match selected from the table.
   */
  public onView(match: Match): void {
    this.selectedMatch = match;
    this.detailOpen = true;
  }

  /**
   * Closes the detail dialog and clears its selection.
   */
  public onCloseDetail(): void {
    this.detailOpen = false;
    this.selectedMatch = null;
  }

  /**
   * Opens the confirmation dialog for deleting a match.
   *
   * @param match - Match selected for deletion.
   */
  public onDelete(match: Match): void {
    this.pendingDeleteMatch = match;
    this.confirmDeleteOpen = true;
  }

  /**
   * Deletes the confirmed match and refreshes the table.
   */
  public onConfirmDelete(): void {
    if (!this.pendingDeleteMatch) {
      return;
    }

    const match = this.pendingDeleteMatch;
    this.isLoading = true;
    this.matchService
      .delete(match.matchId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Match deleted successfully.'
          );
          this.confirmDeleteOpen = false;
          this.pendingDeleteMatch = null;
          this.loadMatches();
        },
        error: (error: { status?: number }) => {
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not delete the match. Please try again.'
          );
          this.confirmDeleteOpen = false;
          this.pendingDeleteMatch = null;
        },
      });
  }

  /**
   * Cancels the pending deletion and informs the user.
   */
  public onCancelDelete(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeleteMatch = null;
    this.feedbackHandlerService.info(
      FeedbackCase.CANCELLED,
      'Deletion cancelled.'
    );
  }

  /**
   * Creates a match or patches changed backend-supported fields.
   */
  public onSubmit(): void {
    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Please complete all required fields with valid values before saving.'
      );
      return;
    }

    const formValue = this.getFormValue();
    if (Number(formValue.homeTeamId) === Number(formValue.awayTeamId)) {
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Home and away teams must be different.'
      );
      return;
    }

    const wasEditing = this.isEditing;
    let request$;

    if (wasEditing && this.editingMatchId !== null) {
      const payload = this.buildUpdatePayload(formValue);
      if (Object.keys(payload).length === 0) {
        this.feedbackHandlerService.info(
          FeedbackCase.INFO,
          'No changes to save to the matches API.'
        );
        this.cancelForm();
        return;
      }
      request$ = this.matchService.update(this.editingMatchId, payload);
    } else {
      request$ = this.matchService.create(this.buildCreatePayload(formValue));
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing
            ? 'Match updated successfully.'
            : 'Match created successfully.'
        );
        this.cancelForm();
        this.loadMatches();
      },
      error: (error: { status?: number }) => {
        const message =
          error?.status === 404
            ? 'One or both selected teams do not exist.'
            : error?.status === 409
              ? 'The home and away teams must be different.'
              : 'Could not save the match. Please verify the data and try again.';
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          message
        );
      },
    });
  }

  /**
   * Closes the form and resets its state.
   */
  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingMatchId = null;
    this.originalMatch = null;
    this.matchForm.reset(this.emptyFormValue());
  }

  /**
   * Returns the empty form values used for creating or resetting a match.
   *
   * @returns Empty values for all match form controls.
   */
  private emptyFormValue(): {
    duration: string;
    state: string;
    homeTeamId: string;
    awayTeamId: string;
    phaseId: string;
  } {
    return {
      duration: '',
      state: '',
      homeTeamId: '',
      awayTeamId: '',
      phaseId: '',
    };
  }

  /**
   * Reads and types the current match form values.
   *
   * @returns Form values represented as strings before payload conversion.
   */
  private getFormValue(): {
    duration: string;
    state: string;
    homeTeamId: string;
    awayTeamId: string;
    phaseId: string;
  } {
    return this.matchForm.getRawValue() as {
      duration: string;
      state: string;
      homeTeamId: string;
      awayTeamId: string;
      phaseId: string;
    };
  }

  /**
   * Maps form values to the backend match creation contract.
   *
   * @param formValue - Validated values from the match form.
   * @returns Backend fields with numeric team IDs; phaseId is omitted.
   */
  private buildCreatePayload(
    formValue: ReturnType<MatchesComponent['getFormValue']>
  ): CreateMatchDTO {
    return {
      duration: formValue.duration.trim(),
      state: formValue.state.trim(),
      homeTeamId: Number(formValue.homeTeamId),
      awayTeamId: Number(formValue.awayTeamId),
    };
  }

  /**
   * Maps changed form values to the backend match update contract.
   *
   * @param formValue - Validated values from the match form.
   * @returns Only changed backend-supported fields; phaseId is omitted.
   */
  private buildUpdatePayload(
    formValue: ReturnType<MatchesComponent['getFormValue']>
  ): UpdateMatchDTO {
    const originalMatch = this.originalMatch;
    const payload: UpdateMatchDTO = {};
    const duration = formValue.duration.trim();
    const state = formValue.state.trim();
    const homeTeamId = Number(formValue.homeTeamId);
    const awayTeamId = Number(formValue.awayTeamId);

    if (originalMatch && duration !== originalMatch.duration) {
      payload.duration = duration;
    }
    if (originalMatch && state !== originalMatch.state) {
      payload.state = state;
    }
    if (originalMatch && homeTeamId !== originalMatch.homeTeamId) {
      payload.homeTeamId = homeTeamId;
    }
    if (originalMatch && awayTeamId !== originalMatch.awayTeamId) {
      payload.awayTeamId = awayTeamId;
    }

    return payload;
  }
}
