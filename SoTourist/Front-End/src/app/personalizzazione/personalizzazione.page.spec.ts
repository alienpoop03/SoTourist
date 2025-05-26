import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonalizzazionePage } from './personalizzazione.page';

describe('PersonalizzazionePage', () => {
  let component: PersonalizzazionePage;
  let fixture: ComponentFixture<PersonalizzazionePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalizzazionePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
