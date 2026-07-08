import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, withLatestFrom } from 'rxjs';
import { GlucoseActions } from './glucose.actions';
import { GlucoseService } from '../../features/glucose/services/glucose.service';
import { selectIsStale, selectStats } from './glucose.selectors';

@Injectable()
export class GlucoseEffects {

    private readonly actions$ = inject(Actions);
    private readonly store = inject(Store);
    private readonly glucoseService = inject(GlucoseService);

    loadStats$ = createEffect(() =>
        this.actions$.pipe(
            ofType(GlucoseActions.loadStats),
            withLatestFrom(this.store.select(selectIsStale()), this.store.select(selectStats)),
            switchMap(([action, isStale, cachedStats]) => {
                // Si el caché sigue vigente, se reutiliza en vez de repetir la
                // consulta HTTP — pero igual hay que despachar loadStatsSuccess
                // con el valor ya cacheado, o "loading" se queda en true para
                // siempre (nadie más resetea la bandera que puso loadStats).
                if (!isStale && cachedStats) {
                    return of(GlucoseActions.loadStatsSuccess({ stats: cachedStats }));
                }

                return this.glucoseService.getStats(action.patientId, action.from, action.to).pipe(
                    map(stats => GlucoseActions.loadStatsSuccess({ stats })),
                    catchError(error => of(GlucoseActions.loadStatsFailure({
                        error: error.message ?? 'Error cargando estadísticas'
                    })))
                );
            })
        )
    );

    loadLatest$ = createEffect(() =>
        this.actions$.pipe(
            ofType(GlucoseActions.loadLatest),
            switchMap(action =>
                this.glucoseService.getLatest(action.patientId).pipe(
                    map(reading => GlucoseActions.loadLatestSuccess({ reading })),
                    catchError(error => of(GlucoseActions.loadLatestFailure({
                        error: error.message ?? 'Error cargando la última lectura'
                    })))
                )
            )
        )
    );
}