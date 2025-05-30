import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PanoramicaPage } from './panoramica.page';

describe('PanoramicaPage', () => {
  let component: PanoramicaPage;
  let fixture: ComponentFixture<PanoramicaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PanoramicaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
