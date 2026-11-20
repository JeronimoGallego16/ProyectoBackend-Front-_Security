import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  AssignmentTableColumn,
  AssignmentTableComponent,
  AssignmentTableRow,
} from 'src/app/components/assignment-table/assignment-table.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import {
  EntitySelectorComponent,
  EntitySelectorOption,
} from 'src/app/components/entity-selector/entity-selector.component';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { CreateTeamSportDTO } from 'src/app/models/dtos/business/team-sport-request.dto';
import { Sport } from 'src/app/models/business/sport.model';
import { Team } from 'src/app/models/business/team.model';
import { TeamSport } from 'src/app/models/business/team-sport.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { SportService } from 'src/app/services/business/sport.service';
import { TeamSportService } from 'src/app/services/business/team-sport.service';
import { TeamService } from 'src/app/services/business/team.service';

/**
 * Page that assigns sports to teams and removes only the assignment records.
 */
@Component({
  selector: 'app-team-sports',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    AssignmentTableComponent,
    EntitySelectorComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './team-sports.component.html',
  styleUrls: ['./team-sports.component.scss'],
})
export class TeamSportsComponent implements OnInit {
  public readonly assignmentTableColumns: ReadonlyArray<AssignmentTableColumn> = [
    { header: 'Sport ID' },
    { header: 'Sport', emphasized: true },
  ];
  public teams: Team[] = [];
  public sports: Sport[] = [];
  public assignments: TeamSport[] = [];
  public selectedTeam: Team | null = null;
  public selectedSportIds = new Set<number>();
  public pendingRemoval: TeamSport | null = null;
  public isLoading = false;
  public isLoadingAssignments = false;
  public isSaving = false;
  public confirmRemovalOpen = false;
  public pageLoadError: string | null = null;
  public assignmentLoadError: string | null = null;

  /**
   * Builds selector options from the available teams.
   *
   * @returns Team options with their identifiers and categories.
   */
  public get teamOptions(): EntitySelectorOption[] {
    return this.teams.map((team) => ({
      id: team.teamId,
      label: team.name,
      description: `#${team.teamId} · ${team.category}`,
    }));
  }

  /**
   * Creates the team-sports page.
   *
   * @param teamService - Service providing teams.
   * @param sportService - Service providing sports.
   * @param teamSportService - Service managing team-sport assignments.
   * @param feedbackHandlerService - Service used to publish toast feedback.
   */
  constructor(
    private readonly teamService: TeamService,
    private readonly sportService: SportService,
    private readonly teamSportService: TeamSportService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {}

  /**
   * Loads teams, sports, and existing assignments on page initialization.
   */
  public ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Loads the data required to render the assignment page.
   */
  public loadInitialData(): void {
    this.isLoading = true;
    this.pageLoadError = null;

    forkJoin({
      teams: this.teamService.findAll(),
      sports: this.sportService.findAll(),
      assignments: this.teamSportService.findAll(),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ teams, sports, assignments }) => {
          this.teams = teams;
          this.sports = sports;
          this.assignments = assignments;
          this.assignmentLoadError = null;
          this.selectedSportIds.clear();
        },
        error: (error: { status?: number }) => {
          this.pageLoadError =
            'Could not load teams, sports, or assignments. Please try again.';
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            this.pageLoadError
          );
        },
      });
  }

  /**
   * Selects a team and clears any unsaved sport selections.
   *
   * @param team - Team whose sports are being managed.
   */
  public onTeamSelect(team: Team): void {
    this.selectedTeam = team;
    this.selectedSportIds.clear();
    this.assignmentLoadError = null;
  }

  /**
   * Selects a team emitted by the shared entity selector.
   *
   * @param teamId - Identifier of the selected team.
   */
  public onTeamOptionSelect(teamId: number | string): void {
    const team = this.teams.find((candidate) => candidate.teamId === Number(teamId));
    if (team) {
      this.onTeamSelect(team);
    }
  }

  /**
   * Returns sports not currently assigned to the selected team.
   *
   * @returns Available sports for the selected team.
   */
  public get availableSports(): Sport[] {
    if (!this.selectedTeam) {
      return [];
    }

    const assignedSportIds = new Set(
      this.getSelectedTeamAssignments().map(
        (assignment) => assignment.sportId
      )
    );
    return this.sports.filter(
      (sport) => !assignedSportIds.has(sport.sportId)
    );
  }

  /**
   * Returns assignments belonging to the selected team.
   *
   * @returns The selected team's current assignment records.
   */
  public getSelectedTeamAssignments(): TeamSport[] {
    if (!this.selectedTeam) {
      return [];
    }

    return this.assignments.filter(
      (assignment) => assignment.teamId === this.selectedTeam?.teamId
    );
  }

  /**
   * Builds display rows for the selected team's assignment table.
   *
   * @returns Assignment rows with sport names and removal actions.
   */
  public get assignmentTableRows(): AssignmentTableRow[] {
    const assignedSportIds = new Set(
      this.getSelectedTeamAssignments().map((assignment) => assignment.sportId)
    );

    return this.sports.map((sport) => {
      const assigned = assignedSportIds.has(sport.sportId);
      return {
        id: sport.sportId,
        values: [sport.sportId, sport.name],
        status: assigned ? 'Assigned' : 'Available',
        selectable: !assigned,
        selected: this.selectedSportIds.has(sport.sportId),
        actionLabel: assigned ? 'Remove sport' : undefined,
        actionIcon: assigned ? 'link_off' : undefined,
        actionHint: assigned ? undefined : 'Select to assign',
        muted: assigned,
      };
    });
  }

  /**
   * Toggles selection for a sport emitted by the shared assignment table.
   *
   * @param sportId - Identifier of the sport whose selection changed.
   */
  public onAssignmentTableSelection(sportId: number | string): void {
    const selectedSportId = Number(sportId);
    if (!this.availableSports.some((sport) => sport.sportId === selectedSportId)) {
      this.selectedSportIds.delete(selectedSportId);
      return;
    }

    if (this.selectedSportIds.has(selectedSportId)) {
      this.selectedSportIds.delete(selectedSportId);
    } else {
      this.selectedSportIds.add(selectedSportId);
    }
  }

  /**
   * Opens the removal confirmation for an assigned sport emitted by the table.
   *
   * @param sportId - Identifier of the sport assignment to remove.
   */
  public onAssignmentTableAction(sportId: number | string): void {
    const assignment = this.getSelectedTeamAssignments().find(
      (candidate) => candidate.sportId === Number(sportId)
    );
    if (assignment) {
      this.requestRemoval(assignment);
    }
  }

  /**
   * Creates assignments for the selected sports.
   */
  public assignSelectedSports(): void {
    if (!this.selectedTeam || this.selectedSportIds.size === 0) {
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Select at least one available sport.'
      );
      return;
    }

    const payloads: CreateTeamSportDTO[] = Array.from(
      this.selectedSportIds,
      (sportId) => ({
        teamId: this.selectedTeam!.teamId,
        sportId,
      })
    );
    const requests: Observable<TeamSport>[] = payloads.map((payload) =>
      this.teamSportService.create(payload)
    );

    this.isSaving = true;
    forkJoin(requests)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.CREATED,
            'Sports assigned to the team successfully.'
          );
          this.selectedSportIds.clear();
          this.loadAssignments();
        },
        error: (error: { status?: number }) => {
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            error?.status === 409
              ? 'One or more selected sports are already assigned to this team.'
              : error?.status === 404
                ? 'The selected team or sport no longer exists.'
                : 'Could not assign the selected sports to the team.'
          );
          this.loadAssignments();
        },
      });
  }

  /**
   * Opens the confirmation dialog for removing an assignment.
   *
   * @param assignment - Assignment record selected for removal.
   */
  public requestRemoval(assignment: TeamSport): void {
    this.pendingRemoval = assignment;
    this.confirmRemovalOpen = true;
  }

  /**
   * Cancels the pending assignment removal.
   */
  public cancelRemoval(): void {
    this.confirmRemovalOpen = false;
    this.pendingRemoval = null;
  }

  /**
   * Deletes the selected assignment record and refreshes the assignment list.
   */
  public confirmRemoval(): void {
    if (!this.pendingRemoval) {
      return;
    }

    this.isSaving = true;
    this.teamSportService
      .delete(this.pendingRemoval.teamSportId)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Sport removed from the team.'
          );
          this.cancelRemoval();
          this.loadAssignments();
        },
        error: (error: { status?: number }) => {
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not remove the sport from the team.'
          );
          this.cancelRemoval();
        },
      });
  }

  /**
   * Finds the display name for a sport identifier.
   *
   * @param sportId - Identifier of the sport to display.
   * @returns Sport name, or a not-found label if it is no longer available.
   */
  public getSportName(sportId: number): string {
    return (
      this.sports.find((sport) => sport.sportId === sportId)?.name ??
      `Sport #${sportId}`
    );
  }

  /**
   * Reloads assignment records after a create or delete operation.
   */
  public loadAssignments(): void {
    this.isLoadingAssignments = true;
    this.assignmentLoadError = null;
    this.teamSportService
      .findAll()
      .pipe(finalize(() => (this.isLoadingAssignments = false)))
      .subscribe({
        next: (assignments) => {
          this.assignments = assignments;
          this.selectedSportIds.clear();
        },
        error: (error: { status?: number }) => {
          this.assignmentLoadError =
            'Could not refresh assignments. Please try again.';
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            this.assignmentLoadError
          );
        },
      });
  }
}
