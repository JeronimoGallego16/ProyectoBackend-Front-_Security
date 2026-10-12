import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';

export interface TableColumn {
  field: string;
  header: string;
  type?: 'text' | 'image';
}

/**
 * Interface that defines an optional custom action button for the generic data table.
 */
export interface TableAction {
  label: string; // Text or tooltip to display for the action button.
  icon: string; // Material icon name to display in the action button.
  color?: 'primary' | 'accent' | 'warn'; // Custom CSS color for the button (optional).
  /**
   * Function that determines whether the action should be visible for a given row.
   * If not provided, the action is always visible.
   *
   * @param row - The data row to evaluate.
   * @returns True if the action should be visible, false otherwise.
   */
  visible?: (row: any) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './table-list.component.html',
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() customAction = new EventEmitter<{ action: string; row: any }>();
}
