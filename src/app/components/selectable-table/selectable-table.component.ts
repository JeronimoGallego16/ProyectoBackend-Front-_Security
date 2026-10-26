import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';

/**
 * Reusable presentational matrix that renders selectable permissions as columns
 * and entities/resources as rows.
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
   * List of permissions represented as matrix columns.
   */
  @Input() public matrixColumns: any[] = [];

  /**
   * List of entities/resources represented as matrix rows.
   */
  @Input() public matrixRows: any[] = [];

  /**
   * Property name used to identify a matrix column.
   */
  @Input() public matrixColumnIdField = 'id';

  /**
   * Property name used to identify a matrix row.
   */
  @Input() public matrixRowIdField = 'entity';

  /**
   * Stores selected matrix cells as "rowKey|columnKey".
   */
  private readonly selectedMatrixCells = new Set<string>();

  /**
   * Preselected matrix cells in matrix mode.
   */
  @Input()
  public set initialSelectedMatrixCells(cells: ReadonlyArray<string> | null) {
    this.selectedMatrixCells.clear();
    (cells ?? []).forEach((cell) => this.selectedMatrixCells.add(cell));
  }

  /**
   * Emits matrix selection changes as selected permission objects.
   */
  @Output() public matrixSelectionChange = new EventEmitter<any[]>();

  /**
   * Clears the current selection and notifies the parent component.
   */
  public clearSelection(): void {
    this.selectedMatrixCells.clear();
    this.matrixSelectionChange.emit([]);
  }

  /**
   * Builds matrix cell key.
   */
  public getMatrixCellKey(row: any, column: any): string {
    const rowKey = row[this.matrixRowIdField];
    const columnKey = column[this.matrixColumnIdField];
    return `${rowKey}|${columnKey}`;
  }

  /**
   * Checks if matrix cell is selected.
   */
  public isMatrixCellSelected(row: any, column: any): boolean {
    return this.selectedMatrixCells.has(this.getMatrixCellKey(row, column));
  }

  /**
   * Toggles matrix cell selection.
   */
  public toggleMatrixCell(row: any, column: any, checked: boolean): void {
    const key = this.getMatrixCellKey(row, column);
    if (checked) {
      this.selectedMatrixCells.add(key);
    } else {
      this.selectedMatrixCells.delete(key);
    }
    this.emitMatrixSelection();
  }

  /**
   * Emits matrix selection.
   */
  private emitMatrixSelection(): void {
    const selected: any[] = [];
    this.selectedMatrixCells.forEach((key) => {
      const [rowKey, columnKey] = key.split('|');
      const row = this.matrixRows.find((r) => String(r[this.matrixRowIdField]) === rowKey);
      const column = this.matrixColumns.find((c) => String(c[this.matrixColumnIdField]) === columnKey);
      if (row && column) {
        selected.push({ row, column, permission: column });
      }
    });
    this.matrixSelectionChange.emit(selected);
  }
}
