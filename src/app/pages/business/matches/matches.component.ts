import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { DetailDialogComponent } from 'src/app/components/detail-dialog/detail-dialog.component';
import {
  DynamicFormComponent,
  FormFieldConfig,
} from 'src/app/components/dynamic-form/dynamic-form.component';
import {
  DataTableComponent,
  TableColumn,
  TableAction,
} from 'src/app/components/table-list/table-list.component';
import { Router } from '@angular/router';
import {
  CreateMatchDTO,
  UpdateMatchDTO,
} from 'src/app/models/dtos/business/match-request.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { Match } from 'src/app/models/business/match.model';
import { Phase } from 'src/app/models/phase.model';
import { Team } from 'src/app/models/business/team.model';
import { TeamSport } from 'src/app/models/business/team-sport.model';
import { Tournament } from 'src/app/models/tournament.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { MatchService } from 'src/app/services/business/match.service';
import { PhaseService } from 'src/app/services/phase.service';
import { TeamSportService } from 'src/app/services/business/team-sport.service';
import { TeamService } from 'src/app/services/business/team.service';
import { TournamentService } from 'src/app/services/tournament.service';

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
    { field: 'roundName', header: 'Round' },
    { field: 'bracketPosition', header: 'Bracket position' },
    { field: 'homeScore', header: 'Home score' },
    { field: 'awayScore', header: 'Away score' },
    { field: 'resultRegistered', header: 'Result registered' },
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
      type: 'select',
      hint: 'Required; select a match state.',
      options: [
        { value: 'ACTIVE', label: 'ACTIVE' },
        { value: 'INACTIVE', label: 'INACTIVE' },
        { value: 'PROGRAMMED', label: 'PROGRAMMED' },
        { value: 'FINISHED', label: 'FINISHED' },
      ],
    },
    {
      name: 'phaseId',
      label: 'Phase',
      type: 'select',
      options: [],
    },
    {
      name: 'homeTeamId',
      label: 'Home team',
      type: 'select',
      hint: 'Teams must be assigned to the sport of the selected phase.',
      options: [],
    },
    {
      name: 'awayTeamId',
      label: 'Away team',
      type: 'select',
      hint: 'Teams must be assigned to the sport of the selected phase.',
      options: [],
    },
    {
      name: 'roundName',
      label: 'Round name',
      type: 'text',
      placeholder: 'Semifinal, final, etc.',
    },
    {
      name: 'bracketPosition',
      label: 'Bracket position',
      type: 'text',
      placeholder: 'Optional numeric position',
    },
    {
      name: 'nextMatchId',
      label: 'Next match ID',
      type: 'text',
      placeholder: 'Optional next match',
    },
    {
      name: 'isThirdPlace',
      label: 'Third-place match',
      type: 'checkbox',
    },
  ];

  public readonly resultFields: FormFieldConfig[] = [
    {
      name: 'homeScore',
      label: 'Home score',
      type: 'text',
      placeholder: 'Non-negative integer',
    },
    {
      name: 'awayScore',
      label: 'Away score',
      type: 'text',
      placeholder: 'Non-negative integer',
    },
  ];

  public readonly actions: TableAction[] = [
    {
      label: 'Register result',
      icon: 'sports_score',
      color: 'primary',
    },
    {
      label: 'Annotations',
      icon: 'edit_note',
      color: 'primary',
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
  public resultForm: FormGroup;
  public showForm = false;
  public showResultForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  public pendingDeleteMatch: Match | null = null;
  public detailOpen = false;
  public selectedMatch: Match | null = null;
  public submissionError: string | null = null;
  private readonly phasesById = new Map<number, Phase>();
  private readonly tournamentsById = new Map<number, Tournament>();
  private teams: Team[] = [];
  private teamSports: TeamSport[] = [];
  private editingMatchId: number | null = null;
  private originalMatch: Match | null = null;
  private pendingResultMatch: Match | null = null;

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
    private readonly teamService: TeamService,
    private readonly teamSportService: TeamSportService,
    private readonly tournamentService: TournamentService,
    private readonly phaseService: PhaseService,
    private readonly feedbackHandlerService: FeedbackHandlerService,
    private readonly router: Router
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
        Validators.required,
      ],
      awayTeamId: [
        '',
        Validators.required,
      ],
      phaseId: [
        '',
        Validators.required,
      ],
      roundName: [''],
      bracketPosition: [
        '',
        [
          Validators.pattern(/^([1-9]\d*)$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
      nextMatchId: [
        '',
        [
          Validators.pattern(/^([1-9]\d*)$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
      isThirdPlace: [false],
    });
    this.resultForm = this.formBuilder.group({
      homeScore: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d+$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
      awayScore: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d+$/),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
    });
    this.matchForm.get('phaseId')?.valueChanges.subscribe((phaseId) => {
      this.updateEligibleTeamOptions(phaseId);
    });
    this.matchForm.valueChanges.subscribe(() => {
      this.submissionError = null;
    });
  }

  /**
   * Loads the match collection when the page is initialized.
   */
  public ngOnInit(): void {
    this.loadMatchOptions();
    this.loadMatches();
  }

  private loadMatchOptions(): void {
    forkJoin({
      teams: this.teamService.findAll(),
      tournaments: this.tournamentService.findAll(),
      teamSports: this.teamSportService.findAll(),
    }).subscribe({
      next: ({ teams, tournaments, teamSports }) => {
        this.teams = teams;
        this.teamSports = teamSports;
        this.tournamentsById.clear();
        tournaments.forEach((tournament) =>
          this.tournamentsById.set(tournament.tournamentId, tournament)
        );

        if (tournaments.length === 0) {
          this.setPhaseOptions([]);
          return;
        }

        forkJoin(
          tournaments.map((tournament) =>
            this.phaseService.findByTournament(tournament.tournamentId)
          )
        ).subscribe({
          next: (phaseLists) =>
              this.setPhaseOptions(phaseLists.flat()),
          error: (error: { status?: number }) =>
            this.feedbackHandlerService.error(
              String(error?.status ?? FeedbackCase.SERVER_ERROR),
              'Could not load tournament phases. Match creation requires a valid phase.'
            ),
        });
      },
      error: (error: { status?: number }) =>
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          'Could not load teams, tournaments, or team-sport assignments. Please try again.'
        ),
    });
  }

  private setPhaseOptions(phases: Phase[]): void {
    this.phasesById.clear();
    phases.forEach((phase) => this.phasesById.set(phase.phaseId, phase));
    const phaseField = this.fields.find((field) => field.name === 'phaseId');
    if (phaseField) {
      phaseField.options = phases.map((phase) => ({
        value: phase.phaseId,
        label: `${phase.name} (#${phase.phaseId}, tournament #${phase.tournamentId})`,
      }));
    }
    this.updateEligibleTeamOptions(this.matchForm.get('phaseId')?.value);
  }

  private updateEligibleTeamOptions(phaseId: number | string | null): void {
    const phase = this.phasesById.get(Number(phaseId));
    const tournament = phase
      ? this.tournamentsById.get(phase.tournamentId)
      : undefined;
    const eligibleTeams =
      tournament && phaseId
        ? this.teams.filter((team) =>
            this.teamSports.some(
              (assignment) =>
                assignment.teamId === team.teamId &&
                assignment.sportId === tournament.sportId
            )
          )
        : [];
    const eligibleTeamIds = new Set(
      eligibleTeams.map((team) => team.teamId)
    );

    for (const fieldName of ['homeTeamId', 'awayTeamId']) {
      const field = this.fields.find((item) => item.name === fieldName);
      if (field) {
        field.options = eligibleTeams.map((team) => ({
          value: team.teamId,
          label: `${team.name} (#${team.teamId})`,
        }));
      }

      const control = this.matchForm.get(fieldName);
      const currentTeamId = Number(control?.value);
      if (
        control &&
        control.value !== '' &&
        control.value !== null &&
        !eligibleTeamIds.has(currentTeamId)
      ) {
        control.setValue('', { emitEvent: false });
      }
    }
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
    this.submissionError = null;
    this.matchForm.reset({
      duration: match.duration,
      state: match.state,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      phaseId: match.phaseId,
      roundName: match.roundName ?? '',
      bracketPosition:
        match.bracketPosition == null ? '' : String(match.bracketPosition),
      nextMatchId: match.nextMatchId == null ? '' : String(match.nextMatchId),
      isThirdPlace: match.isThirdPlace ?? false,
    });
    this.showForm = true;
  }

  public onCustomAction(event: { action: string; row: Match }): void {
    if (event.action === 'Annotations') {
      this.router.navigate([
        '/matches',
        event.row.matchId,
        'annotations',
      ]);
      return;
    }

    if (event.action !== 'Register result') {
      return;
    }

    this.pendingResultMatch = event.row;
    this.resultForm.reset({
      homeScore:
        event.row.homeScore == null ? '' : String(event.row.homeScore),
      awayScore:
        event.row.awayScore == null ? '' : String(event.row.awayScore),
    });
    this.showResultForm = true;
  }

  public onSubmitResult(): void {
    if (!this.pendingResultMatch || this.resultForm.invalid) {
      this.resultForm.markAllAsTouched();
      return;
    }

    const value = this.resultForm.getRawValue() as {
      homeScore: string;
      awayScore: string;
    };

    this.isLoading = true;
    this.matchService
      .updateResult(this.pendingResultMatch.matchId, {
        homeScore: Number(value.homeScore),
        awayScore: Number(value.awayScore),
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.OK,
            'Match result registered successfully.'
          );
          this.cancelResultForm();
          this.loadMatches();
        },
        error: (error: { status?: number; error?: { message?: string } }) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            error?.error?.message ??
              'Could not register the match result.'
          ),
      });
  }

  public cancelResultForm(): void {
    this.showResultForm = false;
    this.pendingResultMatch = null;
    this.resultForm.reset({ homeScore: '', awayScore: '' });
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
    this.submissionError = null;
    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      this.submissionError =
        'Complete all required fields and select existing teams and a phase.';
      return;
    }

    const formValue = this.getFormValue();
    if (Number(formValue.homeTeamId) === Number(formValue.awayTeamId)) {
      this.submissionError = 'Home and away teams must be different.';
      return;
    }

    const phase = this.phasesById.get(Number(formValue.phaseId));
    const tournament = phase
      ? this.tournamentsById.get(phase.tournamentId)
      : undefined;
    const eligibleTeamIds = new Set(
      tournament
        ? this.teamSports
            .filter(
              (assignment) => assignment.sportId === tournament.sportId
            )
            .map((assignment) => assignment.teamId)
        : []
    );
    if (
      !phase ||
      !eligibleTeamIds.has(Number(formValue.homeTeamId)) ||
      !eligibleTeamIds.has(Number(formValue.awayTeamId))
    ) {
      this.submissionError =
        'Both teams must be assigned to the sport of the selected phase. Manage the assignments in Assign Sports, then select the teams again.';
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
        const apiError = error as {
          status?: number;
          error?: { message?: string | string[] };
        };
        const message = this.getApiErrorMessage(apiError);
        this.submissionError = message;
        this.feedbackHandlerService.error(
          String(apiError?.status ?? FeedbackCase.SERVER_ERROR),
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
    this.submissionError = null;
    this.matchForm.reset(this.emptyFormValue());
  }

  private getApiErrorMessage(error: {
    status?: number;
    error?: { message?: string | string[] };
  }): string {
    const responseMessage = error.error?.message;
    if (Array.isArray(responseMessage)) {
      return responseMessage.join(' ');
    }
    if (responseMessage) {
      return responseMessage;
    }
    if (error.status === 404) {
      return 'The selected team or phase was not found. Verify the selected records and try again.';
    }
    if (error.status === 400 || error.status === 422) {
      return 'The match data was rejected. Verify that both teams are assigned to the sport of the selected phase in Assign Sports.';
    }
    if (error.status === 409) {
      return 'The home and away teams must be different.';
    }
    return 'Could not save the match. Verify the data and try again.';
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
    roundName: string;
    bracketPosition: string;
    nextMatchId: string;
    isThirdPlace: boolean;
  } {
    return {
      duration: '',
      state: '',
      homeTeamId: '',
      awayTeamId: '',
      phaseId: '',
      roundName: '',
      bracketPosition: '',
      nextMatchId: '',
      isThirdPlace: false,
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
    roundName: string;
    bracketPosition: string;
    nextMatchId: string;
    isThirdPlace: boolean;
  } {
    return this.matchForm.getRawValue() as {
      duration: string;
      state: string;
      homeTeamId: string;
      awayTeamId: string;
      phaseId: string;
      roundName: string;
      bracketPosition: string;
      nextMatchId: string;
      isThirdPlace: boolean;
    };
  }

  /**
   * Maps form values to the backend match creation contract.
   *
   * @param formValue - Validated values from the match form.
   * @returns Backend fields with numeric team and phase IDs when supplied.
   */
  private buildCreatePayload(
    formValue: ReturnType<MatchesComponent['getFormValue']>
  ): CreateMatchDTO {
    return {
      duration: formValue.duration.trim(),
      state: formValue.state.trim(),
      homeTeamId: Number(formValue.homeTeamId),
      awayTeamId: Number(formValue.awayTeamId),
      phaseId: Number(formValue.phaseId),
      ...(formValue.roundName.trim()
        ? { roundName: formValue.roundName.trim() }
        : {}),
      ...(formValue.bracketPosition
        ? { bracketPosition: Number(formValue.bracketPosition) }
        : {}),
      ...(formValue.nextMatchId
        ? { nextMatchId: Number(formValue.nextMatchId) }
        : {}),
      isThirdPlace: formValue.isThirdPlace,
    };
  }

  /**
   * Maps changed form values to the backend match update contract.
   *
   * @param formValue - Validated values from the match form.
   * @returns Only changed backend-supported fields, including phaseId.
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
    const phaseId = Number(formValue.phaseId);
    const roundName = formValue.roundName.trim();
    const bracketPosition = formValue.bracketPosition
      ? Number(formValue.bracketPosition)
      : null;
    const nextMatchId = formValue.nextMatchId
      ? Number(formValue.nextMatchId)
      : null;

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
    if (originalMatch && phaseId !== originalMatch.phaseId) {
      payload.phaseId = phaseId;
    }
    if (
      originalMatch &&
      roundName !== (originalMatch.roundName ?? '')
    ) {
      payload.roundName = roundName || null;
    }
    if (
      originalMatch &&
      bracketPosition !== (originalMatch.bracketPosition ?? null)
    ) {
      payload.bracketPosition = bracketPosition;
    }
    if (
      originalMatch &&
      nextMatchId !== (originalMatch.nextMatchId ?? null)
    ) {
      payload.nextMatchId = nextMatchId;
    }
    if (
      originalMatch &&
      formValue.isThirdPlace !== (originalMatch.isThirdPlace ?? false)
    ) {
      payload.isThirdPlace = formValue.isThirdPlace;
    }

    return payload;
  }
}
