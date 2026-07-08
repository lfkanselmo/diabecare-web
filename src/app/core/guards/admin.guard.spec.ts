import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../auth/auth.service';

describe('adminGuard', () => {

    let authServiceMock: { isAdmin: ReturnType<typeof vi.fn> };
    let router: Router;

    beforeEach(() => {
        authServiceMock = { isAdmin: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authServiceMock }
            ]
        });

        router = TestBed.inject(Router);
    });

    it('permite el acceso cuando el usuario autenticado es ADMIN', () => {
        authServiceMock.isAdmin.mockReturnValue(true);

        const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

        expect(result).toBe(true);
    });

    it('redirige a /app/dashboard cuando el usuario no es ADMIN', () => {
        authServiceMock.isAdmin.mockReturnValue(false);

        const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe('/app/dashboard');
    });
});
