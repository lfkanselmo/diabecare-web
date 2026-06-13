import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, withLatestFrom } from 'rxjs';
import { GlucoseActions } from './glucose.actions';
import { GlucoseService } from '../../features/glucose/services/glucose.service';
import { selectIsStale } from './glucose.selectors';

@Injectable()
export class GlucoseEffects {

    private readonly actions$ = inject(Actions);
    private readonly store = inject(Store);
    private readonly glucoseService = inject(GlucoseService);

    loadStats$ = createEffect(() =>
        this.actions$.pipe(
            ofType(GlucoseActions.loadStats),
            withLatestFrom(this.store.select(selectIsStale())),
            switchMap(([action, isStale]) => {
                if (!isStale) return of();

                return this.glucoseService.getStats(action.patientId, action.from, action.to).pipe(
                    map(stats => GlucoseActions.loadStatsSuccess({ stats })),
                    catchError(error => of(GlucoseActions.loadStatsFailure({
                        error: error.message ?? 'Error cargando estadísticas'
                    })))
                );
            })
        )
    );
}