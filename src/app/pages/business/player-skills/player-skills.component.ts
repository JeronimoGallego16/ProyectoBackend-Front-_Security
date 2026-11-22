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
  AssignmentTableColumn,
  AssignmentTableComponent,
  AssignmentTableRow,
} from 'src/app/components/assignment-table/assignment-table.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import {
  DynamicFormComponent,
  FormFieldConfig,
} from 'src/app/components/dynamic-form/dynamic-form.component';
import {
  DataTableComponent,
  TableColumn,
} from 'src/app/components/table-list/table-list.component';
import { Skill } from 'src/app/models/business/skill.model';
import { Player } from 'src/app/models/business/player.model';
import { PlayerSkill } from 'src/app/models/business/player-skill.model';
import {
  AssignPlayerSkillDTO,
  UpdatePlayerSkillDTO,
} from 'src/app/models/dtos/business/player-skill-request.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { PlayerService } from 'src/app/services/business/player.service';
import { PlayerSkillService } from 'src/app/services/business/player-skill.service';
import { SkillService } from 'src/app/services/business/skill.service';

interface ApiError {
  status?: number;
  error?: { message?: string | string[] };
}

@Component({
  selector: 'app-player-skills',
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
  templateUrl: './player-skills.component.html',
})
export class PlayerSkillsComponent implements OnInit {
  public readonly hideViewAction = (_row: object): boolean => false;

  public readonly selectionColumns: ReadonlyArray<AssignmentTableColumn> = [
    { header: 'Skill ID' },
    { header: 'Skill', emphasized: true },
  ];

  public readonly assignmentColumns: TableColumn[] = [
    { field: 'skillName', header: 'Skill' },
    { field: 'level', header: 'Level' },
    { field: 'observations', header: 'Observations' },
  ];

  public readonly fields: FormFieldConfig[] = [
    {
      name: 'level',
      label: 'Level',
      type: 'text',
      placeholder: 'Integer from 1 to 5',
    },
    {
      name: 'observations',
      label: 'Observations',
      type: 'textarea',
      placeholder: 'Optional observations',
    },
  ];

  public player: Player | null = null;
  public skills: Skill[] = [];
  public assignments: PlayerSkill[] = [];
  public selectedSkillId: number | null = null;
  public pendingDeleteAssignment: PlayerSkill | null = null;
  public playerSkillForm: FormGroup;
  public showForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  private readonly playerId: number;
  private editingAssignment: PlayerSkill | null = null;

  public get selectionRows(): AssignmentTableRow[] {
    const assignedSkillIds = new Set(
      this.assignments.map((assignment) => assignment.skillId)
    );
    return this.skills.map((skill) => {
      const assigned = assignedSkillIds.has(skill.skillId);
      return {
        id: skill.skillId,
        values: [skill.skillId, skill.name],
        status: assigned ? 'Assigned' : 'Available',
        selectable: !assigned,
        selected: this.selectedSkillId === skill.skillId,
        actionHint: assigned ? 'Already assigned' : 'Select to assign',
        muted: assigned,
      };
    });
  }

  constructor(
    route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly playerService: PlayerService,
    private readonly skillService: SkillService,
    private readonly playerSkillService: PlayerSkillService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.playerId = Number(route.snapshot.paramMap.get('id'));
    this.playerSkillForm = this.formBuilder.group({
      level: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[1-5]$/),
          Validators.min(1),
          Validators.max(5),
        ],
      ],
      observations: [''],
    });
  }

  public ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading = true;
    forkJoin({
      player: this.playerService.findById(this.playerId),
      skills: this.skillService.findAll(),
      assignments: this.playerSkillService.findByPlayer(this.playerId),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ player, skills, assignments }) => {
          this.player = player;
          this.skills = skills;
          this.assignments = assignments;
          this.selectedSkillId = null;
        },
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(
              error,
              'Could not load player skills and available skills.'
            )
          ),
      });
  }

  public onSkillSelection(skillId: number | string): void {
    const id = Number(skillId);
    if (this.selectedSkillId === id) {
      this.cancelForm();
      return;
    }

    this.selectedSkillId = id;
    this.isEditing = false;
    this.editingAssignment = null;
    this.playerSkillForm.reset({ level: '', observations: '' });
    this.showForm = true;
  }

  public onEdit(assignment: PlayerSkill): void {
    this.isEditing = true;
    this.editingAssignment = assignment;
    this.selectedSkillId = null;
    this.playerSkillForm.reset({
      level: String(assignment.level),
      observations: assignment.observations ?? '',
    });
    this.showForm = true;
  }

  public onSubmit(): void {
    if (this.playerSkillForm.invalid) {
      this.playerSkillForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Enter a skill level from 1 to 5.'
      );
      return;
    }
    if (!this.isEditing && this.selectedSkillId === null) {
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Select a skill to assign.'
      );
      return;
    }

    const value = this.playerSkillForm.getRawValue() as {
      level: string;
      observations: string;
    };
    const observations = value.observations.trim();
    const wasEditing = this.isEditing;
    let request$;

    if (wasEditing && this.editingAssignment) {
      const payload = this.buildUpdatePayload(
        Number(value.level),
        observations,
        this.editingAssignment
      );
      if (Object.keys(payload).length === 0) {
        this.feedbackHandlerService.info(
          FeedbackCase.INFO,
          'No changes to save.'
        );
        this.cancelForm();
        return;
      }
      request$ = this.playerSkillService.update(
        this.playerId,
        this.editingAssignment.skillId,
        payload
      );
    } else {
      const payload: AssignPlayerSkillDTO = {
        skillId: this.selectedSkillId!,
        level: Number(value.level),
      };
      if (observations) {
        payload.observations = observations;
      }
      request$ = this.playerSkillService.create(this.playerId, payload);
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing
            ? 'Player skill updated successfully.'
            : 'Skill assigned to player successfully.'
        );
        this.cancelForm();
        this.loadData();
      },
      error: (error: ApiError) =>
        this.feedbackHandlerService.error(
          String(error.status ?? FeedbackCase.SERVER_ERROR),
          this.getErrorMessage(error, 'Could not save the player skill.')
        ),
    });
  }

  public requestRemoval(assignment: PlayerSkill): void {
    this.pendingDeleteAssignment = assignment;
    this.confirmDeleteOpen = true;
  }

  public confirmRemoval(): void {
    if (!this.pendingDeleteAssignment) {
      return;
    }

    const assignment = this.pendingDeleteAssignment;
    this.isLoading = true;
    this.playerSkillService
      .delete(this.playerId, assignment.skillId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Skill removed from player.'
          );
          this.closeRemovalDialog();
          this.loadData();
        },
        error: (error: ApiError) => {
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, 'Could not remove the skill.')
          );
          this.closeRemovalDialog();
        },
      });
  }

  public cancelRemoval(): void {
    this.closeRemovalDialog();
  }

  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingAssignment = null;
    this.selectedSkillId = null;
    this.playerSkillForm.reset({ level: '', observations: '' });
  }

  private buildUpdatePayload(
    level: number,
    observations: string,
    original: PlayerSkill
  ): UpdatePlayerSkillDTO {
    const payload: UpdatePlayerSkillDTO = {};
    if (level !== original.level) payload.level = level;
    if (observations !== (original.observations ?? '')) {
      payload.observations = observations;
    }
    return payload;
  }

  private closeRemovalDialog(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeleteAssignment = null;
  }

  private getErrorMessage(error: ApiError, fallback: string): string {
    const message = error.error?.message;
    return Array.isArray(message) ? message.join(' ') : message ?? fallback;
  }
}
