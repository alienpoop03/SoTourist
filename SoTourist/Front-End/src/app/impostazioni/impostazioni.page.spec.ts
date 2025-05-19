import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImpostazioniPage } from './impostazioni.page';

describe('ImpostazioniPage', () => {
  let component: ImpostazioniPage;
  let fixture: ComponentFixture<ImpostazioniPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpostazioniPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
