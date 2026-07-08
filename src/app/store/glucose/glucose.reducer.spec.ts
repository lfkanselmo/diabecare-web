import { GlucoseActions } from './glucose.actions';
import { GlucoseState, glucoseFeature } from './glucose.reducer';
import { GlucoseReadingResponse, GlucoseStatsResponse } from '../../shared/models/glucose.model';

const { reducer } = glucoseFeature;

const initialState: GlucoseState = {
    stats: null, loading: false, error: null, lastLoaded: null, latestReading: null
};

function makeStats(overrides: Partial<GlucoseStatsResponse> = {}): GlucoseStatsResponse {
    return {
        average: 120,
        standardDeviation: 15,
        coefficientOfVariation: 12,
        estimatedHba1c: 6.5,
        timeInRangePercent: 75,
        timeBelowRangePercent: 5,
        timeAboveRangePercent: 20,
        totalReadings: 30,
        ...overrides
    };
}

function makeReading(overrides: Partial<GlucoseReadingResponse> = {}): GlucoseReadingResponse {
    return {
        readingId: 'reading-1',
        value: 110,
        unit: 'MG_DL',
        readingType: 'RANDOM',
        status: 'NORMAL',
        measuredAt: '2026-07-08T08:00:00',
        notes: null,
        deviceSource: null,
        ...overrides
    };
}

describe('glucose.reducer', () => {

    it('marca loading en true y limpia el error al despachar loadStats', () => {
        const state = reducer(initialState, GlucoseActions.loadStats({
            patientId: 'p1', from: '2026-07-01', to: '2026-07-08'
        }));

        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
    });

    it('guarda las estadísticas, apaga loading y marca lastLoaded al despachar loadStatsSuccess', () => {
        const stats = makeStats();
        const state = reducer(initialState, GlucoseActions.loadStatsSuccess({ stats }));

        expect(state.stats).toEqual(stats);
        expect(state.loading).toBe(false);
        expect(state.lastLoaded).not.toBeNull();
    });

    it('guarda el error y apaga loading al despachar loadStatsFailure', () => {
        const state = reducer(initialState, GlucoseActions.loadStatsFailure({ error: 'boom' }));

        expect(state.loading).toBe(false);
        expect(state.error).toBe('boom');
    });

    it('guarda la última lectura al despachar loadLatestSuccess', () => {
        const reading = makeReading();
        const state = reducer(initialState, GlucoseActions.loadLatestSuccess({ reading }));

        expect(state.latestReading).toEqual(reading);
    });

    it('acepta null en loadLatestSuccess cuando el paciente no tiene lecturas', () => {
        const state = reducer(initialState, GlucoseActions.loadLatestSuccess({ reading: null }));

        expect(state.latestReading).toBeNull();
    });

    it('resetea lastLoaded a null al despachar invalidateCache, sin tocar el resto del estado', () => {
        const withStats = reducer(initialState, GlucoseActions.loadStatsSuccess({ stats: makeStats() }));

        const state = reducer(withStats, GlucoseActions.invalidateCache());

        expect(state.lastLoaded).toBeNull();
        expect(state.stats).toEqual(withStats.stats);
    });
});
