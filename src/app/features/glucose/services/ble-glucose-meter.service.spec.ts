import { parseGlucoseMeasurement } from './ble-glucose-meter.service';

function dataViewFromBytes(bytes: number[]): DataView {
    return new DataView(new Uint8Array(bytes).buffer);
}

describe('parseGlucoseMeasurement', () => {

    it('parsea una medición en mg/dL sin offset de tiempo', () => {
        // flags=0x02 (glucosa presente, unidad kg/L), seq=1, fecha 2026-01-15 08:30:00,
        // SFLOAT 0xC00C = 12 * 10^-4 = 0.0012 kg/L -> 120 mg/dL
        const bytes = [
            0x02,
            0x01, 0x00,
            0xEA, 0x07, 0x01, 0x0F, 0x08, 0x1E, 0x00,
            0x0C, 0xC0,
            0x00
        ];

        const result = parseGlucoseMeasurement(dataViewFromBytes(bytes), 'Contour Next One');

        expect(result.value).toBe(120);
        expect(result.unit).toBe('MG_DL');
        expect(result.deviceName).toBe('Contour Next One');
        expect(result.measuredAt).toEqual(new Date(2026, 0, 15, 8, 30, 0));
    });

    it('parsea una medición en mmol/L aplicando el offset de tiempo', () => {
        // flags=0x07 (offset presente, glucosa presente, unidad mol/L), seq=2,
        // fecha base 2026-03-10 14:00:00, offset -30 min, SFLOAT 0xC037 = 55*10^-4 = 0.0055 mol/L -> 5.5 mmol/L
        const bytes = [
            0x07,
            0x02, 0x00,
            0xEA, 0x07, 0x03, 0x0A, 0x0E, 0x00, 0x00,
            0xE2, 0xFF,
            0x37, 0xC0,
            0x00
        ];

        const result = parseGlucoseMeasurement(dataViewFromBytes(bytes), 'Accu-Chek');

        expect(result.value).toBe(5.5);
        expect(result.unit).toBe('MMOL_L');
        expect(result.measuredAt).toEqual(new Date(2026, 2, 10, 13, 30, 0));
    });

    it('lanza un error cuando la medición no incluye un valor de glucosa', () => {
        // flags=0x00: ningún bit presente, en particular glucosa ausente
        const bytes = [0x00, 0x01, 0x00, 0xEA, 0x07, 0x01, 0x0F, 0x08, 0x1E, 0x00];

        expect(() => parseGlucoseMeasurement(dataViewFromBytes(bytes), 'Sin glucosa'))
            .toThrowError('La medición del glucómetro no incluye un valor de glucosa');
    });
});
