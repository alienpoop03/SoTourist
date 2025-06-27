import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvanzatePage } from './avanzate.page';

describe('AvanzatePage', () => {
  let component: AvanzatePage;
  let fixture: ComponentFixture<AvanzatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AvanzatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
