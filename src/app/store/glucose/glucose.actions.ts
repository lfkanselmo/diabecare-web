import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { GlucoseStatsResponse } from '../../shared/models/glucose.model';

export const GlucoseActions = createActionGroup({
    source: 'Glucose',
    events: {
        'Load Stats': props<{ patientId: string; from: string; to: string }>(),
        'Load Stats Success': props<{ stats: GlucoseStatsResponse }>(),
        'Load Stats Failure': props<{ error: string }>(),
        'Invalidate Cache': emptyProps()
    }
});