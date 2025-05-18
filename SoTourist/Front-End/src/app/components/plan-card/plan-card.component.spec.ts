import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlanCardComponent } from './plan-card.component';

describe('PlanCardComponent', () => {
  let component: PlanCardComponent;
  let fixture: ComponentFixture<PlanCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PlanCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
