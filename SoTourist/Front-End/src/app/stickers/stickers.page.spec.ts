import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StickersPage } from './stickers.page';

describe('StickersPage', () => {
  let component: StickersPage;
  let fixture: ComponentFixture<StickersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StickersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
