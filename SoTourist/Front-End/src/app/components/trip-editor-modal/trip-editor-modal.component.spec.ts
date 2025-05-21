import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TripEditorModalComponent } from './trip-editor-modal.component';

describe('TripEditorModalComponent', () => {
  let component: TripEditorModalComponent;
  let fixture: ComponentFixture<TripEditorModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TripEditorModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TripEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
