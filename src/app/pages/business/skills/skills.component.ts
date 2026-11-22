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
import { CreateSkillDTO, UpdateSkillDTO } from 'src/app/models/dtos/business/skill-request.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { Skill } from 'src/app/models/business/skill.model';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { SkillService } from 'src/app/services/business/skill.service';

interface ApiError {
  status?: number;
  error?: { message?: string | string[] };
}

@Component({
  selector: 'app-skills',
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
  templateUrl: './skills.component.html',
})
export class SkillsComponent implements OnInit {
  public readonly columns: TableColumn[] = [
    { field: 'skillId', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'description', header: 'Description' },
  ];

  public readonly fields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Skill name',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Skill description (optional)',
    },
  ];

  public readonly detailFields = [
    { key: 'skillId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
  ];

  public skills: Skill[] = [];
  public skillForm: FormGroup;
  public showForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  public pendingDeleteSkill: Skill | null = null;
  public detailOpen = false;
  public selectedSkill: Skill | null = null;
  private editingSkillId: number | null = null;
  private originalSkill: Skill | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly skillService: SkillService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.skillForm = this.formBuilder.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(100),
        ],
      ],
      description: ['', Validators.maxLength(255)],
    });
  }

  public ngOnInit(): void {
    this.loadSkills();
  }

  public loadSkills(): void {
    this.isLoading = true;
    this.skillService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (skills) => (this.skills = skills),
        error: (error: ApiError) =>
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, 'Could not load skills.')
          ),
      });
  }

  public onCreateClick(): void {
    this.isEditing = false;
    this.editingSkillId = null;
    this.originalSkill = null;
    this.skillForm.reset({ name: '', description: '' });
    this.showForm = true;
  }

  public onEdit(skill: Skill): void {
    this.isEditing = true;
    this.editingSkillId = skill.skillId;
    this.originalSkill = skill;
    this.skillForm.reset({
      name: skill.name,
      description: skill.description ?? '',
    });
    this.showForm = true;
  }

  public onView(skill: Skill): void {
    this.selectedSkill = skill;
    this.detailOpen = true;
  }

  public onCloseDetail(): void {
    this.detailOpen = false;
    this.selectedSkill = null;
  }

  public onDelete(skill: Skill): void {
    this.pendingDeleteSkill = skill;
    this.confirmDeleteOpen = true;
  }

  public onConfirmDelete(): void {
    if (!this.pendingDeleteSkill) {
      return;
    }

    const skill = this.pendingDeleteSkill;
    this.isLoading = true;
    this.skillService
      .delete(skill.skillId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'Skill deleted successfully.'
          );
          this.closeDeleteDialog();
          this.loadSkills();
        },
        error: (error: ApiError) => {
          this.feedbackHandlerService.error(
            String(error.status ?? FeedbackCase.SERVER_ERROR),
            this.getErrorMessage(error, 'Could not delete the skill.')
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
    if (this.skillForm.invalid) {
      this.skillForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Please enter a valid skill name.'
      );
      return;
    }

    const value = this.skillForm.getRawValue() as {
      name: string;
      description: string;
    };
    const wasEditing = this.isEditing;
    let request$;

    if (wasEditing && this.editingSkillId !== null) {
      const payload = this.buildUpdatePayload(value);
      if (Object.keys(payload).length === 0) {
        this.feedbackHandlerService.info(
          FeedbackCase.INFO,
          'No changes to save.'
        );
        this.cancelForm();
        return;
      }
      request$ = this.skillService.update(this.editingSkillId, payload);
    } else {
      request$ = this.skillService.create(this.buildCreatePayload(value));
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing
            ? 'Skill updated successfully.'
            : 'Skill created successfully.'
        );
        this.cancelForm();
        this.loadSkills();
      },
      error: (error: ApiError) =>
        this.feedbackHandlerService.error(
          String(error.status ?? FeedbackCase.SERVER_ERROR),
          this.getErrorMessage(error, 'Could not save the skill.')
        ),
    });
  }

  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingSkillId = null;
    this.originalSkill = null;
    this.skillForm.reset({ name: '', description: '' });
  }

  private buildCreatePayload(value: {
    name: string;
    description: string;
  }): CreateSkillDTO {
    const payload: CreateSkillDTO = { name: value.name.trim() };
    const description = value.description.trim();
    if (description) {
      payload.description = description;
    }
    return payload;
  }

  private buildUpdatePayload(value: {
    name: string;
    description: string;
  }): UpdateSkillDTO {
    const payload: UpdateSkillDTO = {};
    const description = value.description.trim();
    const originalDescription = this.originalSkill?.description ?? '';

    if (this.originalSkill && value.name.trim() !== this.originalSkill.name) {
      payload.name = value.name.trim();
    }
    if (this.originalSkill && description !== originalDescription) {
      payload.description = description;
    }
    return payload;
  }

  private closeDeleteDialog(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeleteSkill = null;
  }

  private getErrorMessage(error: ApiError, fallback: string): string {
    const message = error.error?.message;
    return Array.isArray(message) ? message.join(' ') : message ?? fallback;
  }
}
