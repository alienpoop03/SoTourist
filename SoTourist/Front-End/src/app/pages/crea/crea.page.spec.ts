import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreaPage } from './crea.page';

describe('CreaPage', () => {
  let component: CreaPage;
  let fixture: ComponentFixture<CreaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
