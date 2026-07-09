import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GlucoseRemindersComponent } from './glucose-reminders.component';
import { GlucoseReminderService } from '../../services/glucose-reminder.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TranslocoService } from '@jsverse/transloco';
import { GlucoseReminderResponse } from '../../../../shared/models/glucose-reminder.model';

function makeReminder(overrides: Partial<GlucoseReminderResponse> = {}): GlucoseReminderResponse {
    return { id: 'reminder-1', reminderTime: '07:00:00', label: 'Ayunas', enabled: true, ...overrides };
}

describe('GlucoseRemindersComponent', () => {

    let reminderServiceMock: {
        getAll: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        toggle: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };
    let notificationServiceMock: { success: ReturnType<typeof vi.fn>; danger: ReturnType<typeof vi.fn> };

    function createComponent() {
        reminderServiceMock = {
            getAll: vi.fn().mockReturnValue(of([])),
            create: vi.fn(),
            toggle: vi.fn(),
            delete: vi.fn()
        };
        notificationServiceMock = { success: vi.fn(), danger: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                { provide: GlucoseReminderService, useValue: reminderServiceMock },
                { provide: AuthService, useValue: { getPatientId: () => 'patient-1' } },
                { provide: NotificationService, useValue: notificationServiceMock },
                { provide: TranslocoService, useValue: { translate: (key: string) => key } }
            ]
        });

        return TestBed.createComponent(GlucoseRemindersComponent).componentInstance;
    }

    describe('ngOnInit', () => {

        it('carga los recordatorios del paciente al iniciar', () => {
            const component = createComponent();

            component.ngOnInit();

            expect(reminderServiceMock.getAll).toHaveBeenCalledWith('patient-1');
        });
    });

    describe('onAdd', () => {

        it('no hace nada cuando el formulario es inválido (sin hora)', () => {
            const component = createComponent();

            component.onAdd();

            expect(reminderServiceMock.create).not.toHaveBeenCalled();
        });

        it('crea el recordatorio y lo agrega ordenado por hora a la lista', () => {
            const component = createComponent();
            component.reminders.set([makeReminder({ id: 'existing', reminderTime: '20:00:00' })]);
            const created = makeReminder({ id: 'new', reminderTime: '07:00:00' });
            reminderServiceMock.create.mockReturnValue(of(created));
            component.form.setValue({ reminderTime: '07:00', label: 'Ayunas' });

            component.onAdd();

            expect(reminderServiceMock.create).toHaveBeenCalledWith('patient-1', {
                reminderTime: '07:00', label: 'Ayunas'
            });
            expect(component.reminders().map(r => r.id)).toEqual(['new', 'existing']);
        });

        it('notifica el error cuando la creación falla', () => {
            const component = createComponent();
            reminderServiceMock.create.mockReturnValue(throwError(() => new Error('fail')));
            component.form.setValue({ reminderTime: '07:00', label: '' });

            component.onAdd();

            expect(notificationServiceMock.danger).toHaveBeenCalled();
        });
    });

    describe('onToggle', () => {

        it('actualiza el recordatorio en la lista con el resultado del servicio', () => {
            const component = createComponent();
            const original = makeReminder({ enabled: true });
            component.reminders.set([original]);
            reminderServiceMock.toggle.mockReturnValue(of(makeReminder({ enabled: false })));

            component.onToggle(original);

            expect(reminderServiceMock.toggle).toHaveBeenCalledWith('patient-1', 'reminder-1', false);
            expect(component.reminders()[0].enabled).toBe(false);
        });
    });

    describe('onArmDelete / onCancelDelete', () => {

        it('marca y luego limpia el recordatorio armado para confirmación', () => {
            const component = createComponent();

            component.onArmDelete('reminder-1');
            expect(component.armedDeleteId()).toBe('reminder-1');

            component.onCancelDelete();
            expect(component.armedDeleteId()).toBeNull();
        });
    });

    describe('onDelete', () => {

        it('quita el recordatorio de la lista y limpia el estado armado al eliminar', () => {
            const component = createComponent();
            component.reminders.set([makeReminder()]);
            component.onArmDelete('reminder-1');
            reminderServiceMock.delete.mockReturnValue(of(undefined));

            component.onDelete('reminder-1');

            expect(component.reminders()).toEqual([]);
            expect(component.armedDeleteId()).toBeNull();
        });

        it('limpia el estado armado y notifica el error cuando el borrado falla', () => {
            const component = createComponent();
            component.onArmDelete('reminder-1');
            reminderServiceMock.delete.mockReturnValue(throwError(() => new Error('fail')));

            component.onDelete('reminder-1');

            expect(component.armedDeleteId()).toBeNull();
            expect(notificationServiceMock.danger).toHaveBeenCalled();
        });
    });
});
