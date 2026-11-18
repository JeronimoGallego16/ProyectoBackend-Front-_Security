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
import { FeedbackCase } from 'src/app/models/feedback-case';
import {
  CreateSportDTO,
  UpdateSportDTO,
} from 'src/app/models/dtos/sport-request.dto';
import { Sport } from 'src/app/models/sport.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { SportService } from 'src/app/services/sport.service';

/**
 * Presentation page that coordinates sport CRUD actions and shared UI components.
 */
@Component({
  selector: 'app-sports',
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
  templateUrl: './sports.component.html',
  styleUrls: ['./sports.component.scss'],
})
export class SportsComponent implements OnInit {
  /**
   * Table columns for the sport collection.
   */
  public readonly columns: TableColumn[] = [
    { field: 'sportId', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'description', header: 'Description' },
    { field: 'parentSportId', header: 'Parent sport ID' },
  ];

  /**
   * Form fields rendered by the shared dynamic form component.
   */
  public readonly fields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Sport name',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Sport description',
    },
    {
      name: 'parentSportId',
      label: 'Parent sport ID',
      type: 'text',
      placeholder: 'Optional numeric parent sport ID',
      hint: 'Leave blank for a root sport. When editing, clearing the value removes its parent.',
    },
  ];

  /**
   * Fields displayed in the sport detail dialog.
   */
  public readonly detailFields = [
    { key: 'sportId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'parentSportId', label: 'Parent sport ID' },
  ];

  public sports: Sport[] = [];
  public sportForm: FormGroup;
  public showForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  public pendingDeleteSport: Sport | null = null;
  public detailOpen = false;
  public selectedSport: Sport | null = null;
  private editingSportId: number | null = null;
  private originalSport: Sport | null = null;

  /**
   * Creates the sports page and its validated reactive form.
   *
   * @param formBuilder - Angular service used to build the form.
   * @param sportService - Service providing sport data access.
   * @param feedbackHandlerService - Service used to publish toast feedback.
   */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly sportService: SportService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.sportForm = this.formBuilder.group({
      name: [
        '',
        [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)],
      ],
      description: ['', [Validators.required, Validators.pattern(/\S/)]],
      parentSportId: [
        '',
        [
          Validators.pattern(/^[1-9]\d*$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
    });
  }

  /**
   * Loads the sport collection when the page is initialized.
   */
  public ngOnInit(): void {
    this.loadSports();
  }

  /**
   * Fetches all sports and updates the table.
   */
  public loadSports(): void {
    this.isLoading = true;
    this.sportService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (sports: Sport[]) => (this.sports = sports),
        error: (error: { status?: number }) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not load sports. Please try again.'
          ),
      });
  }

  /**
   * Opens the form in creation mode.
   */
  public onCreateClick(): void {
    this.isEditing = false;
    this.editingSportId = null;
    this.originalSport = null;
    this.sportForm.reset({ name: '', description: '', parentSportId: '' });
    this.showForm = true;
  }

  /**
   * Opens the form with the selected sport's values.
   *
   * @param sport - Sport selected from the table.
   */
  public onEdit(sport: Sport): void {
    this.isEditing = true;
    this.editingSportId = sport.sportId;
    this.originalSport = sport;
    this.sportForm.reset({
      name: sport.name,
      description: sport.description,
      parentSportId:
        sport.parentSportId === null ? '' : String(sport.parentSportId),
    });
    this.showForm = true;
  }

  /**
   * Opens the detail dialog for a sport.
   *
   * @param sport - Sport selected from the table.
   */
  public onView(sport: Sport): void {
    this.selectedSport = sport;
    this.detailOpen = true;
  }

  /**
   * Closes the detail dialog and clears its selection.
   */
  public onCloseDetail(): void {
    this.detailOpen = false;
    this.selectedSport = null;
  }

  /**
   * Opens the confirmation dialog for deleting a sport.
   *
   * @param sport - Sport selected for deletion.
   */
  public onDelete(sport: Sport): void {
    this.pendingDeleteSport = sport;
    this.confirmDeleteOpen = true;
  }

  /**
   * Deletes the confirmed sport and refreshes the table.
   */
  public onConfirmDelete(): void {
    if (!this.pendingDeleteSport) {
      return;
    }

    const sport = this.pendingDeleteSport;
    this.isLoading = true;
    this.sportService
      .delete(sport.sportId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Sport deleted successfully.'
          );
          this.confirmDeleteOpen = false;
          this.pendingDeleteSport = null;
          this.loadSports();
        },
        error: (error: { status?: number }) => {
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            error?.status === 409
              ? 'Cannot delete this sport because it has subcategories.'
              : 'Could not delete the sport. Please try again.'
          );
          this.confirmDeleteOpen = false;
          this.pendingDeleteSport = null;
        },
      });
  }

  /**
   * Cancels the pending deletion and informs the user.
   */
  public onCancelDelete(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeleteSport = null;
    this.feedbackHandlerService.info(
      FeedbackCase.CANCELLED,
      'Deletion cancelled.'
    );
  }

  /**
   * Creates or updates the sport using the current form values.
   */
  public onSubmit(): void {
    if (this.sportForm.invalid) {
      this.sportForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Please complete all required fields with valid values before saving.'
      );
      return;
    }

    const wasEditing = this.isEditing;
    let request$;

    if (wasEditing && this.editingSportId !== null) {
      const payload = this.buildUpdatePayload();
      if (Object.keys(payload).length === 0) {
        this.feedbackHandlerService.info(
          FeedbackCase.INFO,
          'No changes to save.'
        );
        this.cancelForm();
        return;
      }
      request$ = this.sportService.update(this.editingSportId, payload);
    } else {
      request$ = this.sportService.create(this.buildCreatePayload());
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing
            ? 'Sport updated successfully.'
            : 'Sport created successfully.'
        );
        this.cancelForm();
        this.loadSports();
      },
      error: (error: { status?: number }) =>
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          error?.status === 409
            ? 'The parent sport is invalid or would create a hierarchy cycle.'
            : 'Could not save the sport. Please verify the data and try again.'
        ),
    });
  }

  /**
   * Closes the form and resets its state.
   */
  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingSportId = null;
    this.originalSport = null;
    this.sportForm.reset({ name: '', description: '', parentSportId: '' });
  }

  /**
   * Maps form values to the backend sport creation contract.
   *
   * @returns Sport data with an optional numeric parent identifier.
   */
  private buildCreatePayload(): CreateSportDTO {
    const formValue = this.sportForm.getRawValue() as {
      name: string;
      description: string;
      parentSportId: string;
    };

    const payload: CreateSportDTO = {
      name: formValue.name,
      description: formValue.description,
    };

    if (formValue.parentSportId !== '') {
      payload.parentSportId = Number(formValue.parentSportId);
    }

    return payload;
  }

  /**
   * Maps changed form values to the backend sport update contract.
   *
   * @returns Only modified fields, using null to remove a parent sport.
   */
  private buildUpdatePayload(): UpdateSportDTO {
    const formValue = this.sportForm.getRawValue() as {
      name: string;
      description: string;
      parentSportId: string;
    };
    const originalSport = this.originalSport;
    const payload: UpdateSportDTO = {};

    if (originalSport && formValue.name !== originalSport.name) {
      payload.name = formValue.name;
    }
    if (originalSport && formValue.description !== originalSport.description) {
      payload.description = formValue.description;
    }

    const parentSportId =
      formValue.parentSportId === '' ? null : Number(formValue.parentSportId);
    if (
      originalSport &&
      parentSportId !== (originalSport.parentSportId ?? null)
    ) {
      payload.parentSportId = parentSportId;
    }

    return payload;
  }
}
