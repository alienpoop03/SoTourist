import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoricoViaggiPage } from './storico-viaggi.page';

describe('StoricoViaggiPage', () => {
  let component: StoricoViaggiPage;
  let fixture: ComponentFixture<StoricoViaggiPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StoricoViaggiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
