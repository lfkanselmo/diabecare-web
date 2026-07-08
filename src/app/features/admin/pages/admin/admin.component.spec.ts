import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminComponent } from './admin.component';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SystemConfigService } from '../../../../core/services/system-config.service';
import { TranslocoService } from '@jsverse/transloco';
import { AdminUserResponse } from '../../models/admin-user.model';

function makeUser(overrides: Partial<AdminUserResponse> = {}): AdminUserResponse {
    return {
        id: 'user-1', email: 'ana@example.com', role: 'PATIENT', enabled: true,
        suspendedAt: null, deletedAt: null, createdAt: '2026-07-01T00:00:00', ...overrides
    };
}

describe('AdminComponent', () => {

    let adminServiceMock: { getUsers: ReturnType<typeof vi.fn>; changeUserRole: ReturnType<typeof vi.fn> };
    let notificationServiceMock: { success: ReturnType<typeof vi.fn>; danger: ReturnType<typeof vi.fn> };

    function createComponent() {
        adminServiceMock = {
            getUsers: vi.fn().mockReturnValue(of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })),
            changeUserRole: vi.fn()
        };
        notificationServiceMock = { success: vi.fn(), danger: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                { provide: AdminService, useValue: adminServiceMock },
                { provide: AuthService, useValue: { getUserId: () => 'current-admin-id' } },
                { provide: NotificationService, useValue: notificationServiceMock },
                { provide: TranslocoService, useValue: { translate: (key: string) => key } },
                { provide: SystemConfigService, useValue: { configs: () => [], load: vi.fn(), reload: vi.fn() } }
            ]
        });

        const fixture = TestBed.createComponent(AdminComponent);
        return fixture.componentInstance;
    }

    describe('ngOnInit', () => {

        it('carga la primera página de usuarios al iniciar', () => {
            const component = createComponent();

            component.ngOnInit();

            expect(adminServiceMock.getUsers).toHaveBeenCalledWith(0, 20);
        });
    });

    describe('onPageChange', () => {

        it('actualiza el índice y tamaño de página, y recarga los usuarios', () => {
            const component = createComponent();

            component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100 });

            expect(component.pageIndex()).toBe(2);
            expect(component.pageSize()).toBe(50);
            expect(adminServiceMock.getUsers).toHaveBeenCalledWith(2, 50);
        });
    });

    describe('onArmRoleChange / onCancelRoleChange', () => {

        it('marca el usuario armado para confirmación', () => {
            const component = createComponent();

            component.onArmRoleChange('user-1');

            expect(component.armedRoleChangeUserId()).toBe('user-1');
        });

        it('limpia el usuario armado al cancelar', () => {
            const component = createComponent();
            component.onArmRoleChange('user-1');

            component.onCancelRoleChange();

            expect(component.armedRoleChangeUserId()).toBeNull();
        });
    });

    describe('onConfirmRoleChange', () => {

        it('promueve a ADMIN a un usuario PATIENT', () => {
            const component = createComponent();
            adminServiceMock.changeUserRole.mockReturnValue(of(undefined));

            component.onConfirmRoleChange(makeUser({ role: 'PATIENT' }));

            expect(adminServiceMock.changeUserRole).toHaveBeenCalledWith('user-1', 'ADMIN');
        });

        it('degrada a PATIENT a un usuario ADMIN', () => {
            const component = createComponent();
            adminServiceMock.changeUserRole.mockReturnValue(of(undefined));

            component.onConfirmRoleChange(makeUser({ role: 'ADMIN' }));

            expect(adminServiceMock.changeUserRole).toHaveBeenCalledWith('user-1', 'PATIENT');
        });

        it('limpia el estado armado y recarga los usuarios cuando el cambio es exitoso', () => {
            const component = createComponent();
            adminServiceMock.changeUserRole.mockReturnValue(of(undefined));
            component.onArmRoleChange('user-1');

            component.onConfirmRoleChange(makeUser());

            expect(component.armedRoleChangeUserId()).toBeNull();
            expect(notificationServiceMock.success).toHaveBeenCalled();
            expect(adminServiceMock.getUsers).toHaveBeenCalled();
        });

        it('limpia el estado armado y notifica el error cuando el cambio falla', () => {
            const component = createComponent();
            adminServiceMock.changeUserRole.mockReturnValue(throwError(() => new Error('fail')));
            component.onArmRoleChange('user-1');

            component.onConfirmRoleChange(makeUser());

            expect(component.armedRoleChangeUserId()).toBeNull();
            expect(notificationServiceMock.danger).toHaveBeenCalled();
        });
    });
});
