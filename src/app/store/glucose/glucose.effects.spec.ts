import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of, throwError } from 'rxjs';
import { GlucoseEffects } from './glucose.effects';
import { GlucoseActions } from './glucose.actions';
import { GlucoseState } from './glucose.reducer';
import { GlucoseService } from '../../features/glucose/services/glucose.service';
import { GlucoseReadingResponse, GlucoseStatsResponse } from '../../shared/models/glucose.model';

function makeStats(): GlucoseStatsResponse {
    return {
        average: 120, standardDeviation: 15, coefficientOfVariation: 12,
        estimatedHba1c: 6.5, timeInRangePercent: 75, timeBelowRangePercent: 5,
        timeAboveRangePercent: 20, totalReadings: 30
    };
}

function makeReading(): GlucoseReadingResponse {
    return {
        readingId: 'reading-1', value: 110, unit: 'MG_DL', readingType: 'RANDOM',
        status: 'NORMAL', measuredAt: '2026-07-08T08:00:00', notes: null, deviceSource: null
    };
}

function emptyGlucoseState(overrides: Partial<GlucoseState> = {}): GlucoseState {
    return { stats: null, loading: false, error: null, lastLoaded: null, latestReading: null, ...overrides };
}

describe('GlucoseEffects', () => {

    let actions$: Observable<unknown>;
    let glucoseServiceMock: { getStats: ReturnType<typeof vi.fn>; getLatest: ReturnType<typeof vi.fn> };
    let store: MockStore;

    function setup(initialGlucoseState: GlucoseState): GlucoseEffects {
        TestBed.configureTestingModule({
            providers: [
                GlucoseEffects,
                provideMockActions(() => actions$),
                provideMockStore({ initialState: { glucose: initialGlucoseState } }),
                { provide: GlucoseService, useValue: glucoseServiceMock }
            ]
        });

        store = TestBed.inject(MockStore);
        return TestBed.inject(GlucoseEffects);
    }

    beforeEach(() => {
        glucoseServiceMock = { getStats: vi.fn(), getLatest: vi.fn() };
    });

    describe('loadStats$', () => {

        it('consulta el backend y despacha loadStatsSuccess cuando el caché está obsoleto', () => {
            actions$ = of(GlucoseActions.loadStats({ patientId: 'p1', from: 'a', to: 'b' }));
            const stats = makeStats();
            glucoseServiceMock.getStats.mockReturnValue(of(stats));

            const effects = setup(emptyGlucoseState());

            let result: unknown;
            effects.loadStats$.subscribe(action => (result = action));

            expect(glucoseServiceMock.getStats).toHaveBeenCalledWith('p1', 'a', 'b');
            expect(result).toEqual(GlucoseActions.loadStatsSuccess({ stats }));
        });

        it('reutiliza el valor cacheado y despacha loadStatsSuccess sin volver a llamar al backend '
            + 'cuando el caché sigue vigente (evita que loading se quede pegado en true)', () => {
            actions$ = of(GlucoseActions.loadStats({ patientId: 'p1', from: 'a', to: 'b' }));
            const cachedStats = makeStats();

            const effects = setup(emptyGlucoseState({ stats: cachedStats, lastLoaded: Date.now() }));

            let result: unknown;
            effects.loadStats$.subscribe(action => (result = action));

            expect(glucoseServiceMock.getStats).not.toHaveBeenCalled();
            expect(result).toEqual(GlucoseActions.loadStatsSuccess({ stats: cachedStats }));
        });

        it('despacha loadStatsFailure cuando el backend falla', () => {
            actions$ = of(GlucoseActions.loadStats({ patientId: 'p1', from: 'a', to: 'b' }));
            glucoseServiceMock.getStats.mockReturnValue(throwError(() => new Error('network down')));

            const effects = setup(emptyGlucoseState());

            let result: unknown;
            effects.loadStats$.subscribe(action => (result = action));

            expect(result).toEqual(GlucoseActions.loadStatsFailure({ error: 'network down' }));
        });
    });

    describe('loadLatest$', () => {

        it('despacha loadLatestSuccess con la lectura más reciente', () => {
            actions$ = of(GlucoseActions.loadLatest({ patientId: 'p1' }));
            const reading = makeReading();
            glucoseServiceMock.getLatest.mockReturnValue(of(reading));

            const effects = setup(emptyGlucoseState());

            let result: unknown;
            effects.loadLatest$.subscribe(action => (result = action));

            expect(glucoseServiceMock.getLatest).toHaveBeenCalledWith('p1');
            expect(result).toEqual(GlucoseActions.loadLatestSuccess({ reading }));
        });

        it('despacha loadLatestFailure cuando el backend falla', () => {
            actions$ = of(GlucoseActions.loadLatest({ patientId: 'p1' }));
            glucoseServiceMock.getLatest.mockReturnValue(throwError(() => new Error('network down')));

            const effects = setup(emptyGlucoseState());

            let result: unknown;
            effects.loadLatest$.subscribe(action => (result = action));

            expect(result).toEqual(GlucoseActions.loadLatestFailure({ error: 'network down' }));
        });
    });
});
