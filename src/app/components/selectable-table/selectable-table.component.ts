import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { TableColumn } from '../table-list/table-list.component';

/**
 * Reusable presentational table that renders a dynamic set of columns and
 * allows the user to select multiple rows through checkboxes. Instead of the
 * row action buttons used by the generic data table, this component exposes a
 * selection model through the {@link SelectableTableComponent.selectionChange}
 * event so the parent page can react to the chosen items.
 */
@Component({
  selector: 'app-selectable-table',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './selectable-table.component.html',
  styleUrls: ['./selectable-table.component.scss'],
})
export class SelectableTableComponent {
  /**
   * Collection of rows to render in the table body.
   */
  @Input() public data: any[] = [];

  /**
   * Column definitions describing which fields to display and their headers.
   */
  @Input() public columns: TableColumn[] = [];

  /**
   * Name of the property used to uniquely identify each row. Used to track the
   * selection independently of the object reference.
   */
  @Input() public idField = 'id';

  /**
   * Identifiers that must be marked as selected when the table is rendered.
   * Assign a new array reference to force the selection to be recomputed.
   *
   * @param ids - Collection of row identifiers to preselect.
   */
  @Input()
  public set initialSelectedIds(ids: ReadonlyArray<unknown> | null) {
    this.selectedIds.clear();
    (ids ?? []).forEach((id) => this.selectedIds.add(id));
  }

  /**
   * Emits the full list of selected rows every time the selection changes.
   */
  @Output() public selectionChange = new EventEmitter<any[]>();

  /**
   * Identifiers of the currently selected rows.
   */
  private readonly selectedIds = new Set<unknown>();

  /**
   * Indicates whether the given row is part of the current selection.
   *
   * @param item - Row to evaluate.
   * @returns `true` when the row is selected, otherwise `false`.
   */
  public isSelected(item: any): boolean {
    return this.selectedIds.has(item[this.idField]);
  }

  /**
   * Indicates whether every row in the table is currently selected.
   *
   * @returns `true` when all rows are selected and there is at least one row.
   */
  public isAllSelected(): boolean {
    return this.data.length > 0 && this.selectedIds.size === this.data.length;
  }

  /**
   * Indicates whether only a subset of the rows is selected.
   *
   * @returns `true` when at least one but not all rows are selected.
   */
  public isSomeSelected(): boolean {
    return this.selectedIds.size > 0 && !this.isAllSelected();
  }

  /**
   * Toggles the selection state of a single row.
   *
   * @param item - Row whose checkbox was toggled.
   * @param checked - New checked state reported by the checkbox.
   */
  public toggleRow(item: any, checked: boolean): void {
    const id = item[this.idField];

    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }

    this.emitSelection();
  }

  /**
   * Toggles the selection state of every row at once.
   *
   * @param checked - When `true` selects all rows, otherwise clears the selection.
   */
  public toggleAll(checked: boolean): void {
    this.selectedIds.clear();

    if (checked) {
      this.data.forEach((item) => this.selectedIds.add(item[this.idField]));
    }

    this.emitSelection();
  }

  /**
   * Returns the rows that are currently selected.
   *
   * @returns Array containing the selected rows.
   */
  public getSelectedItems(): any[] {
    return this.data.filter((item) => this.selectedIds.has(item[this.idField]));
  }

  /**
   * Clears the current selection and notifies the parent component.
   */
  public clearSelection(): void {
    this.selectedIds.clear();
    this.emitSelection();
  }

  /**
   * Emits the current selection to the parent component.
   */
  private emitSelection(): void {
    this.selectionChange.emit(this.getSelectedItems());
  }
}
