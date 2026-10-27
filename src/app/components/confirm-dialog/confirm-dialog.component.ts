import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';

/**
 * Reusable confirmation dialog (no browser popups).
 *
 * Single responsibility: present a modal confirmation message and notify the
 * host about the user's decision.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  @Input() public open = false;
  @Input() public isLoading = false;
  @Input() public title = 'Confirm action';
  @Input() public message = 'Are you sure?';
  @Output() public confirm = new EventEmitter<void>();
  @Output() public cancel = new EventEmitter<void>();
}
