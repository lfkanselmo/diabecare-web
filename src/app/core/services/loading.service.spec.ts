import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {

    let service: LoadingService;

    beforeEach(() => {
        vi.useFakeTimers();
        TestBed.configureTestingModule({});
        service = TestBed.inject(LoadingService);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('no muestra el indicador antes de que pasen 300ms', () => {
        service.show();
        vi.advanceTimersByTime(299);

        expect(service.visible()).toBe(false);
    });

    it('muestra el indicador una vez transcurridos 300ms de carga sostenida', () => {
        service.show();
        vi.advanceTimersByTime(300);

        expect(service.visible()).toBe(true);
    });

    it('no muestra el indicador si la petición termina antes de los 300ms (evita parpadeo)', () => {
        service.show();
        vi.advanceTimersByTime(100);
        service.hide();
        vi.advanceTimersByTime(300);

        expect(service.visible()).toBe(false);
    });

    it('mantiene el indicador visible mientras haya otra petición pendiente', () => {
        service.show();
        service.show();
        vi.advanceTimersByTime(300);

        service.hide();

        expect(service.visible()).toBe(true);
    });

    it('oculta el indicador inmediatamente cuando la última petición pendiente termina', () => {
        service.show();
        service.show();
        vi.advanceTimersByTime(300);

        service.hide();
        service.hide();

        expect(service.visible()).toBe(false);
    });

    it('no queda en un estado inconsistente si hide() se llama más veces que show()', () => {
        service.hide();
        service.show();
        vi.advanceTimersByTime(300);

        expect(service.visible()).toBe(true);
    });
});
