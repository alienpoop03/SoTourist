import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GenerationOverlayComponent } from './generation-overlay.component';

describe('GenerationOverlayComponent', () => {
  let component: GenerationOverlayComponent;
  let fixture: ComponentFixture<GenerationOverlayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GenerationOverlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerationOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
