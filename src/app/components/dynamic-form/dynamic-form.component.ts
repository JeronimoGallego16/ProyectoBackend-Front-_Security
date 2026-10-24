import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { provideNativeDateAdapter } from '@angular/material/core';

/**
 * Supported visual controls rendered by the generic form component.
 */
export type FormFieldType = 'text' | 'textarea' | 'date';

/**
 * Configuration for one field rendered by the generic form component.
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
}

/**
 * Reusable form renderer for security microservice CRUD pages.
 *
 * The parent owns the form group, validators, DTO mapping, and service calls.
 * This component only renders the configured controls and emits user actions.
 */
@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './dynamic-form.component.html',
})
export class DynamicFormComponent {
  @Input({ required: true }) public form!: FormGroup; // Form group created and validated by the parent page.
  @Input() public fields: FormFieldConfig[] = []; // Fields that determine the controls rendered by the component.
  @Input() public isEditing = false; // Indicates whether the parent is editing an existing entity.
  @Input() public isLoading = false; // Disables actions while the parent is processing a request.
  @Output() public submitted = new EventEmitter<Record<string, unknown>>(); // Emits the current form values when the user submits the form.
  @Output() public cancelled = new EventEmitter<void>(); // Emits when the user requests to close or reset the form.

  public submit(): void {
    this.submitted.emit(this.form.getRawValue() as Record<string, unknown>);
  }
}
