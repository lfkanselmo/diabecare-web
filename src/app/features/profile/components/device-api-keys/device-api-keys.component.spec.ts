import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeviceApiKeysComponent } from './device-api-keys.component';
import { DeviceApiKeyService } from '../../services/device-api-key.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TranslocoService } from '@jsverse/transloco';
import { DeviceApiKeyResponse } from '../../../../shared/models/device-api-key.model';

function makeKey(overrides: Partial<DeviceApiKeyResponse> = {}): DeviceApiKeyResponse {
    return {
        id: 'key-1', label: 'Dexcom G6', createdAt: '2026-01-01T00:00:00',
        lastUsedAt: null, revoked: false, ...overrides
    };
}

describe('DeviceApiKeysComponent', () => {

    let serviceMock: {
        getAll: ReturnType<typeof vi.fn>;
        generate: ReturnType<typeof vi.fn>;
        revoke: ReturnType<typeof vi.fn>;
    };
    let notificationServiceMock: { success: ReturnType<typeof vi.fn>; danger: ReturnType<typeof vi.fn> };

    function createComponent() {
        serviceMock = {
            getAll: vi.fn().mockReturnValue(of([])),
            generate: vi.fn(),
            revoke: vi.fn()
        };
        notificationServiceMock = { success: vi.fn(), danger: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                { provide: DeviceApiKeyService, useValue: serviceMock },
                { provide: AuthService, useValue: { getPatientId: () => 'patient-1' } },
                { provide: NotificationService, useValue: notificationServiceMock },
                { provide: TranslocoService, useValue: { translate: (key: string) => key } }
            ]
        });

        return TestBed.createComponent(DeviceApiKeysComponent).componentInstance;
    }

    describe('ngOnInit', () => {

        it('carga las keys del paciente al iniciar', () => {
            const component = createComponent();

            component.ngOnInit();

            expect(serviceMock.getAll).toHaveBeenCalledWith('patient-1');
        });
    });

    describe('onGenerate', () => {

        it('no hace nada cuando el formulario es inválido (sin label)', () => {
            const component = createComponent();

            component.onGenerate();

            expect(serviceMock.generate).not.toHaveBeenCalled();
        });

        it('genera la key, la expone para revelarla una vez y recarga la lista', () => {
            const component = createComponent();
            const generated = { id: 'key-1', rawKey: 'dbc_rawkey123', label: 'Dexcom G6', createdAt: '2026-01-01T00:00:00' };
            serviceMock.generate.mockReturnValue(of(generated));
            component.form.setValue({ label: 'Dexcom G6' });

            component.onGenerate();

            expect(serviceMock.generate).toHaveBeenCalledWith('patient-1', 'Dexcom G6');
            expect(component.generatedKey()).toEqual(generated);
            expect(serviceMock.getAll).toHaveBeenCalledWith('patient-1');
        });

        it('notifica el error cuando la generación falla', () => {
            const component = createComponent();
            serviceMock.generate.mockReturnValue(throwError(() => new Error('fail')));
            component.form.setValue({ label: 'Dexcom G6' });

            component.onGenerate();

            expect(notificationServiceMock.danger).toHaveBeenCalled();
        });
    });

    describe('onArmRevoke / onCancelRevoke', () => {

        it('marca y luego limpia la key armada para confirmación', () => {
            const component = createComponent();

            component.onArmRevoke('key-1');
            expect(component.armedRevokeId()).toBe('key-1');

            component.onCancelRevoke();
            expect(component.armedRevokeId()).toBeNull();
        });
    });

    describe('onRevoke', () => {

        it('recarga la lista y limpia el estado armado al revocar', () => {
            const component = createComponent();
            component.onArmRevoke('key-1');
            serviceMock.getAll.mockReturnValue(of([makeKey({ revoked: true })]));
            serviceMock.revoke.mockReturnValue(of(undefined));

            component.onRevoke('key-1');

            expect(serviceMock.revoke).toHaveBeenCalledWith('patient-1', 'key-1');
            expect(component.armedRevokeId()).toBeNull();
            expect(component.keys()[0].revoked).toBe(true);
        });

        it('limpia el estado armado y notifica el error cuando la revocación falla', () => {
            const component = createComponent();
            component.onArmRevoke('key-1');
            serviceMock.revoke.mockReturnValue(throwError(() => new Error('fail')));

            component.onRevoke('key-1');

            expect(component.armedRevokeId()).toBeNull();
            expect(notificationServiceMock.danger).toHaveBeenCalled();
        });
    });

    describe('onCopyKey', () => {

        it('copia la key al portapapeles y notifica éxito', async () => {
            const component = createComponent();
            const writeText = vi.fn().mockResolvedValue(undefined);
            Object.assign(navigator, { clipboard: { writeText } });

            await component.onCopyKey('dbc_rawkey123');

            expect(writeText).toHaveBeenCalledWith('dbc_rawkey123');
            expect(notificationServiceMock.success).toHaveBeenCalled();
        });

        it('notifica el error cuando falla la copia', async () => {
            const component = createComponent();
            const writeText = vi.fn().mockRejectedValue(new Error('denied'));
            Object.assign(navigator, { clipboard: { writeText } });

            await component.onCopyKey('dbc_rawkey123');

            expect(notificationServiceMock.danger).toHaveBeenCalled();
        });
    });
});
