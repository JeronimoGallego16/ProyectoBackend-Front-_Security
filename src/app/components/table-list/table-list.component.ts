import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
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
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() pageSize = 10;
  @Input() deleteDisabled = false;
  @Input() actions: TableAction[] = [];
  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() customAction = new EventEmitter<{ action: string; row: any }>();

  public pageIndex = 0;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageSize']) {
      this.pageIndex = Math.min(this.pageIndex, this.getLastPageIndex());
    }
  }

  public get pagedData(): any[] {
    const start = this.pageIndex * this.pageSize;
    return this.data.slice(start, start + this.pageSize);
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
  }

  private getLastPageIndex(): number {
    return Math.max(0, Math.ceil(this.data.length / this.pageSize) - 1);
  }
}
