import { TestBed } from '@angular/core/testing';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SystemConfigService, SystemConfigItem } from './system-config.service';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiUrl}/system-config`;

function makeConfigItem(key: string, value: string): SystemConfigItem {
    return { key, value, dataType: 'STRING', category: 'TEST', description: '' };
}

describe('SystemConfigService', () => {

    let service: SystemConfigService;
    let controller: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                SystemConfigService,
            ],
        });

        service = TestBed.inject(SystemConfigService);
        controller = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        controller.verify();
    });


    // ─── load ─────────────────────────────────────────────────────────────
    describe('load()', () => {

        it('should perform a GET to the system-config endpoint', () => {
            // Arrange — loaded es false por defecto

            // Act
            service.load();

            // Assert
            const req = controller.expectOne(BASE_URL);
            expect(req.request.method).toBe('GET');
            req.flush([]);
        });

        it('should set loaded to true after a successful response', () => {
            // Arrange
            service.load();

            // Act
            controller.expectOne(BASE_URL).flush([]);

            // Assert
            expect(service.loaded()).toBe(true);
        });

        it('should populate the internal configs so getters return values', () => {
            // Arrange
            const items = [makeConfigItem('MAX_GLUCOSE', '180')];
            service.load();

            // Act
            controller.expectOne(BASE_URL).flush(items);

            // Assert
            expect(service.getInt('MAX_GLUCOSE')).toBe(180);
        });

        it('should not perform a second HTTP request when already loaded', () => {
            // Arrange — primera carga
            service.load();
            controller.expectOne(BASE_URL).flush([]);

            // Act — segunda llamada con loaded = true
            service.load();

            // Assert — no debe haber peticiones pendientes
            controller.expectNone(BASE_URL);
        });

        it('should not set loaded to true when the HTTP request fails', () => {
            // Arrange
            service.load();

            // Act
            controller
                .expectOne(BASE_URL)
                .flush('Error', { status: 500, statusText: 'Server Error' });

            // Assert
            expect(service.loaded()).toBe(false);
        });
    });


    // ─── reload ───────────────────────────────────────────────────────────
    describe('reload()', () => {

        it('should POST to the reload endpoint', () => {
            // Arrange

            // Act
            service.reload();

            // Assert
            const req = controller.expectOne(`${BASE_URL}/reload`);
            expect(req.request.method).toBe('POST');
            req.flush(null);
            controller.expectOne(BASE_URL).flush([]);
        });

        it('should reset loaded to false and trigger a new GET after a successful POST', () => {
            // Arrange — cargamos primero para que loaded quede en true
            service.load();
            controller.expectOne(BASE_URL).flush([]);
            expect(service.loaded()).toBe(true);

            // Act
            service.reload();
            controller.expectOne(`${BASE_URL}/reload`).flush(null);

            // Assert — loaded vuelve a false mientras se re-carga
            expect(service.loaded()).toBe(false);

            // Completamos la segunda carga
            controller.expectOne(BASE_URL).flush([]);
            expect(service.loaded()).toBe(true);
        });

        it('should not trigger a GET when the POST fails', () => {
            // Arrange

            // Act
            service.reload();
            controller
                .expectOne(`${BASE_URL}/reload`)
                .flush('Error', { status: 500, statusText: 'Server Error' });

            // Assert — no debe haber una petición GET pendiente
            controller.expectNone(BASE_URL);
        });
    });


    // ─── getInt / getDecimal / getString  (cubren getValue privado) ───────
    describe('getInt()', () => {

        it('should return the parsed integer for a known key', () => {
            // Arrange
            service.load();
            controller.expectOne(BASE_URL).flush([makeConfigItem('LIMIT', '42')]);

            // Act
            const result = service.getInt('LIMIT');

            // Assert
            expect(result).toBe(42);
        });

        it('should return 0 when the key does not exist', () => {
            // Arrange
            service.load();
            controller.expectOne(BASE_URL).flush([]);

            // Act
            const result = service.getInt('NONEXISTENT');

            // Assert
            expect(result).toBe(0);
        });
    });

    describe('getDecimal()', () => {

        it('should return the parsed float for a known key', () => {
            // Arrange
            service.load();
            controller.expectOne(BASE_URL).flush([makeConfigItem('RATIO', '3.14')]);

            // Act
            const result = service.getDecimal('RATIO');

            // Assert
            expect(result).toBeCloseTo(3.14);
        });

        it('should return 0 when the key does not exist', () => {
            // Arrange
            service.load();
            controller.expectOne(BASE_URL).flush([]);

            // Act
            const result = service.getDecimal('NONEXISTENT');

            // Assert
            expect(result).toBe(0);
        });
    });

    describe('getString()', () => {

        it('should return the string value for a known key', () => {
            // Arrange
            service.load();
            controller.expectOne(BASE_URL).flush([makeConfigItem('UNIT', 'MG_DL')]);

            // Act
            const result = service.getString('UNIT');

            // Assert
            expect(result).toBe('MG_DL');
        });

        it('should return an empty string when the key does not exist', () => {
            // Arrange
            service.load();
            controller.expectOne(BASE_URL).flush([]);

            // Act
            const result = service.getString('NONEXISTENT');

            // Assert
            expect(result).toBe('');
        });

        // [via getValue] — clave existente y clave ausente ya están cubiertas arriba.
        // getValue() devuelve undefined para claves inexistentes; cada getter aplica
        // su propio fallback (?? '0' o ?? ''), lo cual queda verificado por los tests
        // de valor 0 y string vacío.
    });


    // ─── getGlucoseStatusColor ────────────────────────────────────────────
    describe('getGlucoseStatusColor()', () => {

        it('should return the light color for a known status in light mode', () => {
            // Arrange

            // Act
            const result = service.getGlucoseStatusColor('NORMAL', false);

            // Assert
            expect(result).toBe('#22A96A');
        });

        it('should return the dark color for a known status in dark mode', () => {
            // Arrange

            // Act
            const result = service.getGlucoseStatusColor('NORMAL', true);

            // Assert
            expect(result).toBe('#4ADE98');
        });

        it('should return the light fallback color for an unknown status in light mode', () => {
            // Arrange

            // Act
            const result = service.getGlucoseStatusColor('UNKNOWN_STATUS', false);

            // Assert
            expect(result).toBe('#546E7A');
        });

        it('should return the dark fallback color for an unknown status in dark mode', () => {
            // Arrange

            // Act
            const result = service.getGlucoseStatusColor('UNKNOWN_STATUS', true);

            // Assert
            expect(result).toBe('#9B97C0');
        });

        it('should return distinct colors for each defined glucose status in light mode', () => {
            // Arrange
            const statuses = ['CRITICALLY_LOW', 'LOW', 'NORMAL', 'HIGH', 'CRITICALLY_HIGH'];

            // Act
            const colors = statuses.map(s => service.getGlucoseStatusColor(s, false));

            // Assert — todos los colores deben ser únicos
            expect(new Set(colors).size).toBe(statuses.length);
        });
    });


    // ─── getGlucoseStatusBg ───────────────────────────────────────────────
    describe('getGlucoseStatusBg()', () => {

        it('should return the background color for a known status', () => {
            // Arrange

            // Act
            const result = service.getGlucoseStatusBg('NORMAL');

            // Assert
            expect(result).toBe('rgba(34,169,106,0.15)');
        });

        it('should return transparent for an unknown status', () => {
            // Arrange

            // Act
            const result = service.getGlucoseStatusBg('UNKNOWN_STATUS');

            // Assert
            expect(result).toBe('transparent');
        });
    });


    // ─── getAlertColor ────────────────────────────────────────────────────
    describe('getAlertColor()', () => {

        it('should return the correct color for each known severity', () => {
            // Arrange
            const cases: [string, string][] = [
                ['SUCCESS', '#22A96A'],
                ['INFO', '#0EA5A0'],
                ['WARNING', '#E8A020'],
                ['DANGER', '#E04B4B'],
            ];

            // Act & Assert
            cases.forEach(([severity, expected]) => {
                expect(service.getAlertColor(severity)).toBe(expected);
            });
        });

        it('should return the fallback color for an unknown severity', () => {
            // Arrange

            // Act
            const result = service.getAlertColor('UNKNOWN');

            // Assert
            expect(result).toBe('#546E7A');
        });
    });


    // ─── getAlertBg ───────────────────────────────────────────────────────
    describe('getAlertBg()', () => {

        it('should return the light background for a known severity in light mode', () => {
            // Arrange

            // Act
            const result = service.getAlertBg('SUCCESS', false);

            // Assert
            expect(result).toBe('#E3F7EE');
        });

        it('should return the dark background for a known severity in dark mode', () => {
            // Arrange

            // Act
            const result = service.getAlertBg('SUCCESS', true);

            // Assert
            expect(result).toBe('rgba(34,169,106,0.12)');
        });

        it('should return transparent for an unknown severity in light mode', () => {
            // Arrange

            // Act
            const result = service.getAlertBg('UNKNOWN', false);

            // Assert
            expect(result).toBe('transparent');
        });

        it('should return transparent for an unknown severity in dark mode', () => {
            // Arrange

            // Act
            const result = service.getAlertBg('UNKNOWN', true);

            // Assert
            expect(result).toBe('transparent');
        });
    });


    // ─── getSeverityIcon ──────────────────────────────────────────────────
    describe('getSeverityIcon()', () => {

        it('should return the correct icon for each known severity', () => {
            // Arrange
            const cases: [string, string][] = [
                ['SUCCESS', 'check_circle'],
                ['INFO', 'info'],
                ['WARNING', 'warning'],
                ['DANGER', 'error'],
            ];

            // Act & Assert
            cases.forEach(([severity, expected]) => {
                expect(service.getSeverityIcon(severity)).toBe(expected);
            });
        });

        it('should return the fallback icon for an unknown severity', () => {
            // Arrange

            // Act
            const result = service.getSeverityIcon('UNKNOWN');

            // Assert
            expect(result).toBe('info');
        });
    });


    // ─── getCyclePhaseColor ───────────────────────────────────────────────
    describe('getCyclePhaseColor()', () => {

        it('should return the correct color for each known phase', () => {
            // Arrange
            const cases: [string, string][] = [
                ['MENSTRUATION', '#EF5350'],
                ['FOLLICULAR', '#66BB6A'],
                ['OVULATION', '#42A5F5'],
                ['LUTEAL_EARLY', '#FFA726'],
                ['LUTEAL_LATE', '#FF7043'],
            ];

            // Act & Assert
            cases.forEach(([phase, expected]) => {
                expect(service.getCyclePhaseColor(phase)).toBe(expected);
            });
        });

        it('should return the fallback color for an unknown phase', () => {
            // Arrange

            // Act
            const result = service.getCyclePhaseColor('UNKNOWN_PHASE');

            // Assert
            expect(result).toBe('#9E9E9E');
        });
    });


    // ─── getPhaseIcon ─────────────────────────────────────────────────────
    describe('getPhaseIcon()', () => {

        it('should return the correct icon for each known phase', () => {
            // Arrange
            const cases: [string, string][] = [
                ['MENSTRUATION', 'water_drop'],
                ['FOLLICULAR', 'local_florist'],
                ['OVULATION', 'egg'],
                ['LUTEAL_EARLY', 'trending_up'],
                ['LUTEAL_LATE', 'warning'],
            ];

            // Act & Assert
            cases.forEach(([phase, expected]) => {
                expect(service.getPhaseIcon(phase)).toBe(expected);
            });
        });

        it('should return the fallback icon for an unknown phase', () => {
            // Arrange

            // Act
            const result = service.getPhaseIcon('UNKNOWN_PHASE');

            // Assert
            expect(result).toBe('circle');
        });
    });
});
