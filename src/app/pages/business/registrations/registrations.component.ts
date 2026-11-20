import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
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
import { CreateRegistrationDTO } from 'src/app/models/dtos/business/registration-request.dto';
import { Registration } from 'src/app/models/business/registration.model';
import { TeamSport } from 'src/app/models/business/team-sport.model';
import { Team } from 'src/app/models/business/team.model';
import { Tournament } from 'src/app/models/tournament.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { RegistrationService } from 'src/app/services/business/registration.service';
import { TeamSportService } from 'src/app/services/business/team-sport.service';
import { TeamService } from 'src/app/services/business/team.service';
import { TournamentService } from 'src/app/services/tournament.service';

type RegistrationView = 'tournament' | 'team';

interface ApiError {
  status?: number;
  error?: { message?: string | string[] };
}

/**
 * Registers individual teams in tournaments and manages withdrawals.
 */
@Component({
  selector: 'app-registrations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule,
    EntitySelectorComponent,
    AssignmentTableComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './registrations.component.html',
  styleUrls: ['./registrations.component.scss'],
})
export class RegistrationsComponent implements OnInit {
  public get registrationColumns(): ReadonlyArray<AssignmentTableColumn> {
    return [
      { header: this.view === 'tournament' ? 'Team ID' : 'Tournament ID' },
      { header: 'Name', emphasized: true },
      { header: 'Registration date' },
    ];
  }

  public view: RegistrationView = 'tournament';
  public tournaments: Tournament[] = [];
  public teams: Team[] = [];
  public teamSports: TeamSport[] = [];
  public registrations: Registration[] = [];
  public selectedTournamentId: number | null = null;
  public selectedTeamId: number | null = null;
  public selectedTeamToRegisterId: number | null = null;
  public pendingWithdrawal: Registration | null = null;
  public isLoading = false;
  public isLoadingRegistrations = false;
  public isSaving = false;
  public pageLoadError: string | null = null;
  public confirmWithdrawalOpen = false;

  constructor(
    private readonly tournamentService: TournamentService,
    private readonly teamService: TeamService,
    private readonly teamSportService: TeamSportService,
    private readonly registrationService: RegistrationService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {}

  public ngOnInit(): void {
    this.loadInitialData();
  }

  public get tournamentOptions(): EntitySelectorOption[] {
    return this.tournaments.map((tournament) => ({
      id: tournament.tournamentId,
      label: tournament.name,
      description: `#${tournament.tournamentId} · ${tournament.status} · ${tournament.capacity} teams`,
    }));
  }

  public get teamOptions(): EntitySelectorOption[] {
    return this.teams.map((team) => ({
      id: team.teamId,
      label: team.name,
      description: `#${team.teamId} · ${team.category}`,
    }));
  }

  public get selectedTournament(): Tournament | null {
    return (
      this.tournaments.find(
        (tournament) => tournament.tournamentId === this.selectedTournamentId
      ) ?? null
    );
  }

  public get selectedTeam(): Team | null {
    return (
      this.teams.find((team) => team.teamId === this.selectedTeamId) ?? null
    );
  }

  public get availableTeams(): Team[] {
    const tournament = this.selectedTournament;
    if (!tournament || !this.canRegister(tournament)) {
      return [];
    }

    const registeredTeamIds = new Set(
      this.registrations.map((registration) => registration.teamId)
    );
    return this.teams.filter(
      (team) =>
        !registeredTeamIds.has(team.teamId) &&
        this.teamSports.some(
          (assignment) =>
            assignment.teamId === team.teamId &&
            assignment.sportId === tournament.sportId
        )
    );
  }

  public get registrationRows(): AssignmentTableRow[] {
    return this.registrations.map((registration) => {
      const tournament =
        this.view === 'tournament'
          ? this.selectedTournament
          : this.tournaments.find(
              (item) => item.tournamentId === registration.tournamentId
            ) ?? null;
      const entity =
        this.view === 'tournament'
          ? this.teams.find((team) => team.teamId === registration.teamId)
          : tournament;
      const allowedToWithdraw = tournament !== null && this.canWithdraw(tournament);
      const name = entity?.name ?? 'Unknown';

      return {
        id: registration.registrationId,
        values: [
          this.view === 'tournament'
            ? registration.teamId
            : registration.tournamentId,
          name,
          this.formatDate(registration.registrationDate),
        ],
        status: allowedToWithdraw
          ? 'Registered'
          : this.getWithdrawalRestriction(tournament),
        actionLabel: allowedToWithdraw ? 'Withdraw' : undefined,
        actionIcon: allowedToWithdraw ? 'person_remove' : undefined,
        actionHint: allowedToWithdraw ? undefined : 'Withdrawal unavailable',
        muted: !allowedToWithdraw,
      };
    });
  }

  public get registrationGuidance(): string | null {
    const tournament = this.selectedTournament;
    if (!tournament) {
      return null;
    }
    if (!this.canRegister(tournament)) {
      return this.getRegistrationRestriction(tournament);
    }
    if (this.registrations.length >= tournament.capacity) {
      return 'This tournament has reached its team capacity.';
    }
    if (this.availableTeams.length === 0) {
      return 'No eligible teams are available. Teams must be assigned to this tournament’s sport and not already registered.';
    }
    return null;
  }

  public setView(view: RegistrationView): void {
    this.view = view;
    this.selectedTournamentId = null;
    this.selectedTeamId = null;
    this.selectedTeamToRegisterId = null;
    this.registrations = [];
  }

  public loadInitialData(): void {
    this.isLoading = true;
    this.pageLoadError = null;
    forkJoin({
      tournaments: this.tournamentService.findAll(),
      teams: this.teamService.findAll(),
      teamSports: this.teamSportService.findAll(),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ tournaments, teams, teamSports }) => {
          this.tournaments = tournaments;
          this.teams = teams;
          this.teamSports = teamSports;
        },
        error: (error: ApiError) => {
          this.pageLoadError =
            this.getApiMessage(error) ??
            'Could not load tournaments, teams, and sport assignments.';
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.pageLoadError
          );
        },
      });
  }

  public onTournamentSelect(id: number | string): void {
    this.selectedTournamentId = Number(id);
    this.selectedTeamToRegisterId = null;
    this.loadRegistrations();
  }

  public onTeamSelect(id: number | string): void {
    this.selectedTeamId = Number(id);
    this.loadRegistrations();
  }

  public onRegistrationTeamChange(id: number | null): void {
    this.selectedTeamToRegisterId = id;
  }

  public registerTeam(): void {
    const tournament = this.selectedTournament;
    const teamId = this.selectedTeamToRegisterId;
    if (
      !tournament ||
      teamId === null ||
      this.isLoadingRegistrations ||
      !this.canRegister(tournament)
    ) {
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        tournament
          ? this.isLoadingRegistrations
            ? 'Wait for the current registration list to finish loading.'
            : this.getRegistrationRestriction(tournament)
          : 'Select an open tournament and an eligible team.'
      );
      return;
    }
    if (this.registrations.length >= tournament.capacity) {
      this.feedbackHandlerService.warning(
        FeedbackCase.CONFLICT,
        'This tournament has reached its team capacity.'
      );
      return;
    }

    const payload: CreateRegistrationDTO = {
      tournamentId: tournament.tournamentId,
      teamId,
    };
    this.isSaving = true;
    this.registrationService
      .create(payload)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.selectedTeamToRegisterId = null;
          this.feedbackHandlerService.success(
            FeedbackCase.CREATED,
            'Team registered successfully.'
          );
          this.loadRegistrations();
        },
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.registrationErrorMessage(error)
          ),
      });
  }

  public requestWithdrawal(registrationId: number | string): void {
    const registration = this.registrations.find(
      (item) => item.registrationId === Number(registrationId)
    );
    if (!registration) {
      return;
    }

    const tournament = this.tournaments.find(
      (item) => item.tournamentId === registration.tournamentId
    );
    if (!tournament || !this.canWithdraw(tournament)) {
      this.feedbackHandlerService.warning(
        FeedbackCase.CONFLICT,
        this.getWithdrawalRestriction(tournament ?? null)
      );
      return;
    }

    this.pendingWithdrawal = registration;
    this.confirmWithdrawalOpen = true;
  }

  public confirmWithdrawal(): void {
    if (!this.pendingWithdrawal) {
      return;
    }

    const registration = this.pendingWithdrawal;
    this.isSaving = true;
    this.registrationService
      .delete(registration.registrationId)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.closeWithdrawalDialog();
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Team registration withdrawn successfully.'
          );
          this.loadRegistrations();
        },
        error: (error: ApiError) => {
          this.closeWithdrawalDialog();
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.registrationErrorMessage(error, true)
          );
        },
      });
  }

  public cancelWithdrawal(): void {
    this.closeWithdrawalDialog();
  }

  public loadRegistrations(): void {
    const request$ =
      this.view === 'tournament' && this.selectedTournamentId !== null
        ? this.registrationService.findByTournament(this.selectedTournamentId)
        : this.view === 'team' && this.selectedTeamId !== null
          ? this.registrationService.findByTeam(this.selectedTeamId)
          : null;

    if (!request$) {
      this.registrations = [];
      return;
    }

    this.registrations = [];
    this.isLoadingRegistrations = true;
    request$
      .pipe(finalize(() => (this.isLoadingRegistrations = false)))
      .subscribe({
        next: (registrations) => (this.registrations = registrations),
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getApiMessage(error) ?? 'Could not load registrations.'
          ),
      });
  }

  public canRegister(tournament: Tournament): boolean {
    return tournament.status === 'OPEN' && this.isBeforeDeadline(tournament);
  }

  public canWithdraw(tournament: Tournament): boolean {
    return tournament.status === 'OPEN' && this.isBeforeDeadline(tournament);
  }

  private isBeforeDeadline(tournament: Tournament): boolean {
    const today = this.localDateString();
    const startDate = tournament.startDate.slice(0, 10);
    const deadline = (
      tournament.registrationEndDate ?? tournament.startDate
    ).slice(0, 10);
    return startDate > today && today <= deadline;
  }

  private getRegistrationRestriction(tournament: Tournament): string {
    if (tournament.status !== 'OPEN') {
      return 'Only tournaments with OPEN status accept registrations or withdrawals.';
    }
    if (tournament.startDate.slice(0, 10) <= this.localDateString()) {
      return 'The tournament must not have started and must be in the future.';
    }
    return 'The registration deadline has passed.';
  }

  private getWithdrawalRestriction(tournament: Tournament | null): string {
    if (!tournament) {
      return 'The tournament for this registration could not be found.';
    }
    return this.getRegistrationRestriction(tournament);
  }

  private registrationErrorMessage(
    error: ApiError,
    withdrawing = false
  ): string {
    const backendMessage = this.getApiMessage(error);
    if (backendMessage) {
      return backendMessage;
    }
    if (error.status === 400) {
      return 'The team must be associated with the tournament sport before registration.';
    }
    if (error.status === 404) {
      return 'The tournament, team, or registration was not found.';
    }
    if (error.status === 409) {
      return withdrawing
        ? 'The registration cannot be withdrawn because of the tournament status or dates.'
        : 'The team cannot be registered because of the tournament status, dates, capacity, or an existing registration.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'Your account is not authorized to manage tournament registrations.';
    }
    return withdrawing
      ? 'Could not withdraw the team registration.'
      : 'Could not register the team.';
  }

  private getApiMessage(error: ApiError): string | null {
    const message = error.error?.message;
    return Array.isArray(message) ? message.join(' ') : message ?? null;
  }

  private localDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(value: string): string {
    return value.slice(0, 10);
  }

  private closeWithdrawalDialog(): void {
    this.confirmWithdrawalOpen = false;
    this.pendingWithdrawal = null;
  }
}
