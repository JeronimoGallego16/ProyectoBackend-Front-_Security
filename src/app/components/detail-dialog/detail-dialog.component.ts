import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-detail-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './detail-dialog.component.html',
  styleUrls: ['./detail-dialog.component.scss'],
})
export class DetailDialogComponent {
  @Input() public open = false;
  @Input() public title = 'Details';
  @Input() public data: any = null;
  @Input() public fields?: { key: string; label: string }[];

  @Output() public close = new EventEmitter<void>();

  public get displayFields(): { key: string; label: string; value: any }[] {
    if (!this.data) return [];
    if (this.fields && this.fields.length > 0) {
      return this.fields.map((f) => ({ key: f.key, label: f.label, value: this.data[f.key] }));
    }
    return Object.keys(this.data).map((k) => ({ key: k, label: this.formatLabel(k), value: this.data[k] }));
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  }

  public onClose(): void {
    this.close.emit();
  }
}
