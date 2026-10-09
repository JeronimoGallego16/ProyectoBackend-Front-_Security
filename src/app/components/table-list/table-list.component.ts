import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';

export interface TableColumn {
  field: string;
  header: string;
  type?: 'text' | 'image';
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
  @Output() view   = new EventEmitter<any>();
  @Output() edit   = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
}
