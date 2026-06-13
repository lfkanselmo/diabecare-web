import { glucoseFeature } from './glucose.reducer';

export const {
    selectStats,
    selectLoading,
    selectError,
    selectLastLoaded
} = glucoseFeature;

export const selectIsStale = (ttlMs = 5 * 60 * 1000) =>
    (state: { glucose: import('./glucose.reducer').GlucoseState }) => {
        const lastLoaded = state.glucose.lastLoaded;
        if (!lastLoaded) return true;
        return Date.now() - lastLoaded > ttlMs;
    };