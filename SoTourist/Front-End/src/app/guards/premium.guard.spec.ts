import { TestBed } from '@angular/core/testing';
import { PremiumGuard } from './premium.guard';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

describe('PremiumGuard', () => {
  let guard: PremiumGuard;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['getUserId', 'getUserType', 'saveSession']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        PremiumGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    guard = TestBed.inject(PremiumGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
