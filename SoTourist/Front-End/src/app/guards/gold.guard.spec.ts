import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { goldGuard } from './gold.guard';

describe('goldGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => goldGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
