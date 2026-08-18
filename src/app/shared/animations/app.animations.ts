import { trigger, transition, style, animate, query, stagger, group } from '@angular/animations';

// Duplicados de los tokens --transition-*/--ease-spring de _tokens.scss:
// Angular resuelve el timing de animate() del lado del cliente y no puede
// leer custom properties de CSS ahi.
const DUR_FAST = '150ms';
const DUR_NORMAL = '250ms';
const DUR_SLOW = '400ms';
const EASE_STANDARD = 'ease';
const EASE_SPRING = 'cubic-bezier(0.34, 1.2, 0.64, 1)';

export const routeFade = trigger('routeFade', [
  transition('* <=> *', [
    query(':enter, :leave', [style({ position: 'absolute', width: '100%' })], { optional: true }),
    group([
      query(':leave', [animate(`${DUR_FAST} ${EASE_STANDARD}`, style({ opacity: 0 }))], {
        optional: true,
      }),
      query(
        ':enter',
        [
          style({ opacity: 0 }),
          animate(`${DUR_NORMAL} 50ms ${EASE_STANDARD}`, style({ opacity: 1 })),
        ],
        { optional: true },
      ),
    ]),
  ]),
]);

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate(`${DUR_SLOW} ${EASE_SPRING}`, style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

export const listStagger = trigger('listStagger', [
  transition('* => *', [
    group([
      query(':leave', [animate(`${DUR_FAST} ${EASE_STANDARD}`, style({ opacity: 0 }))], {
        optional: true,
      }),
      query(
        ':enter',
        [
          style({ opacity: 0, transform: 'translateY(8px)' }),
          stagger('30ms', [
            animate(
              `${DUR_SLOW} ${EASE_SPRING}`,
              style({ opacity: 1, transform: 'translateY(0)' }),
            ),
          ]),
        ],
        { optional: true },
      ),
    ]),
  ]),
]);
