import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LuogoCardComponent } from './luogo-card.component';

describe('LuogoCardComponent', () => {
  let component: LuogoCardComponent;
  let fixture: ComponentFixture<LuogoCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LuogoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LuogoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
