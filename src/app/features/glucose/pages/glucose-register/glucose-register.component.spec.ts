import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GlucoseRegisterComponent } from './glucose-register.component';
import { GlucoseService } from '../../services/glucose.service';
import { BleGlucoseMeterService } from '../../services/ble-glucose-meter.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MetadataService } from '@core/services/metadata.service';
import { TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { BleGlucoseMeasurement } from '../../../../shared/models/ble-glucose-measurement.model';

describe('GlucoseRegisterComponent', () => {

    let bleServiceMock: { isSupported: ReturnType<typeof vi.fn>; readLatestMeasurement: ReturnType<typeof vi.fn> };
    let notificationServiceMock: { success: ReturnType<typeof vi.fn>; danger: ReturnType<typeof vi.fn> };

    function createComponent(bluetoothSupported = true) {
        bleServiceMock = {
            isSupported: vi.fn().mockReturnValue(bluetoothSupported),
            readLatestMeasurement: vi.fn()
        };
        notificationServiceMock = { success: vi.fn(), danger: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                { provide: GlucoseService, useValue: { register: vi.fn() } },
                { provide: BleGlucoseMeterService, useValue: bleServiceMock },
                { provide: AuthService, useValue: { getPatientId: () => 'patient-1' } },
                { provide: AlertService, useValue: { getNewAlerts: () => of([]) } },
                { provide: NotificationService, useValue: notificationServiceMock },
                { provide: MetadataService, useValue: { glucoseUnits: signal([]), readingTypes: signal([]) } },
                { provide: TranslocoService, useValue: { translate: (key: string) => key } },
                { provide: Router, useValue: { navigate: vi.fn() } }
            ]
        });

        return TestBed.createComponent(GlucoseRegisterComponent).componentInstance;
    }

    function makeMeasurement(overrides: Partial<BleGlucoseMeasurement> = {}): BleGlucoseMeasurement {
        return {
            value: 120,
            unit: 'MG_DL',
            measuredAt: new Date(2026, 0, 15, 8, 30, 0),
            deviceName: 'Contour Next One',
            ...overrides
        };
    }

    describe('bluetoothSupported', () => {

        it('es true cuando el servicio BLE reporta soporte', () => {
            const component = createComponent(true);
            expect(component.bluetoothSupported).toBe(true);
        });

        it('es false cuando el servicio BLE no reporta soporte', () => {
            const component = createComponent(false);
            expect(component.bluetoothSupported).toBe(false);
        });
    });

    describe('onConnectMeter', () => {

        it('rellena el formulario con la medición obtenida del glucómetro', async () => {
            const component = createComponent();
            const measurement = makeMeasurement();
            bleServiceMock.readLatestMeasurement.mockResolvedValue(measurement);

            await component.onConnectMeter();

            expect(component.form.value.value).toBe(120);
            expect(component.form.value.unit).toBe('MG_DL');
            expect(component.form.value.deviceSource).toBe('Contour Next One');
            expect(notificationServiceMock.success).toHaveBeenCalled();
        });

        it('notifica un error cuando la conexión falla', async () => {
            const component = createComponent();
            bleServiceMock.readLatestMeasurement.mockRejectedValue(new Error('cancelado por el usuario'));

            await component.onConnectMeter();

            expect(notificationServiceMock.danger).toHaveBeenCalledWith('glucose.register.meterConnectError');
        });

        it('apaga el indicador de carga incluso cuando falla', async () => {
            const component = createComponent();
            bleServiceMock.readLatestMeasurement.mockRejectedValue(new Error('falla'));

            await component.onConnectMeter();

            expect(component.connectingMeter()).toBe(false);
        });
    });
});
