import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableComponent } from './table-list.component';

describe('DataTableComponent', () => {
  let component: DataTableComponent;
  let fixture: ComponentFixture<DataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides row actions when their visibility predicate rejects the row', () => {
    component.data = [{ voided: true }];
    component.editActionVisible = (row) => !('voided' in row && row.voided);
    component.deleteActionVisible = component.editActionVisible;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);
  });
});
