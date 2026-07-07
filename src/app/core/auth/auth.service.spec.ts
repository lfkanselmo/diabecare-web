/**
 * @file auth.service.spec.ts
 * @description Pruebas unitarias para AuthService.
 *
 * Decisiones de arquitectura:
 * - Se usa TestBed de Angular para respetar el ciclo de vida del servicio
 *   (el signal _isAuthenticated se inicializa en construcción leyendo localStorage).
 * - localStorage se mockea con vi.spyOn para no contaminar estado entre tests.
 * - Las funciones privadas (checkValidToken) se cubren INDIRECTAMENTE a través
 *   de isAuthenticated() al re-instanciar el servicio con distintos estados de storage.
 * - Cada describe agrupa UN método público; cada it cubre UNA rama de comportamiento.
 * - Patrón AAA explícito con comentarios en cada test.
 */

import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

// ─── Constantes de claves (espejo de las privadas del servicio) ───────────────
const TOKEN_KEY         = 'dc_access_token';
const REFRESH_TOKEN_KEY = 'dc_refresh_token';
const PATIENT_KEY       = 'dc_patient';

// ─── Helpers para generar JWTs de prueba ─────────────────────────────────────
/**
 * Genera un JWT mínimo con payload controlado.
 * La firma es falsa ("sig") porque AuthService nunca la valida.
 */
function makeJwt(payload: Record<string, unknown>): string {
    const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const body    = btoa(JSON.stringify(payload))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${header}.${body}.sig`;
}

const FUTURE_EXP  = Math.floor(Date.now() / 1000) + 3_600;  // +1 hora
const PAST_EXP    = Math.floor(Date.now() / 1000) - 3_600;  // -1 hora

/** JWT válido con userId */
const VALID_JWT   = makeJwt({ userId: 'user-123', exp: FUTURE_EXP });
/** JWT expirado */
const EXPIRED_JWT = makeJwt({ userId: 'user-456', exp: PAST_EXP });
/** JWT válido sin campo userId */
const NO_USER_JWT = makeJwt({ sub: 'other', exp: FUTURE_EXP });


// ─── Suite principal ──────────────────────────────────────────────────────────
describe('AuthService', () => {

    // Helper que crea una instancia fresca del servicio en cada test
    function createService(): AuthService {
        TestBed.configureTestingModule({});
        return TestBed.inject(AuthService);
    }

    // Limpia localStorage real y restaura todos los spies después de cada test
    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        TestBed.resetTestingModule();
    });


    // ─── isAuthenticated ───────────────────────────────────────────────────
    describe('isAuthenticated()', () => {

        it('should return false when no token is stored at construction', () => {
            // Arrange — localStorage vacío (afterEach lo garantiza)
            const service = createService();

            // Act
            const result = service.isAuthenticated();

            // Assert
            expect(result).toBe(false);
        });

        it('should return true when a valid (non-expired) token is stored at construction', () => {
            // Arrange — token válido antes de construir el servicio
            localStorage.setItem(TOKEN_KEY, VALID_JWT);
            const service = createService();

            // Act
            const result = service.isAuthenticated();

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when an expired token is stored at construction', () => {
            // Arrange — token expirado antes de construir el servicio
            localStorage.setItem(TOKEN_KEY, EXPIRED_JWT);
            const service = createService();

            // Act
            const result = service.isAuthenticated();

            // Assert
            expect(result).toBe(false);
        });

        it('should return true after saveSession is called', () => {
            // Arrange
            const service = createService();

            // Act
            service.saveSession(VALID_JWT, { patientId: 'p-1' });
            const result = service.isAuthenticated();

            // Assert
            expect(result).toBe(true);
        });

        it('should return false after clearSession is called', () => {
            // Arrange — iniciamos autenticados
            localStorage.setItem(TOKEN_KEY, VALID_JWT);
            const service = createService();

            // Act
            service.clearSession();
            const result = service.isAuthenticated();

            // Assert
            expect(result).toBe(false);
        });
    });


    // ─── getToken ──────────────────────────────────────────────────────────
    describe('getToken()', () => {

        it('should return null when no token is stored', () => {
            // Arrange
            const service = createService();

            // Act
            const result = service.getToken();

            // Assert
            expect(result).toBeNull();
        });

        it('should return the stored token string', () => {
            // Arrange
            const service = createService();
            localStorage.setItem(TOKEN_KEY, VALID_JWT);

            // Act
            const result = service.getToken();

            // Assert
            expect(result).toBe(VALID_JWT);
        });
    });


    // ─── getRefreshToken ───────────────────────────────────────────────────
    describe('getRefreshToken()', () => {

        it('should return null when no refresh token is stored', () => {
            // Arrange
            const service = createService();

            // Act
            const result = service.getRefreshToken();

            // Assert
            expect(result).toBeNull();
        });

        it('should return the stored refresh token string', () => {
            // Arrange
            const service = createService();
            localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-abc');

            // Act
            const result = service.getRefreshToken();

            // Assert
            expect(result).toBe('refresh-abc');
        });
    });


    // ─── saveSession ───────────────────────────────────────────────────────
    describe('saveSession()', () => {

        it('should persist the access token in localStorage', () => {
            // Arrange
            const service = createService();

            // Act
            service.saveSession(VALID_JWT, { patientId: 'p-1' });

            // Assert
            expect(localStorage.getItem(TOKEN_KEY)).toBe(VALID_JWT);
        });

        it('should persist the patient as JSON in localStorage', () => {
            // Arrange
            const service   = createService();
            const patient   = { patientId: 'p-42' };

            // Act
            service.saveSession(VALID_JWT, patient);

            // Assert
            expect(localStorage.getItem(PATIENT_KEY)).toBe(JSON.stringify(patient));
        });

        it('should persist the refresh token when provided', () => {
            // Arrange
            const service = createService();

            // Act
            service.saveSession(VALID_JWT, { patientId: 'p-1' }, 'refresh-xyz');

            // Assert
            expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-xyz');
        });

        it('should NOT write to refresh token key when refreshToken is omitted', () => {
            // Arrange
            const service = createService();

            // Act
            service.saveSession(VALID_JWT, { patientId: 'p-1' });

            // Assert
            expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
        });

        it('should set the authenticated signal to true', () => {
            // Arrange
            const service = createService();

            // Act
            service.saveSession(VALID_JWT, { patientId: 'p-1' });

            // Assert
            expect(service.isAuthenticated()).toBe(true);
        });
    });


    // ─── saveAccessToken ───────────────────────────────────────────────────
    describe('saveAccessToken()', () => {

        it('should overwrite the access token in localStorage', () => {
            // Arrange
            const service   = createService();
            const newToken  = makeJwt({ userId: 'u-new', exp: FUTURE_EXP });

            // Act
            service.saveAccessToken(newToken, 'new-refresh');

            // Assert
            expect(localStorage.getItem(TOKEN_KEY)).toBe(newToken);
        });

        it('should overwrite the refresh token in localStorage', () => {
            // Arrange
            const service = createService();

            // Act
            service.saveAccessToken(VALID_JWT, 'new-refresh-token');

            // Assert
            expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('new-refresh-token');
        });

        it('should set the authenticated signal to true', () => {
            // Arrange — servicio sin sesión previa
            const service = createService();

            // Act
            service.saveAccessToken(VALID_JWT, 'refresh-token');

            // Assert
            expect(service.isAuthenticated()).toBe(true);
        });
    });


    // ─── clearSession ──────────────────────────────────────────────────────
    describe('clearSession()', () => {

        it('should remove the access token from localStorage', () => {
            // Arrange
            const service = createService();
            service.saveSession(VALID_JWT, { patientId: 'p-1' }, 'refresh-token');

            // Act
            service.clearSession();

            // Assert
            expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
        });

        it('should remove the refresh token from localStorage', () => {
            // Arrange
            const service = createService();
            service.saveSession(VALID_JWT, { patientId: 'p-1' }, 'refresh-token');

            // Act
            service.clearSession();

            // Assert
            expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
        });

        it('should remove the patient data from localStorage', () => {
            // Arrange
            const service = createService();
            service.saveSession(VALID_JWT, { patientId: 'p-1' });

            // Act
            service.clearSession();

            // Assert
            expect(localStorage.getItem(PATIENT_KEY)).toBeNull();
        });

        it('should set the authenticated signal to false', () => {
            // Arrange — servicio iniciado con token válido en storage
            localStorage.setItem(TOKEN_KEY, VALID_JWT);
            const service = createService();

            // Act
            service.clearSession();

            // Assert
            expect(service.isAuthenticated()).toBe(false);
        });
    });


    // ─── logout ────────────────────────────────────────────────────────────
    describe('logout()', () => {

        it('should delegate entirely to clearSession, removing all stored keys', () => {
            // Arrange
            const service = createService();
            service.saveSession(VALID_JWT, { patientId: 'p-1' }, 'rt-1');
            const clearSpy = vi.spyOn(service, 'clearSession');

            // Act
            service.logout();

            // Assert — verifica delegación y efecto secundario en storage
            expect(clearSpy).toHaveBeenCalledOnce();
            expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
        });
    });


    // ─── getPatientId ──────────────────────────────────────────────────────
    describe('getPatientId()', () => {

        it('should return null when no patient data is stored', () => {
            // Arrange
            const service = createService();

            // Act
            const result = service.getPatientId();

            // Assert
            expect(result).toBeNull();
        });

        it('should return the patientId from stored patient JSON', () => {
            // Arrange
            const service = createService();
            localStorage.setItem(PATIENT_KEY, JSON.stringify({ patientId: 'p-99' }));

            // Act
            const result = service.getPatientId();

            // Assert
            expect(result).toBe('p-99');
        });

        it('should return null when stored patient JSON has no patientId field', () => {
            // Arrange
            const service = createService();
            localStorage.setItem(PATIENT_KEY, JSON.stringify({ someOtherField: 'x' }));

            // Act
            const result = service.getPatientId();

            // Assert
            expect(result).toBeNull();
        });

        it('should return null when stored patient data is malformed JSON', () => {
            // Arrange
            const service = createService();
            localStorage.setItem(PATIENT_KEY, 'this is not json {{');

            // Act
            const result = service.getPatientId();

            // Assert
            expect(result).toBeNull();
        });
    });


    // ─── getUserId ─────────────────────────────────────────────────────────
    // ─── getPatient ────────────────────────────────────────────────────────
    describe('getPatient()', () => {

        it('should return null when no patient data is stored', () => {
            // Arrange
            const service = createService();

            // Act
            const result = service.getPatient();

            // Assert
            expect(result).toBeNull();
        });

        it('should return the parsed patient object from storage', () => {
            // Arrange
            const service = createService();
            const patient = { patientId: 'p-99', fullName: 'Ana García', targetGlucoseMin: 70, targetGlucoseMax: 180 };
            localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));

            // Act
            const result = service.getPatient();

            // Assert
            expect(result).toEqual(patient);
        });

        it('should return null when stored patient data is malformed JSON', () => {
            // Arrange
            const service = createService();
            localStorage.setItem(PATIENT_KEY, 'this is not json {{');

            // Act
            const result = service.getPatient();

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('getUserId()', () => {

        it('should return null when no token is stored', () => {
            // Arrange
            const service = createService();

            // Act
            const result = service.getUserId();

            // Assert
            expect(result).toBeNull();
        });

        it('should return the userId extracted from the JWT payload', () => {
            // Arrange
            const service = createService();
            localStorage.setItem(TOKEN_KEY, VALID_JWT);

            // Act
            const result = service.getUserId();

            // Assert
            expect(result).toBe('user-123');
        });

        it('should return null when the JWT payload has no userId field', () => {
            // Arrange
            const service = createService();
            localStorage.setItem(TOKEN_KEY, NO_USER_JWT);

            // Act
            const result = service.getUserId();

            // Assert
            expect(result).toBeNull();
        });

        it('should return null when the token is structurally invalid', () => {
            // Arrange
            const service = createService();
            localStorage.setItem(TOKEN_KEY, 'not.a.valid.jwt.structure.at.all');

            // Act
            const result = service.getUserId();

            // Assert
            expect(result).toBeNull();
        });
    });


    // ─── isTokenExpired ────────────────────────────────────────────────────
    describe('isTokenExpired()', () => {

        it('should return false for a token whose exp is in the future', () => {
            // Arrange
            const service = createService();

            // Act
            const result = service.isTokenExpired(VALID_JWT);

            // Assert
            expect(result).toBe(false);
        });

        it('should return true for a token whose exp is in the past', () => {
            // Arrange
            const service = createService();

            // Act
            const result = service.isTokenExpired(EXPIRED_JWT);

            // Assert
            expect(result).toBe(true);
        });

        it('should return true for a token that expires exactly at the current millisecond', () => {
            // Arrange
            const service  = createService();
            const nowSec   = Math.floor(Date.now() / 1000);
            // exp igual a "ahora" → Date.now() >= exp*1000 es verdadero (borde exacto)
            const edgeJwt  = makeJwt({ userId: 'u', exp: nowSec });

            // Act
            const result = service.isTokenExpired(edgeJwt);

            // Assert
            expect(result).toBe(true);
        });

        it('should return true for a malformed token string', () => {
            // Arrange
            const service = createService();

            // Act
            const result = service.isTokenExpired('malformed-token');

            // Assert
            expect(result).toBe(true);
        });

        it('should return true for a token with a valid header but non-base64 payload', () => {
            // Arrange
            const service      = createService();
            const badPayload   = 'eyJhbGciOiJIUzI1NiJ9.!!!notbase64!!!.sig';

            // Act
            const result = service.isTokenExpired(badPayload);

            // Assert
            expect(result).toBe(true);
        });


        // ── checkValidToken (privado) probado INDIRECTAMENTE ────────────────
        // checkValidToken() es llamada en el constructor para inicializar la señal
        // _isAuthenticated. Los siguientes tests cubren sus dos ramas sin acceder
        // al método directamente.

        it('[via checkValidToken] should initialise as authenticated when a valid token exists at startup', () => {
            // Arrange — token válido antes de construir el servicio
            localStorage.setItem(TOKEN_KEY, VALID_JWT);

            // Act — la construcción del servicio invoca checkValidToken internamente
            const service = createService();

            // Assert
            expect(service.isAuthenticated()).toBe(true);
        });

        it('[via checkValidToken] should initialise as unauthenticated when storage is empty at startup', () => {
            // Arrange — localStorage ya está limpio (lo garantiza afterEach)

            // Act
            const service = createService();

            // Assert
            expect(service.isAuthenticated()).toBe(false);
        });
    });
});