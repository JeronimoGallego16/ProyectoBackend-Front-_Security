import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectableTableComponent } from './selectable-table.component';

describe('SelectableTableComponent', () => {
  let component: SelectableTableComponent;
  let fixture: ComponentFixture<SelectableTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectableTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectableTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select and clear matrix cells', () => {
    component.matrixRows = [{ entity: 'users' }];
    component.matrixColumns = [{ id: 1 }];
    component.toggleMatrixCell(component.matrixRows[0], component.matrixColumns[0], true);
    expect(component.isMatrixCellSelected(component.matrixRows[0], component.matrixColumns[0])).toBeTrue();

    component.clearSelection();
    expect(component.isMatrixCellSelected(component.matrixRows[0], component.matrixColumns[0])).toBeFalse();
  });
});
