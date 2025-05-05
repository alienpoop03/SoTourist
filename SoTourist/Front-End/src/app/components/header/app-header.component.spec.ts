import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CustomHeaderComponent } from './custom-header.component';

describe('CustomHeaderComponent', () => {
  let component: CustomHeaderComponent;
  let fixture: ComponentFixture<CustomHeaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CustomHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
