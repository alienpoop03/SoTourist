import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CustomSidebarComponent } from './custom-sidebar.component';

describe('CustomSidebarComponent', () => {
  let component: CustomSidebarComponent;
  let fixture: ComponentFixture<CustomSidebarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CustomSidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
