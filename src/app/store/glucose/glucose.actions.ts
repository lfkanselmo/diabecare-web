import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { GlucoseReadingResponse, GlucoseStatsResponse } from '../../shared/models/glucose.model';

export const GlucoseActions = createActionGroup({
    source: 'Glucose',
    events: {
        'Load Stats': props<{ patientId: string; from: string; to: string }>(),
        'Load Stats Success': props<{ stats: GlucoseStatsResponse }>(),
        'Load Stats Failure': props<{ error: string }>(),
        'Load Latest': props<{ patientId: string }>(),
        'Load Latest Success': props<{ reading: GlucoseReadingResponse | null }>(),
        'Load Latest Failure': props<{ error: string }>(),
        'Invalidate Cache': emptyProps()
    }
});