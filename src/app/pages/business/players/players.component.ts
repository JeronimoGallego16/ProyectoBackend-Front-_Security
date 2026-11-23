import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import {
  DetailDialogAction,
  DetailDialogComponent,
} from 'src/app/components/detail-dialog/detail-dialog.component';
import {
  DynamicFormComponent,
  FormFieldConfig,
} from 'src/app/components/dynamic-form/dynamic-form.component';
import {
  DataTableComponent,
  TableAction,
  TableColumn,
} from 'src/app/components/table-list/table-list.component';
import { CreatePlayerDTO, UpdatePlayerDTO } from 'src/app/models/dtos/business/player-request.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { PlayerProfile } from 'src/app/models/business/player-profile.model';
import { Player, PlayerGender } from 'src/app/models/business/player.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { PlayerService } from 'src/app/services/business/player.service';

interface ApiError {
  status?: number;
  error?: { message?: string | string[] };
}

interface PlayerTableRow extends Player {
  fullName: string;
}

@Component({
  selector: 'app-players',
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
  templateUrl: './players.component.html',
})
export class PlayersComponent implements OnInit {
  public readonly columns: TableColumn[] = [
    { field: 'fullName', header: 'Name' },
    { field: 'identification', header: 'Identification' },
    { field: 'email', header: 'Email' },
    { field: 'gender', header: 'Gender' },
    { field: 'active', header: 'Active' },
  ];

  public readonly playerActions: TableAction[] = [
    { label: 'Manage skills', icon: 'workspace_premium', color: 'primary' },
  ];

  public readonly fields: FormFieldConfig[] = [
    { name: 'name', label: 'Name', type: 'text', placeholder: 'First name' },
    {
      name: 'lastName',
      label: 'Last name',
      type: 'text',
      placeholder: 'Last name',
    },
    {
      name: 'birthDate',
      label: 'Birth date',
      type: 'date',
      placeholder: 'Birth date',
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      options: [
        { value: 'MALE', label: 'Male' },
        { value: 'FEMALE', label: 'Female' },
        { value: 'OTHER', label: 'Other' },
        { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
      ],
    },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Email' },
    {
      name: 'identification',
      label: 'Identification',
      type: 'text',
      placeholder: 'Identification',
    },
  ];

  public readonly detailFields = [
    { key: 'playerId', label: 'ID' },
    { key: 'fullName', label: 'Name' },
    { key: 'birthDate', label: 'Birth date' },
    { key: 'gender', label: 'Gender' },
    { key: 'email', label: 'Email' },
    { key: 'identification', label: 'Identification' },
    { key: 'active', label: 'Active' },
    { key: 'skills', label: 'Skills' },
    { key: 'teams', label: 'Team history' },
  ];

  public readonly detailActions: DetailDialogAction[] = [
    { label: 'Manage skills', icon: 'workspace_premium', color: 'primary' },
    { label: 'Team history', icon: 'groups', color: 'primary' },
  ];

  public players: Player[] = [];
  public playerForm: FormGroup;
  public showForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  public pendingDeletePlayer: Player | null = null;
  public detailOpen = false;
  public selectedPlayerProfile: Record<string, unknown> | null = null;
  private editingPlayerId: number | null = null;
  private originalPlayer: Player | null = null;

  public get playerRows(): PlayerTableRow[] {
    return this.players.map((player) => ({
      ...player,
      fullName: `${player.name} ${player.lastName}`,
    }));
  }

  public get formFields(): FormFieldConfig[] {
    if (!this.isEditing) {
      return this.fields;
    }
    return [
      ...this.fields,
      {
        name: 'active',
        label: 'Active',
        type: 'checkbox',
      },
    ];
  }

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly playerService: PlayerService,
    private readonly feedbackHandlerService: FeedbackHandlerService,
    private readonly router: Router
  ) {
    this.playerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
      birthDate: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      identification: [
        '',
        [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)],
      ],
      active: [true],
    });
  }

  public ngOnInit(): void {
    this.loadPlayers();
  }

  public loadPlayers(): void {
    this.isLoading = true;
    this.playerService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (players) => (this.players = players),
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, 'Could not load players.')
          ),
      });
  }

  public onCreateClick(): void {
    this.isEditing = false;
    this.editingPlayerId = null;
    this.originalPlayer = null;
    this.playerForm.reset(this.emptyFormValue());
    this.showForm = true;
  }

  public onEdit(player: Player): void {
    this.isEditing = true;
    this.editingPlayerId = player.playerId;
    this.originalPlayer = player;
    this.playerForm.reset({
      name: player.name,
      lastName: player.lastName,
      birthDate: this.toDateValue(player.birthDate),
      gender: player.gender,
      email: player.email,
      identification: player.identification,
      active: player.active,
    });
    this.showForm = true;
  }

  public onView(player: Player): void {
    this.isLoading = true;
    this.playerService
      .findProfile(player.playerId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (profile) => {
          this.selectedPlayerProfile = this.toProfileDetails(profile);
          this.detailOpen = true;
        },
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, 'Could not load the player profile.')
          ),
      });
  }

  public onProfileAction(action: string): void {
    const playerId = this.selectedPlayerProfile?.['playerId'];
    if (typeof playerId !== 'number') {
      return;
    }
    const route =
      action === 'Manage skills'
        ? ['/players', playerId, 'skills']
        : action === 'Team history'
          ? ['/players', playerId, 'teams']
          : null;
    if (!route) {
      return;
    }
    this.onCloseDetail();
    this.router.navigate(route);
  }

  public onPlayerAction(event: { action: string; row: Player }): void {
    if (event.action === 'Manage skills') {
      this.router.navigate(['/players', event.row.playerId, 'skills']);
    }
  }

  public onCloseDetail(): void {
    this.detailOpen = false;
    this.selectedPlayerProfile = null;
  }

  public onDelete(player: Player): void {
    this.pendingDeletePlayer = player;
    this.confirmDeleteOpen = true;
  }

  public onConfirmDelete(): void {
    if (!this.pendingDeletePlayer) {
      return;
    }

    const player = this.pendingDeletePlayer;
    this.isLoading = true;
    this.playerService
      .delete(player.playerId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Player deleted successfully.'
          );
          this.closeDeleteDialog();
          this.loadPlayers();
        },
        error: (error: ApiError) => {
          const fallback =
            error.status === 409
              ? 'This player has associated information and cannot be deleted. Deactivate the player instead.'
              : 'Could not delete the player.';
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, fallback)
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
    if (this.playerForm.invalid) {
      this.playerForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Please complete all required player fields with valid values.'
      );
      return;
    }

    const value = this.playerForm.getRawValue() as {
      name: string;
      lastName: string;
      birthDate: Date | string;
      gender: PlayerGender;
      email: string;
      identification: string;
      active: boolean;
    };
    const wasEditing = this.isEditing;
    let request$;

    if (wasEditing && this.editingPlayerId !== null) {
      const payload = this.buildUpdatePayload(value);
      if (Object.keys(payload).length === 0) {
        this.feedbackHandlerService.info(
          FeedbackCase.INFO,
          'No changes to save.'
        );
        this.cancelForm();
        return;
      }
      request$ = this.playerService.update(this.editingPlayerId, payload);
    } else {
      request$ = this.playerService.create(this.buildCreatePayload(value));
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing
            ? 'Player updated successfully.'
            : 'Player created successfully.'
        );
        this.cancelForm();
        this.loadPlayers();
      },
      error: (error: ApiError) =>
        this.feedbackHandlerService.error(
          String(error.status ?? FeedbackCase.SERVER_ERROR),
          this.getErrorMessage(error, 'Could not save the player.')
        ),
    });
  }

  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingPlayerId = null;
    this.originalPlayer = null;
    this.playerForm.reset(this.emptyFormValue());
  }

  private buildCreatePayload(value: {
    name: string;
    lastName: string;
    birthDate: Date | string;
    gender: PlayerGender;
    email: string;
    identification: string;
  }): CreatePlayerDTO {
    return {
      name: value.name.trim(),
      lastName: value.lastName.trim(),
      birthDate: this.toIsoDate(value.birthDate),
      gender: value.gender,
      email: value.email.trim(),
      identification: value.identification.trim(),
    };
  }

  private buildUpdatePayload(value: {
    name: string;
    lastName: string;
    birthDate: Date | string;
    gender: PlayerGender;
    email: string;
    identification: string;
    active: boolean;
  }): UpdatePlayerDTO {
    const original = this.originalPlayer;
    const payload: UpdatePlayerDTO = {};
    if (!original) {
      return payload;
    }

    const birthDate = this.toIsoDate(value.birthDate);
    if (value.name.trim() !== original.name) payload.name = value.name.trim();
    if (value.lastName.trim() !== original.lastName) {
      payload.lastName = value.lastName.trim();
    }
    if (birthDate !== original.birthDate.slice(0, 10)) {
      payload.birthDate = birthDate;
    }
    if (value.gender !== original.gender) payload.gender = value.gender;
    if (value.email.trim() !== original.email) {
      payload.email = value.email.trim();
    }
    if (value.identification.trim() !== original.identification) {
      payload.identification = value.identification.trim();
    }
    if (value.active !== original.active) payload.active = value.active;
    return payload;
  }

  private toProfileDetails(profile: PlayerProfile): Record<string, unknown> {
    const player = profile.player;
    return {
      playerId: player.playerId,
      fullName: `${player.name} ${player.lastName}`,
      birthDate: player.birthDate.slice(0, 10),
      gender: player.gender,
      email: player.email,
      identification: player.identification,
      active: player.active ? 'Active' : 'Inactive',
      skills:
        profile.skills
          .map((item) => `${item.skillName} (Level ${item.level})`)
          .join(', ') || 'No skills',
      teams:
        profile.teams
          .map(
            (item) =>
              `${item.teamName}: ${item.startDate.slice(0, 10)} - ${item.endDate?.slice(0, 10) ?? 'Current'}`
          )
          .join('; ') || 'No team history',
    };
  }

  private toDateValue(value: string): Date {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toIsoDate(value: Date | string): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  private emptyFormValue(): {
    name: string;
    lastName: string;
    birthDate: string;
    gender: string;
    email: string;
    identification: string;
    active: boolean;
  } {
    return {
      name: '',
      lastName: '',
      birthDate: '',
      gender: '',
      email: '',
      identification: '',
      active: true,
    };
  }

  private closeDeleteDialog(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeletePlayer = null;
  }

  private getErrorMessage(error: ApiError, fallback: string): string {
    const message = error.error?.message;
    return Array.isArray(message) ? message.join(' ') : message ?? fallback;
  }
}
