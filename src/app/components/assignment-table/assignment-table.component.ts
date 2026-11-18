import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';

/**
 * Describes a visible column in the assignment table.
 */
export interface AssignmentTableColumn {
  /** Header text displayed above the column. */
  header: string;
  /** Whether values in this column use emphasized text. */
  emphasized?: boolean;
}

/**
 * Describes a row and its optional selection and action controls.
 */
export interface AssignmentTableRow {
  /** Stable identifier returned with selection and action events. */
  id: number | string;
  /** Cell values aligned with the configured data columns. */
  values: ReadonlyArray<string | number>;
  /** Text shown in the status column when the row is not selectable. */
  status: string;
  /** Whether the row can be selected. */
  selectable?: boolean;
  /** Whether the row's selection checkbox is checked. */
  selected?: boolean;
  /** Label for the row action button. */
  actionLabel?: string;
  /** Material icon displayed in the row action button. */
  actionIcon?: string;
  /** Helper text shown when the row has no action button. */
  actionHint?: string;
  /** Whether the row should be rendered with reduced opacity. */
  muted?: boolean;
}

/**
 * Displays assignment rows with optional selection and row actions.
 */
@Component({
  selector: 'app-assignment-table',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './assignment-table.component.html',
})
export class AssignmentTableComponent {
  /** Data columns displayed before the status and action columns. */
  @Input() public columns: ReadonlyArray<AssignmentTableColumn> = [];

  /** Rows to display in the table. */
  @Input() public rows: ReadonlyArray<AssignmentTableRow> = [];

  /** Disables all interactive controls while the parent is saving. */
  @Input() public disabled = false;

  /** Emits the identifier of a row whose selection changed. */
  @Output() public selectionChange = new EventEmitter<number | string>();

  /** Emits the identifier of a row whose action was activated. */
  @Output() public action = new EventEmitter<number | string>();
}
