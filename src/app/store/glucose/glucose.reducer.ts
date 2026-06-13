import { createFeature, createReducer, on } from '@ngrx/store';
import { GlucoseStatsResponse } from '../../shared/models/glucose.model';
import { GlucoseActions } from './glucose.actions';

export interface GlucoseState {
    stats: GlucoseStatsResponse | null;
    loading: boolean;
    error: string | null;
    lastLoaded: number | null;
}

const initialState: GlucoseState = {
    stats: null,
    loading: false,
    error: null,
    lastLoaded: null
};

export const glucoseFeature = createFeature({
    name: 'glucose',
    reducer: createReducer(
        initialState,
        on(GlucoseActions.loadStats, state => ({
            ...state,
            loading: true,
            error: null
        })),
        on(GlucoseActions.loadStatsSuccess, (state, { stats }) => ({
            ...state,
            stats,
            loading: false,
            lastLoaded: Date.now()
        })),
        on(GlucoseActions.loadStatsFailure, (state, { error }) => ({
            ...state,
            loading: false,
            error
        })),
        on(GlucoseActions.invalidateCache, state => ({
            ...state,
            lastLoaded: null
        }))
    )
});