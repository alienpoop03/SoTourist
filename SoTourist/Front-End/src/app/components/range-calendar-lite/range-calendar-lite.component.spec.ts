import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RangeCalendarLiteComponent } from './range-calendar-lite.component';

describe('RangeCalendarLiteComponent', () => {
  let component: RangeCalendarLiteComponent;
  let fixture: ComponentFixture<RangeCalendarLiteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RangeCalendarLiteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RangeCalendarLiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
