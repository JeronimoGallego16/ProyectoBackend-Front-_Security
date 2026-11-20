import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  CreateFinalPhaseDTO,
  UpdateFinalPhaseDTO,
} from 'src/app/models/dtos/phase-request.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { DevelopmentMatch, DevelopmentPhase } from 'src/app/models/tournament.model';
import { Phase } from 'src/app/models/phase.model';
import { Tournament } from 'src/app/models/tournament.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { PhaseService } from 'src/app/services/phase.service';
import { TournamentService } from 'src/app/services/tournament.service';

interface ApiError {
  status?: number;
  error?: { message?: string };
}

/**
 * Presents a tournament and manages its final phases.
 */
@Component({
  selector: 'app-tournament-detail',
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
  templateUrl: './tournament-detail.component.html',
  styleUrls: ['./tournament-detail.component.scss'],
})
export class TournamentDetailComponent implements OnInit {
  public readonly phaseColumns: TableColumn[] = [
    { field: 'phaseId', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'order', header: 'Order' },
    { field: 'type', header: 'Type' },
    { field: 'isThirdPlace', header: 'Third-place match' },
  ];

  public readonly matchColumns: TableColumn[] = [
    { field: 'matchId', header: 'ID' },
    { field: 'duration', header: 'Duration' },
    { field: 'state', header: 'State' },
    { field: 'roundName', header: 'Round' },
    { field: 'bracketPosition', header: 'Position' },
    { field: 'homeTeamName', header: 'Home' },
    { field: 'awayTeamName', header: 'Away' },
    { field: 'homeScore', header: 'Home score' },
    { field: 'awayScore', header: 'Away score' },
    { field: 'resultRegistered', header: 'Result' },
  ];

  public readonly phaseFields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Final phase name',
    },
    {
      name: 'order',
      label: 'Order',
      type: 'text',
      placeholder: 'Positive phase order',
    },
    {
      name: 'isThirdPlace',
      label: 'Includes third-place match',
      type: 'checkbox',
    },
  ];

  public readonly phaseDetailFields = [
    { key: 'phaseId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'order', label: 'Order' },
    { key: 'tournamentId', label: 'Tournament ID' },
    { key: 'type', label: 'Type' },
    { key: 'isThirdPlace', label: 'Third-place match' },
  ];

  public tournament: Tournament | null = null;
  public phases: Phase[] = [];
  public finalPhases: Phase[] = [];
  public developmentPhases: DevelopmentPhase[] = [];
  public matches: DevelopmentMatch[] = [];
  public phaseForm: FormGroup;
  public showPhaseForm = false;
  public isEditingPhase = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  public pendingDeletePhase: Phase | null = null;
  public detailOpen = false;
  public selectedPhase: Phase | null = null;
  private tournamentId = 0;
  private editingPhaseId: number | null = null;
  private originalPhase: Phase | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tournamentService: TournamentService,
    private readonly phaseService: PhaseService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.phaseForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.pattern(/\S/)]],
      order: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[1-9]\d*$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
      isThirdPlace: [false],
    });
  }

  public ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id < 1) {
      this.router.navigate(['/tournaments']);
      return;
    }

    this.tournamentId = id;
    this.loadDevelopment();
  }

  public loadDevelopment(): void {
    this.isLoading = true;
    this.tournamentService
      .findDevelopment(this.tournamentId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (development) => {
          this.tournament = development.tournament;
          this.developmentPhases = development.phases;
          this.phases = development.phases.map((phase) => ({
            phaseId: phase.phaseId,
            name: phase.name,
            order: phase.order,
            tournamentId: phase.tournamentId,
            type: phase.type,
            isThirdPlace: phase.isThirdPlace,
          }));
          this.finalPhases = this.phases.filter((phase) => phase.type === 'FINAL');
          this.matches = development.phases.flatMap((phase) =>
            phase.matches ?? phase.bracket ?? []
          );
        },
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            error?.error?.message ??
              'Could not load the tournament development. Please try again.'
          ),
      });
  }

  public goBack(): void {
    this.router.navigate(['/tournaments']);
  }

  public onCreatePhase(): void {
    this.isEditingPhase = false;
    this.editingPhaseId = null;
    this.originalPhase = null;
    this.phaseForm.reset({ name: '', order: '', isThirdPlace: false });
    this.showPhaseForm = true;
  }

  public onEditPhase(phase: Phase): void {
    this.isEditingPhase = true;
    this.editingPhaseId = phase.phaseId;
    this.originalPhase = phase;
    this.phaseForm.reset({
      name: phase.name,
      order: String(phase.order),
      isThirdPlace: phase.isThirdPlace,
    });
    this.showPhaseForm = true;
  }

  public onViewPhase(phase: Phase): void {
    this.selectedPhase = phase;
    this.detailOpen = true;
  }

  public onCloseDetail(): void {
    this.detailOpen = false;
    this.selectedPhase = null;
  }

  public onDeletePhase(phase: Phase): void {
    this.pendingDeletePhase = phase;
    this.confirmDeleteOpen = true;
  }

  public onConfirmDelete(): void {
    if (!this.pendingDeletePhase) {
      return;
    }

    const phase = this.pendingDeletePhase;
    this.isLoading = true;
    this.phaseService
      .delete(phase.phaseId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Final phase deleted successfully.'
          );
          this.closeDeleteDialog();
          this.loadDevelopment();
        },
        error: (error: ApiError) => {
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            error?.error?.message ??
              'Could not delete the final phase. It may have associated matches.'
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

  public onSubmitPhase(): void {
    if (this.phaseForm.invalid) {
      this.phaseForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Please complete all required phase fields with valid values.'
      );
      return;
    }

    const value = this.phaseForm.getRawValue() as {
      name: string;
      order: string;
      isThirdPlace: boolean;
    };
    const wasEditing = this.isEditingPhase;
    let request$;

    if (wasEditing && this.editingPhaseId !== null) {
      const payload = this.buildUpdatePayload(value);
      if (Object.keys(payload).length === 0) {
        this.feedbackHandlerService.info(FeedbackCase.INFO, 'No changes to save.');
        this.cancelPhaseForm();
        return;
      }
      request$ = this.phaseService.update(this.editingPhaseId, payload);
    } else {
      const payload: CreateFinalPhaseDTO = {
        name: value.name.trim(),
        order: Number(value.order),
        tournamentId: this.tournamentId,
        type: 'FINAL',
        isThirdPlace: value.isThirdPlace,
      };
      request$ = this.phaseService.create(payload);
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing
            ? 'Final phase updated successfully.'
            : 'Final phase created successfully.'
        );
        this.cancelPhaseForm();
        this.loadDevelopment();
      },
      error: (error: ApiError) =>
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          error?.error?.message ??
            'Could not save the final phase. Please verify the data and try again.'
        ),
    });
  }

  public cancelPhaseForm(): void {
    this.showPhaseForm = false;
    this.isEditingPhase = false;
    this.editingPhaseId = null;
    this.originalPhase = null;
    this.phaseForm.reset({ name: '', order: '', isThirdPlace: false });
  }

  public matchesForPhase(phaseId: number): DevelopmentMatch[] {
    return this.matches.filter((match) => match.phaseId === phaseId);
  }

  private buildUpdatePayload(value: {
    name: string;
    order: string;
    isThirdPlace: boolean;
  }): UpdateFinalPhaseDTO {
    const payload: UpdateFinalPhaseDTO = {};
    if (this.originalPhase && value.name.trim() !== this.originalPhase.name) {
      payload.name = value.name.trim();
    }
    if (
      this.originalPhase &&
      Number(value.order) !== this.originalPhase.order
    ) {
      payload.order = Number(value.order);
    }
    if (
      this.originalPhase &&
      value.isThirdPlace !== this.originalPhase.isThirdPlace
    ) {
      payload.isThirdPlace = value.isThirdPlace;
    }
    return payload;
  }

  private closeDeleteDialog(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeletePhase = null;
  }
}
