import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from '../services/loading.service';

describe('loadingInterceptor', () => {

    let loadingServiceMock: { show: ReturnType<typeof vi.fn>; hide: ReturnType<typeof vi.fn> };
    const req = new HttpRequest('GET', '/api/v1/glucose');

    beforeEach(() => {
        loadingServiceMock = { show: vi.fn(), hide: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                { provide: LoadingService, useValue: loadingServiceMock }
            ]
        });
    });

    it('llama a show() antes de delegar la petición', () => {
        const next = vi.fn().mockReturnValue(of(new HttpResponse()));

        TestBed.runInInjectionContext(() => loadingInterceptor(req, next)).subscribe();

        expect(loadingServiceMock.show).toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(req);
    });

    it('llama a hide() cuando la petición se completa exitosamente', () => {
        const next = vi.fn().mockReturnValue(of(new HttpResponse()));

        TestBed.runInInjectionContext(() => loadingInterceptor(req, next)).subscribe();

        expect(loadingServiceMock.hide).toHaveBeenCalled();
    });

    it('llama a hide() también cuando la petición falla', () => {
        const next = vi.fn().mockReturnValue(throwError(() => new Error('network error')));

        TestBed.runInInjectionContext(() => loadingInterceptor(req, next)).subscribe({ error: () => { } });

        expect(loadingServiceMock.hide).toHaveBeenCalled();
    });
});
