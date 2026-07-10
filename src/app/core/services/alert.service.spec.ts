import { TestBed } from '@angular/core/testing';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AlertService } from './alert.service';
import { AlertResponse } from '../../shared/models/alert.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiUrl}/alerts`;

/**
 * Crea un AlertResponse con valores por defecto sobreescribibles.
 * Usar factories evita literals duplicados y hace los tests más legibles.
 */
function makeAlert(overrides: Partial<AlertResponse> = {}): AlertResponse {
    return {
        type: 'GLUCOSE_OUT_OF_RANGE',
        severity: 'WARNING',
        title: 'Glucosa fuera de rango',
        message: 'Tu lectura supera el límite superior.',
        ...overrides,
    };
}


describe('AlertService', () => {

    let service: AlertService;
    let controller: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                AlertService,
            ],
        });

        service = TestBed.inject(AlertService);
        controller = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        // Falla el test si quedó alguna petición HTTP sin resolver
        controller.verify();
    });


    describe('getAlerts()', () => {

        it('should perform a GET to the correct URL for the given patientId', () => {
            const patientId = 'patient-001';

            service.getAlerts(patientId).subscribe();

            const req = controller.expectOne(`${BASE_URL}/${patientId}`);
            expect(req.request.method).toBe('GET');
            req.flush([]);
        });

        it('should return the array of alerts emitted by the API', () => {
            const patientId = 'patient-001';
            const mockAlerts = [makeAlert(), makeAlert({ type: 'NO_GLUCOSE_RECORDED', severity: 'INFO' })];
            let actual: AlertResponse[] = [];

            service.getAlerts(patientId).subscribe(alerts => (actual = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush(mockAlerts);

            expect(actual).toEqual(mockAlerts);
        });

        it('should return an empty array when the API responds with no alerts', () => {
            const patientId = 'patient-002';
            let actual: AlertResponse[] = [makeAlert()]; // valor inicial no vacío

            service.getAlerts(patientId).subscribe(alerts => (actual = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([]);

            expect(actual).toEqual([]);
        });
    });


    describe('primeKnownAlerts()', () => {

        it('should mark all provided alerts as known so getNewAlerts returns none of them', () => {
            const patientId = 'patient-001';
            const alertA = makeAlert({ title: 'A', message: 'msg-A' });
            const alertB = makeAlert({ title: 'B', message: 'msg-B' });
            let newAlerts: AlertResponse[] = [];

            // Act — primamos las alertas, luego la API devuelve exactamente las mismas
            service.primeKnownAlerts([alertA, alertB]);
            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([alertA, alertB]);

            // Assert — no deben aparecer como nuevas
            expect(newAlerts).toEqual([]);
        });

        it('should replace any previously primed alerts with the new set', () => {
            const patientId = 'patient-001';
            const alertOld = makeAlert({ title: 'Old', message: 'old-msg' });
            const alertNew = makeAlert({ title: 'New', message: 'new-msg' });
            let newAlerts: AlertResponse[] = [];

            // Act — primamos alertOld, luego reemplazamos con alertNew
            service.primeKnownAlerts([alertOld]);
            service.primeKnownAlerts([alertNew]);

            // La API devuelve alertOld: ya no está en el set → debe aparecer como nueva
            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([alertOld]);

            expect(newAlerts).toEqual([alertOld]);
        });

        it('should handle being called with an empty array without errors', () => {
            const patientId = 'patient-001';
            const alert = makeAlert({ title: 'X', message: 'msg-X' });
            let newAlerts: AlertResponse[] = [];

            // Act — primamos vacío, la API devuelve una alerta
            service.primeKnownAlerts([]);
            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([alert]);

            // Assert — sin firmas conocidas, la alerta debe aparecer como nueva
            expect(newAlerts).toEqual([alert]);
        });

        // signatureOf() es privado; se cubre indirectamente vía la deduplicación de
        // primeKnownAlerts, que combina título Y mensaje.

        it('[via signatureOf] should treat alerts with same title but different message as distinct', () => {
            const patientId = 'patient-001';
            const knownAlert = makeAlert({ title: 'Título', message: 'Mensaje conocido' });
            const newAlert = makeAlert({ title: 'Título', message: 'Mensaje diferente' });
            let newAlerts: AlertResponse[] = [];

            service.primeKnownAlerts([knownAlert]);
            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([knownAlert, newAlert]);

            // Assert — solo newAlert debe aparecer
            expect(newAlerts).toEqual([newAlert]);
        });

        it('[via signatureOf] should treat alerts with same message but different title as distinct', () => {
            const patientId = 'patient-001';
            const knownAlert = makeAlert({ title: 'Título conocido', message: 'Mensaje' });
            const newAlert = makeAlert({ title: 'Título diferente', message: 'Mensaje' });
            let newAlerts: AlertResponse[] = [];

            service.primeKnownAlerts([knownAlert]);
            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([knownAlert, newAlert]);

            // Assert — solo newAlert debe aparecer
            expect(newAlerts).toEqual([newAlert]);
        });
    });


    describe('getNewAlerts()', () => {

        it('should return all alerts when no previous alerts are known', () => {
            // Arrange — sin primeKnownAlerts previo, el set interno está vacío
            const patientId = 'patient-001';
            const alertA = makeAlert({ title: 'A', message: 'msg-A' });
            const alertB = makeAlert({ title: 'B', message: 'msg-B' });
            let newAlerts: AlertResponse[] = [];

            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([alertA, alertB]);

            expect(newAlerts).toEqual([alertA, alertB]);
        });

        it('should return only the alerts not present in the last known set', () => {
            const patientId = 'patient-001';
            const knownAlert = makeAlert({ title: 'Conocida', message: 'msg-k' });
            const freshAlert = makeAlert({ title: 'Nueva', message: 'msg-n' });
            let newAlerts: AlertResponse[] = [];

            service.primeKnownAlerts([knownAlert]);

            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([knownAlert, freshAlert]);

            // Assert — solo freshAlert es nueva
            expect(newAlerts).toEqual([freshAlert]);
        });

        it('should return an empty array when all returned alerts were already known', () => {
            const patientId = 'patient-001';
            const alertA = makeAlert({ title: 'A', message: 'msg-A' });
            const alertB = makeAlert({ title: 'B', message: 'msg-B' });
            let newAlerts: AlertResponse[] = [alertA]; // valor inicial no vacío

            service.primeKnownAlerts([alertA, alertB]);

            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([alertA, alertB]);

            expect(newAlerts).toEqual([]);
        });

        it('should update the known signatures set after each call', () => {
            // Arrange — primera llamada trae alertA (nueva), segunda debe verla como conocida
            const patientId = 'patient-001';
            const alertA = makeAlert({ title: 'A', message: 'msg-A' });
            let secondCallResult: AlertResponse[] = [];

            // Act — primera llamada
            service.getNewAlerts(patientId).subscribe();
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([alertA]);

            // Act — segunda llamada con la misma alerta
            service.getNewAlerts(patientId).subscribe(alerts => (secondCallResult = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([alertA]);

            // Assert — alertA ya fue vista, no debe aparecer como nueva
            expect(secondCallResult).toEqual([]);
        });

        it('should perform a GET to the correct URL for the given patientId', () => {
            const patientId = 'patient-XYZ';

            service.getNewAlerts(patientId).subscribe();

            const req = controller.expectOne(`${BASE_URL}/${patientId}`);
            expect(req.request.method).toBe('GET');
            req.flush([]);
        });

        it('should propagate HTTP errors to the subscriber', () => {
            const patientId = 'patient-001';
            let caughtError: unknown;

            service.getNewAlerts(patientId).subscribe({
                error: err => (caughtError = err),
            });
            controller
                .expectOne(`${BASE_URL}/${patientId}`)
                .flush('Internal Server Error', { status: 500, statusText: 'Server Error' });

            expect(caughtError).toBeTruthy();
        });

        it('should not emit any known alerts even when the API returns a larger batch', () => {
            // Arrange — primamos 1, la API devuelve 3 (1 conocida + 2 nuevas)
            const patientId = 'patient-001';
            const known = makeAlert({ title: 'K', message: 'k-msg' });
            const newOne = makeAlert({ title: 'N1', message: 'n1-msg' });
            const newTwo = makeAlert({ title: 'N2', message: 'n2-msg' });
            let newAlerts: AlertResponse[] = [];

            service.primeKnownAlerts([known]);

            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([known, newOne, newTwo]);

            expect(newAlerts).toEqual([newOne, newTwo]);
        });

        it('should return an empty array when the API responds with no alerts', () => {
            const patientId = 'patient-001';
            let newAlerts: AlertResponse[] = [makeAlert()]; // valor inicial no vacío

            service.getNewAlerts(patientId).subscribe(alerts => (newAlerts = alerts));
            controller.expectOne(`${BASE_URL}/${patientId}`).flush([]);

            expect(newAlerts).toEqual([]);
        });
    });
});
