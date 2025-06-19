import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { noGuestGuard } from './no-guest.guard';

describe('noGuestGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => noGuestGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
