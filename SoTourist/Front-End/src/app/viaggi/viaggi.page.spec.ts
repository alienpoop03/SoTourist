import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViaggiPage } from './viaggi.page';

describe('ViaggiPage', () => {
  let component: ViaggiPage;
  let fixture: ComponentFixture<ViaggiPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViaggiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
