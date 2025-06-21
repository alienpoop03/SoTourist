import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserHeroComponent } from './user-hero.component';

describe('UserHeroComponent', () => {
  let component: UserHeroComponent;
  let fixture: ComponentFixture<UserHeroComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UserHeroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserHeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
