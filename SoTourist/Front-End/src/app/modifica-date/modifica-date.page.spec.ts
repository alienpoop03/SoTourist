import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModificaDatePage } from './modifica-date.page';

describe('ModificaDatePage', () => {
  let component: ModificaDatePage;
  let fixture: ComponentFixture<ModificaDatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificaDatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
