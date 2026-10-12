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

  it('should select and clear all rows', () => {
    component.data = [{ id: 1 }, { id: 2 }];
    component.toggleAll(true);
    expect(component.getSelectedItems().length).toBe(2);

    component.clearSelection();
    expect(component.getSelectedItems().length).toBe(0);
  });
});
