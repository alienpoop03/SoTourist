import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GoogleAutocompleteComponent } from './google-autocomplete.component';

describe('GoogleAutocompleteComponent', () => {
  let component: GoogleAutocompleteComponent;
  let fixture: ComponentFixture<GoogleAutocompleteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GoogleAutocompleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GoogleAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
