import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import {
  AssignmentTableComponent,
  AssignmentTableRow,
  AssignmentTableColumn,
} from 'src/app/components/assignment-table/assignment-table.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import {
  DataTableComponent,
  TableAction,
  TableColumn,
} from 'src/app/components/table-list/table-list.component';
import {
  DynamicFormComponent,
  FormFieldConfig,
} from 'src/app/components/dynamic-form/dynamic-form.component';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { Player } from 'src/app/models/business/player.model';
import { PlayerTeam } from 'src/app/models/business/player-team.model';
import { Team } from 'src/app/models/business/team.model';
import {
  AssignPlayerTeamDTO,
  RetirePlayerTeamDTO,
} from 'src/app/models/dtos/business/player-team-request.dto';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { PlayerService } from 'src/app/services/business/player.service';
import { PlayerTeamService } from 'src/app/services/business/player-team.service';
import { TeamService } from 'src/app/services/business/team.service';

interface ApiError {
  status?: number;
  error?: { message?: string | string[] };
}

type PlayerTeamContext = 'player' | 'team';

interface PlayerTeamRow extends PlayerTeam {
  entityId: number;
  entityName: string;
  startDateDisplay: string;
  endDateDisplay: string;
  status: string;
}

@Component({
  selector: 'app-player-teams',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule,
    ReactiveFormsModule,
    AssignmentTableComponent,
    DataTableComponent,
    DynamicFormComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './player-teams.component.html',
})
export class PlayerTeamsComponent implements OnInit {
  public readonly assignmentColumns: TableColumn[] = [
    { field: 'entityId', header: 'ID' },
    { field: 'entityName', header: 'Name' },
    { field: 'startDateDisplay', header: 'Start date' },
    { field: 'endDateDisplay', header: 'End date' },
    { field: 'status', header: 'Status' },
  ];

  public readonly selectionColumns: ReadonlyArray<AssignmentTableColumn> = [
    { header: 'Player ID' },
    { header: 'Player', emphasized: true },
  ];

  public readonly actions: TableAction[] = [
    {
      label: 'Retire',
      icon: 'person_remove',
      color: 'warn',
      visible: (row) => this.isCurrentAssignment(row),
    },
    {
      label: 'Delete scheduled assignment',
      icon: 'delete',
      color: 'warn',
      visible: (row) => this.isScheduledAssignment(row),
    },
  ];

  public readonly hideDefaultAction = (_row: object): boolean => false;

  public readonly assignmentFields: FormFieldConfig[] = [
    {
      name: 'startDate',
      label: 'Start date',
      type: 'date',
      placeholder: 'Start date',
    },
    {
      name: 'endDate',
      label: 'End date (optional)',
      type: 'date',
      placeholder: 'End date',
    },
  ];

  public get retirementFields(): FormFieldConfig[] {
    return [
      {
        name: 'endDate',
        label: 'End date',
        type: 'date',
        placeholder: 'End date',
        min: this.pendingRetirement
          ? this.toDateValue(this.pendingRetirement.startDate)
          : undefined,
        max:
          this.pendingRetirement?.endDate
            ? this.toDateValue(this.pendingRetirement.endDate)
            : undefined,
      },
    ];
  }

  public context: PlayerTeamContext = 'player';
  public player: Player | null = null;
  public team: Team | null = null;
  public players: Player[] = [];
  public assignments: PlayerTeam[] = [];
  public selectedPlayerId: number | null = null;
  public pendingRetirement: PlayerTeam | null = null;
  public pendingScheduledDeletion: PlayerTeam | null = null;
  public assignmentForm: FormGroup;
  public retirementForm: FormGroup;
  public isLoading = false;
  public isSaving = false;
  public currentOnly = false;
  public showAssignmentForm = false;
  public showRetirementForm = false;
  private readonly entityId: number;

  public get assignmentRows(): PlayerTeamRow[] {
    return this.assignments.map((assignment) => ({
      ...assignment,
      entityId:
        this.context === 'player' ? assignment.teamId : assignment.playerId,
      entityName:
        this.context === 'player' ? assignment.teamName : assignment.playerName,
      startDateDisplay: assignment.startDate.slice(0, 10),
      endDateDisplay: assignment.endDate?.slice(0, 10) ?? 'Open',
      status: this.isCurrentAssignment(assignment)
        ? 'Current'
        : this.isScheduledAssignment(assignment)
          ? 'Scheduled'
          : 'History',
    }));
  }

  public get selectablePlayerRows(): AssignmentTableRow[] {
    const currentPlayerIds = new Set(
      this.assignments
        .filter((assignment) => this.isCurrentAssignment(assignment))
        .map((assignment) => assignment.playerId)
    );
    return this.players
      .filter((player) => !currentPlayerIds.has(player.playerId))
      .map((player) => ({
        id: player.playerId,
        values: [player.playerId, `${player.name} ${player.lastName}`],
        status: 'Available',
        selectable: true,
        selected: this.selectedPlayerId === player.playerId,
        actionHint: 'Select to assign',
      }));
  }

  constructor(
    route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly playerService: PlayerService,
    private readonly teamService: TeamService,
    private readonly playerTeamService: PlayerTeamService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.context =
      route.snapshot.data['context'] === 'team' ? 'team' : 'player';
    this.entityId = Number(route.snapshot.paramMap.get('id'));
    this.assignmentForm = this.formBuilder.group({
      startDate: ['', Validators.required],
      endDate: [''],
    });
    this.retirementForm = this.formBuilder.group({
      endDate: ['', Validators.required],
    });
  }

  public ngOnInit(): void {
    if (!Number.isInteger(this.entityId) || this.entityId < 1) {
      this.feedbackHandlerService.error(
        String(FeedbackCase.BAD_REQUEST),
        'The player or team identifier is invalid.'
      );
      return;
    }
    this.loadData();
  }

  public loadData(): void {
    this.isLoading = true;
    if (this.context === 'player') {
      forkJoin({
        player: this.playerService.findById(this.entityId),
        assignments: this.playerTeamService.findByPlayer(this.entityId),
      })
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: ({ player, assignments }) => {
            this.player = player;
            this.assignments = assignments;
            this.players = [];
            this.selectedPlayerId = null;
          },
          error: (error: ApiError) => this.handleLoadError(error),
        });
      return;
    }

    forkJoin({
      team: this.teamService.findById(this.entityId),
      players: this.playerService.findAll(),
      assignments: this.playerTeamService.findByTeam(
        this.entityId,
        this.currentOnly
      ),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ team, players, assignments }) => {
          this.team = team;
          this.players = players;
          this.assignments = assignments;
          this.selectedPlayerId = null;
        },
        error: (error: ApiError) => this.handleLoadError(error),
      });
  }

  public onCurrentOnlyChange(currentOnly: boolean): void {
    this.currentOnly = currentOnly;
    this.loadData();
  }

  public onPlayerSelection(playerId: number | string): void {
    const id = Number(playerId);
    if (this.selectedPlayerId === id) {
      this.cancelAssignment();
      return;
    }
    this.selectedPlayerId = id;
    this.assignmentForm.reset({ startDate: '', endDate: '' });
    this.showAssignmentForm = true;
  }

  public onAssignmentAction(id: number | string): void {
    const assignment = this.assignments.find(
      (item) => item.playerTeamId === Number(id)
    );
    if (!assignment || !this.isCurrentAssignment(assignment)) {
      return;
    }
    this.pendingRetirement = assignment;
    this.retirementForm.reset({ endDate: '' });
    this.showRetirementForm = true;
  }

  public onCustomAction(event: {
    action: string;
    row: PlayerTeamRow;
  }): void {
    if (event.action === 'Retire') {
      this.onAssignmentAction(event.row.playerTeamId);
    } else if (
      event.action === 'Delete scheduled assignment' &&
      this.isScheduledAssignment(event.row)
    ) {
      this.pendingScheduledDeletion = event.row;
    }
  }

  public deleteScheduledAssignment(): void {
    if (!this.pendingScheduledDeletion || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.playerTeamService
      .deleteScheduled(this.pendingScheduledDeletion.playerTeamId)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Scheduled assignment deleted successfully.'
          );
          this.pendingScheduledDeletion = null;
          this.loadData();
        },
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, 'Could not delete the scheduled assignment.')
          ),
      });
  }

  public assignSelectedPlayer(): void {
    if (this.assignmentForm.invalid || this.selectedPlayerId === null) {
      this.assignmentForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Select a player and enter a valid start date.'
      );
      return;
    }

    const value = this.assignmentForm.getRawValue() as {
      startDate: Date | string;
      endDate: Date | string;
    };
    const payload: AssignPlayerTeamDTO = {
      playerId: this.selectedPlayerId,
      startDate: this.toIsoDate(value.startDate),
    };
    const endDate = this.toIsoDate(value.endDate);
    if (endDate) {
      payload.endDate = endDate;
    }

    this.isSaving = true;
    this.playerTeamService
      .assign(this.entityId, payload)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.CREATED,
            'Player assigned to the team successfully.'
          );
          this.cancelAssignment();
          this.loadData();
        },
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, 'Could not assign the player.')
          ),
      });
  }

  public retirePlayer(): void {
    if (!this.pendingRetirement || this.retirementForm.invalid) {
      this.retirementForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Enter a valid end date.'
      );
      return;
    }

    const value = this.retirementForm.getRawValue() as {
      endDate: Date | string;
    };
    const payload: RetirePlayerTeamDTO = {
      endDate: this.toIsoDate(value.endDate),
    };
    this.isSaving = true;
    this.playerTeamService
      .retire(
        this.pendingRetirement.teamId,
        this.pendingRetirement.playerId,
        payload
      )
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          const retirementIsFuture =
            payload.endDate > new Date().toISOString().slice(0, 10);
          this.feedbackHandlerService.success(
            FeedbackCase.OK,
            retirementIsFuture
              ? `Retirement date updated to ${payload.endDate}. The player remains on the team until then.`
              : 'Player retired from the team.'
          );
          this.cancelRetirement();
          this.loadData();
        },
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, 'Could not retire the player.')
          ),
      });
  }

  public cancelAssignment(): void {
    this.showAssignmentForm = false;
    this.selectedPlayerId = null;
    this.assignmentForm.reset({ startDate: '', endDate: '' });
  }

  public cancelRetirement(): void {
    this.showRetirementForm = false;
    this.pendingRetirement = null;
    this.retirementForm.reset({ endDate: '' });
  }

  private toIsoDate(value: Date | string): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  private toDateValue(value: string): Date {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private isCurrentAssignment(
    assignment: Pick<PlayerTeam, 'startDate' | 'endDate'>,
  ): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const startDate = assignment.startDate.slice(0, 10);
    const endDate = assignment.endDate?.slice(0, 10) ?? null;
    return startDate <= today && (endDate === null || endDate > today);
  }

  private isScheduledAssignment(assignment: Pick<PlayerTeam, 'startDate'>): boolean {
    return assignment.startDate.slice(0, 10) > new Date().toISOString().slice(0, 10);
  }

  private getErrorMessage(error: ApiError, fallback: string): string {
    const message = error.error?.message;
    return Array.isArray(message) ? message.join(' ') : message ?? fallback;
  }

  private handleLoadError(error: ApiError): void {
    this.feedbackHandlerService.error(
      String(error.status ?? FeedbackCase.SERVER_ERROR),
      this.getErrorMessage(error, 'Could not load player-team history.')
    );
  }
}
