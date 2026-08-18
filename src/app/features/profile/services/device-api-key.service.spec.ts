import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { DeviceApiKeyService } from './device-api-key.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = `${environment.apiUrl}/device-keys`;

describe('DeviceApiKeyService', () => {
  let service: DeviceApiKeyService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), DeviceApiKeyService],
    });

    service = TestBed.inject(DeviceApiKeyService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getAll()', () => {
    it('should perform a GET to the device-keys endpoint for the patient', () => {
      service.getAll('patient-1').subscribe();

      const req = controller.expectOne(`${BASE_URL}/patient-1`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('generate()', () => {
    it('should perform a POST with the label and return the generated key', () => {
      let result: unknown;
      service.generate('patient-1', 'Dexcom G6').subscribe((r) => (result = r));

      const req = controller.expectOne(`${BASE_URL}/patient-1`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ label: 'Dexcom G6' });

      const response = {
        id: 'key-1',
        rawKey: 'dbc_rawkey123',
        label: 'Dexcom G6',
        createdAt: '2026-01-01T00:00:00',
      };
      req.flush(response);

      expect(result).toEqual(response);
    });
  });

  describe('revoke()', () => {
    it('should perform a DELETE to the specific key', () => {
      service.revoke('patient-1', 'key-1').subscribe();

      const req = controller.expectOne(`${BASE_URL}/patient-1/key-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
