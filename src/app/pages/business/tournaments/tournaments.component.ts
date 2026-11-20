import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { Router } from '@angular/router';
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
  CreateTournamentDTO,
  UpdateTournamentDTO,
} from 'src/app/models/dtos/tournament-request.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { Sport } from 'src/app/models/business/sport.model';
import { Tournament } from 'src/app/models/tournament.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { SportService } from 'src/app/services/business/sport.service';
import { TournamentService } from 'src/app/services/tournament.service';

interface ApiError {
  status?: number;
  error?: { message?: string };
}

/**
 * Presentation page that coordinates tournament CRUD actions.
 */
@Component({
  selector: 'app-tournaments',
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
  templateUrl: './tournaments.component.html',
  styleUrls: ['./tournaments.component.scss'],
})
export class TournamentsComponent implements OnInit {
  public readonly columns: TableColumn[] = [
    { field: 'tournamentId', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'modality', header: 'Modality' },
    { field: 'startDate', header: 'Start date' },
    { field: 'registrationEndDate', header: 'Registration closes' },
    { field: 'endDate', header: 'End date' },
    { field: 'status', header: 'Status' },
    { field: 'capacity', header: 'Capacity' },
    { field: 'sportId', header: 'Sport ID' },
  ];

  public readonly fields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Tournament name',
    },
    {
      name: 'modality',
      label: 'Modality',
      type: 'text',
      placeholder: 'Tournament modality',
    },
    {
      name: 'startDate',
      label: 'Start date',
      type: 'date',
      placeholder: 'Start date',
    },
    {
      name: 'registrationEndDate',
      label: 'Registration closes (optional)',
      type: 'date',
      placeholder: 'Registration end date',
    },
    {
      name: 'endDate',
      label: 'End date',
      type: 'date',
      placeholder: 'End date',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'OPEN', label: 'Open for registrations' },
        { value: 'PUBLISHED', label: 'Published' },
        { value: 'IN_PROGRESS', label: 'In progress' },
        { value: 'FINISHED', label: 'Finished' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ],
    },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'text',
      placeholder: 'Positive number of participants',
    },
    {
      name: 'sportId',
      label: 'Sport',
      type: 'select',
      options: [],
    },
  ];

  public readonly detailFields = [
    { key: 'tournamentId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'modality', label: 'Modality' },
    { key: 'startDate', label: 'Start date' },
    { key: 'registrationEndDate', label: 'Registration closes' },
    { key: 'endDate', label: 'End date' },
    { key: 'status', label: 'Status' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'sportId', label: 'Sport ID' },
  ];

  public tournaments: Tournament[] = [];
  public sports: Sport[] = [];
  public tournamentForm: FormGroup;
  public showForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  public pendingDeleteTournament: Tournament | null = null;
  public detailOpen = false;
  public selectedTournament: Tournament | null = null;
  private editingTournamentId: number | null = null;
  private originalTournament: Tournament | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly tournamentService: TournamentService,
    private readonly sportService: SportService,
    private readonly feedbackHandlerService: FeedbackHandlerService,
    private readonly router: Router
  ) {
    this.tournamentForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.pattern(/\S/)]],
      modality: ['', [Validators.required, Validators.pattern(/\S/)]],
      startDate: ['', Validators.required],
      registrationEndDate: [''],
      endDate: ['', Validators.required],
      status: ['', [Validators.required, Validators.pattern(/\S/)]],
      capacity: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[1-9]\d*$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
      sportId: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[1-9]\d*$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
    });
    this.tournamentForm.addValidators(() => {
      const startDate = this.tournamentForm.get('startDate')?.value;
      const endDate = this.tournamentForm.get('endDate')?.value;
      const registrationEndDate =
        this.tournamentForm.get('registrationEndDate')?.value;
      if (!startDate || !endDate) {
        return null;
      }

      const start = this.toIsoDate(startDate);
      const end = this.toIsoDate(endDate);
      if (end < start) {
        return { endDateBeforeStartDate: true };
      }
      if (registrationEndDate && this.toIsoDate(registrationEndDate) > start) {
        return { registrationEndDateAfterStartDate: true };
      }
      return null;
    });
  }

  public ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading = true;
    forkJoin({
      tournaments: this.tournamentService.findAll(),
      sports: this.sportService.findAll(),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ tournaments, sports }) => {
          this.tournaments = tournaments;
          this.sports = sports;
          const sportField = this.fields.find((field) => field.name === 'sportId');
          if (sportField) {
            sportField.options = sports.map((sport) => ({
            value: sport.sportId,
            label: `${sport.name} (#${sport.sportId})`,
            }));
          }
        },
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not load tournaments and sports. Please try again.'
          ),
      });
  }

  public onCreateClick(): void {
    this.isEditing = false;
    this.editingTournamentId = null;
    this.originalTournament = null;
    this.tournamentForm.reset(this.emptyFormValue());
    this.showForm = true;
  }

  public onEdit(tournament: Tournament): void {
    this.isEditing = true;
    this.editingTournamentId = tournament.tournamentId;
    this.originalTournament = tournament;
    this.tournamentForm.reset({
      name: tournament.name,
      modality: tournament.modality,
      startDate: this.toDateValue(tournament.startDate),
      registrationEndDate: tournament.registrationEndDate
        ? this.toDateValue(tournament.registrationEndDate)
        : '',
      endDate: this.toDateValue(tournament.endDate),
      status: tournament.status,
      capacity: String(tournament.capacity),
      sportId: tournament.sportId,
    });
    this.showForm = true;
  }

  public onView(tournament: Tournament): void {
    this.router.navigate(['/tournaments', tournament.tournamentId]);
  }

  public onCloseDetail(): void {
    this.detailOpen = false;
    this.selectedTournament = null;
  }

  public onDelete(tournament: Tournament): void {
    this.pendingDeleteTournament = tournament;
    this.confirmDeleteOpen = true;
  }

  public onConfirmDelete(): void {
    if (!this.pendingDeleteTournament) {
      return;
    }

    const tournament = this.pendingDeleteTournament;
    this.isLoading = true;
    this.tournamentService
      .delete(tournament.tournamentId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Tournament deleted successfully.'
          );
          this.closeDeleteDialog();
          this.loadTournaments();
        },
        error: (error: ApiError) => {
          const message =
            error?.error?.message ??
            'Could not delete the tournament. Please try again.';
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            message
          );
          this.closeDeleteDialog();
        },
      });
  }

  public onCancelDelete(): void {
    this.closeDeleteDialog();
    this.feedbackHandlerService.info(
      FeedbackCase.CANCELLED,
      'Deletion cancelled.'
    );
  }

  public onSubmit(): void {
    if (this.tournamentForm.invalid) {
      this.tournamentForm.markAllAsTouched();
      if (this.tournamentForm.hasError('endDateBeforeStartDate')) {
        this.feedbackHandlerService.warning(
          FeedbackCase.BAD_REQUEST,
          'The end date cannot be before the start date.'
        );
        return;
      }
      if (this.tournamentForm.hasError('registrationEndDateAfterStartDate')) {
        this.feedbackHandlerService.warning(
          FeedbackCase.BAD_REQUEST,
          'The registration deadline cannot be after the tournament start date.'
        );
        return;
      }
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Please complete all required fields with valid values before saving.'
      );
      return;
    }

    const formValue = this.getFormValue();
    const wasEditing = this.isEditing;
    let request$;

    if (wasEditing && this.editingTournamentId !== null) {
      const payload = this.buildUpdatePayload(formValue);
      if (Object.keys(payload).length === 0) {
        this.feedbackHandlerService.info(FeedbackCase.INFO, 'No changes to save.');
        this.cancelForm();
        return;
      }
      request$ = this.tournamentService.update(
        this.editingTournamentId,
        payload
      );
    } else {
      request$ = this.tournamentService.create(this.buildCreatePayload(formValue));
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing
            ? 'Tournament updated successfully.'
            : 'Tournament created successfully.'
        );
        this.cancelForm();
        this.loadTournaments();
      },
      error: (error: ApiError) =>
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          error?.error?.message ??
            'Could not save the tournament. Please verify the data and try again.'
        ),
    });
  }

  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingTournamentId = null;
    this.originalTournament = null;
    this.tournamentForm.reset(this.emptyFormValue());
  }

  private loadTournaments(): void {
    this.tournamentService.findAll().subscribe({
      next: (tournaments) => (this.tournaments = tournaments),
      error: (error: ApiError) =>
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          'Could not refresh tournaments. Please try again.'
        ),
    });
  }

  private closeDeleteDialog(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeleteTournament = null;
  }

  private emptyFormValue(): {
    name: string;
    modality: string;
    startDate: string;
    registrationEndDate: string;
    endDate: string;
    status: string;
    capacity: string;
    sportId: string;
  } {
    return {
      name: '',
      modality: '',
      startDate: '',
      registrationEndDate: '',
      endDate: '',
      status: '',
      capacity: '',
      sportId: '',
    };
  }

  private getFormValue(): {
    name: string;
    modality: string;
    startDate: Date | string;
    registrationEndDate: Date | string;
    endDate: Date | string;
    status: string;
    capacity: string;
    sportId: string | number;
  } {
    return this.tournamentForm.getRawValue() as ReturnType<
      TournamentsComponent['getFormValue']
    >;
  }

  private buildCreatePayload(
    formValue: ReturnType<TournamentsComponent['getFormValue']>
  ): CreateTournamentDTO {
    const payload: CreateTournamentDTO = {
      name: formValue.name.trim(),
      modality: formValue.modality.trim(),
      startDate: this.toIsoDate(formValue.startDate),
      endDate: this.toIsoDate(formValue.endDate),
      status: formValue.status.trim(),
      capacity: Number(formValue.capacity),
      sportId: Number(formValue.sportId),
    };
    const registrationEndDate = this.toIsoDate(formValue.registrationEndDate);
    if (registrationEndDate) {
      payload.registrationEndDate = registrationEndDate;
    }
    return payload;
  }

  private buildUpdatePayload(
    formValue: ReturnType<TournamentsComponent['getFormValue']>
  ): UpdateTournamentDTO {
    const original = this.originalTournament;
    const payload: UpdateTournamentDTO = {};
    const startDate = this.toIsoDate(formValue.startDate);
    const registrationEndDate = this.toIsoDate(formValue.registrationEndDate);
    const endDate = this.toIsoDate(formValue.endDate);
    const capacity = Number(formValue.capacity);
    const sportId = Number(formValue.sportId);

    if (original && formValue.name.trim() !== original.name) {
      payload.name = formValue.name.trim();
    }
    if (original && formValue.modality.trim() !== original.modality) {
      payload.modality = formValue.modality.trim();
    }
    if (original && startDate !== original.startDate) {
      payload.startDate = startDate;
    }
    if (
      original &&
      (registrationEndDate || null) !==
        (original.registrationEndDate?.slice(0, 10) || null)
    ) {
      payload.registrationEndDate = registrationEndDate || null;
    }
    if (original && endDate !== original.endDate) {
      payload.endDate = endDate;
    }
    if (original && formValue.status.trim() !== original.status) {
      payload.status = formValue.status.trim();
    }
    if (original && capacity !== original.capacity) {
      payload.capacity = capacity;
    }
    if (original && sportId !== original.sportId) {
      payload.sportId = sportId;
    }

    return payload;
  }

  private toDateValue(value: string): Date {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toIsoDate(value: Date | string): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
