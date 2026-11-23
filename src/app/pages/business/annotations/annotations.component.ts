import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, finalize, map, switchMap } from 'rxjs';
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
import { Annotation } from 'src/app/models/business/annotation.model';
import { Match } from 'src/app/models/business/match.model';
import { Player } from 'src/app/models/business/player.model';
import { PlayerTeam } from 'src/app/models/business/player-team.model';
import {
  CreateAnnotationDTO,
  UpdateAnnotationDTO,
} from 'src/app/models/dtos/business/annotation-request.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { MaterialModule } from 'src/app/material.module';
import { AnnotationService } from 'src/app/services/business/annotation.service';
import { MatchService } from 'src/app/services/business/match.service';
import { PlayerService } from 'src/app/services/business/player.service';
import { PlayerTeamService } from 'src/app/services/business/player-team.service';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';

interface ApiError {
  status?: number;
  error?: { message?: string | string[] };
}

interface AnnotationRow extends Annotation {
  status: string;
}

@Component({
  selector: 'app-annotations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule,
    ReactiveFormsModule,
    DataTableComponent,
    DynamicFormComponent,
    ConfirmDialogComponent,
    DetailDialogComponent,
  ],
  templateUrl: './annotations.component.html',
})
export class AnnotationsComponent implements OnInit {
  public readonly columns: TableColumn[] = [
    { field: 'minute', header: 'Minute' },
    { field: 'type', header: 'Type' },
    { field: 'playerName', header: 'Player' },
    { field: 'status', header: 'Status' },
  ];

  public readonly detailFields = [
    { key: 'annotationId', label: 'ID' },
    { key: 'matchId', label: 'Match ID' },
    { key: 'playerName', label: 'Player' },
    { key: 'minute', label: 'Minute' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
  ];

  public readonly annotationFormFields: FormFieldConfig[] = [
    {
      name: 'playerId',
      label: 'Player',
      type: 'select',
      options: [],
    },
    {
      name: 'minute',
      label: 'Minute',
      type: 'text',
      placeholder: 'Non-negative integer',
    },
    {
      name: 'type',
      label: 'Type',
      type: 'text',
      placeholder: 'Annotation type (maximum 30 characters)',
    },
  ];

  public readonly updateFormFields: FormFieldConfig[] = [
    {
      name: 'minute',
      label: 'Minute',
      type: 'text',
      placeholder: 'Non-negative integer',
    },
    {
      name: 'type',
      label: 'Type',
      type: 'text',
      placeholder: 'Annotation type (maximum 30 characters)',
    },
  ];

  public annotations: Annotation[] = [];
  public eligiblePlayers: Player[] = [];
  public match: Match | null = null;
  public annotationForm: FormGroup;
  public showForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmVoidOpen = false;
  public pendingVoidAnnotation: Annotation | null = null;
  public detailOpen = false;
  public selectedAnnotation: AnnotationRow | null = null;
  private editingAnnotation: Annotation | null = null;
  private readonly matchId: number;

  public readonly canViewAnnotation = (_row: object): boolean => true;
  public readonly canModifyAnnotation = (row: object): boolean =>
    !('voided' in row && row.voided === true);

  public get matchIsActive(): boolean {
    return this.match?.state.trim().toUpperCase() === 'ACTIVE';
  }

  public get annotationRows(): AnnotationRow[] {
    return this.annotations.map((annotation) => ({
      ...annotation,
      status: annotation.voided ? 'Voided' : 'Active',
    }));
  }

  public get formFields(): FormFieldConfig[] {
    return this.isEditing ? this.updateFormFields : this.annotationFormFields;
  }

  constructor(
    route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly matchService: MatchService,
    private readonly playerService: PlayerService,
    private readonly playerTeamService: PlayerTeamService,
    private readonly annotationService: AnnotationService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.matchId = Number(route.snapshot.paramMap.get('id'));
    this.annotationForm = this.formBuilder.group({
      playerId: ['', Validators.required],
      minute: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d+$/),
          Validators.min(0),
        ],
      ],
      type: [
        '',
        [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(30),
        ],
      ],
    });
  }

  public ngOnInit(): void {
    if (!Number.isInteger(this.matchId) || this.matchId < 1) {
      this.feedbackHandlerService.error(
        String(FeedbackCase.BAD_REQUEST),
        'The match identifier is invalid.'
      );
      return;
    }
    this.loadData();
  }

  public loadData(): void {
    this.isLoading = true;
    this.matchService
      .findById(this.matchId)
      .pipe(
        switchMap((match) =>
          forkJoin({
            players: this.playerService.findAll(),
            homeTeam: this.playerTeamService.findByTeam(
              match.homeTeamId,
              true
            ),
            awayTeam: this.playerTeamService.findByTeam(
              match.awayTeamId,
              true
            ),
            annotations: this.annotationService.findByMatch(this.matchId),
          }).pipe(
            map(({ players, homeTeam, awayTeam, annotations }) => ({
              match,
              players,
              homeTeam,
              awayTeam,
              annotations,
            }))
          )
        ),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: ({ match, players, homeTeam, awayTeam, annotations }) => {
          this.match = match;
          this.annotations = annotations;
          const eligibleIds = new Set(
            [...homeTeam, ...awayTeam].map(
              (assignment: PlayerTeam) => Number(assignment.playerId)
            )
          );
          this.eligiblePlayers = players.filter((player) =>
            eligibleIds.has(Number(player.playerId))
          );
          const playerField = this.annotationFormFields.find(
            (field) => field.name === 'playerId'
          );
          if (playerField) {
            playerField.options = this.eligiblePlayers.map((player) => ({
              value: player.playerId,
              label: `${player.name} ${player.lastName} (#${player.playerId})`,
            }));
          }
        },
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(
              error,
              'Could not load match and eligible players.'
            )
          ),
      });
  }

  public onCreateClick(): void {
    if (!this.matchIsActive) {
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Annotations can only be created while the match is active.'
      );
      return;
    }
    this.isEditing = false;
    this.editingAnnotation = null;
    this.annotationForm.reset({ playerId: '', minute: '', type: '' });
    this.showForm = true;
  }

  public onView(annotation: AnnotationRow): void {
    this.selectedAnnotation = annotation;
    this.detailOpen = true;
  }

  public onCloseDetail(): void {
    this.detailOpen = false;
    this.selectedAnnotation = null;
  }

  public onEdit(annotation: Annotation): void {
    if (annotation.voided) {
      return;
    }
    this.isEditing = true;
    this.editingAnnotation = annotation;
    this.annotationForm.reset({
      playerId: annotation.playerId,
      minute: String(annotation.minute),
      type: annotation.type,
    });
    this.showForm = true;
  }

  public onDelete(annotation: Annotation): void {
    if (annotation.voided) {
      return;
    }
    this.pendingVoidAnnotation = annotation;
    this.confirmVoidOpen = true;
  }

  public onConfirmVoid(): void {
    if (!this.pendingVoidAnnotation) {
      return;
    }
    const annotation = this.pendingVoidAnnotation;
    this.isLoading = true;
    this.annotationService
      .void(annotation.annotationId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Annotation voided successfully.'
          );
          this.closeVoidDialog();
          this.loadData();
        },
        error: (error: ApiError) => {
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, 'Could not void the annotation.')
          );
          this.closeVoidDialog();
        },
      });
  }

  public onCancelVoid(): void {
    this.closeVoidDialog();
  }

  public onSubmit(): void {
    if (this.annotationForm.invalid) {
      this.annotationForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Complete the annotation fields with valid values.'
      );
      return;
    }
    if (!this.isEditing && this.eligiblePlayers.length === 0) {
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'No current players from either match team are available.'
      );
      return;
    }

    const value = this.annotationForm.getRawValue() as {
      playerId: number;
      minute: string;
      type: string;
    };
    const wasEditing = this.isEditing;
    let request$;

    if (wasEditing && this.editingAnnotation) {
      const payload = this.buildUpdatePayload(
        Number(value.minute),
        value.type.trim(),
        this.editingAnnotation
      );
      if (Object.keys(payload).length === 0) {
        this.feedbackHandlerService.info(
          FeedbackCase.INFO,
          'No changes to save.'
        );
        this.cancelForm();
        return;
      }
      request$ = this.annotationService.update(
        this.editingAnnotation.annotationId,
        payload
      );
    } else {
      if (!this.matchIsActive) {
        this.feedbackHandlerService.warning(
          FeedbackCase.BAD_REQUEST,
          'Annotations can only be created while the match is active.'
        );
        return;
      }
      const playerId = Number(value.playerId);
      if (!this.eligiblePlayers.some((player) => player.playerId === playerId)) {
        this.feedbackHandlerService.warning(
          FeedbackCase.BAD_REQUEST,
          'The selected player must belong to one of the match teams.'
        );
        return;
      }
      const payload: CreateAnnotationDTO = {
        playerId,
        minute: Number(value.minute),
        type: value.type.trim(),
      };
      request$ = this.annotationService.create(this.matchId, payload);
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing
            ? 'Annotation updated successfully.'
            : 'Annotation created successfully.'
        );
        this.cancelForm();
        this.loadData();
      },
      error: (error: ApiError) =>
        this.feedbackHandlerService.error(
          String(error.status ?? FeedbackCase.SERVER_ERROR),
          this.getErrorMessage(error, 'Could not save the annotation.')
        ),
    });
  }

  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingAnnotation = null;
    this.annotationForm.reset({ playerId: '', minute: '', type: '' });
  }

  private buildUpdatePayload(
    minute: number,
    type: string,
    original: Annotation
  ): UpdateAnnotationDTO {
    const payload: UpdateAnnotationDTO = {};
    if (minute !== original.minute) payload.minute = minute;
    if (type !== original.type) payload.type = type;
    return payload;
  }

  private closeVoidDialog(): void {
    this.confirmVoidOpen = false;
    this.pendingVoidAnnotation = null;
  }

  private getErrorMessage(error: ApiError, fallback: string): string {
    const message = error.error?.message;
    return Array.isArray(message) ? message.join(' ') : message ?? fallback;
  }
}
