import { Injectable } from '@angular/core';
import { BleGlucoseMeasurement } from '../../../shared/models/ble-glucose-measurement.model';

const GLUCOSE_SERVICE = 'glucose';
const GLUCOSE_MEASUREMENT_CHARACTERISTIC = 'glucose_measurement';
const RECORD_ACCESS_CONTROL_POINT_CHARACTERISTIC = 'record_access_control_point';

// Bluetooth SIG Record Access Control Point: opcode 1 = "Report Stored Records",
// operator 6 = "Last record" — le pide al glucómetro que envíe solo su última lectura.
const RACP_REPORT_LAST_RECORD = new Uint8Array([0x01, 0x06]);

const NOTIFICATION_TIMEOUT_MS = 15000;

/**
 * Decodifica un SFLOAT de 16 bits (IEEE 11073-20601): 4 bits de exponente + 12 bits
 * de mantisa, ambos en complemento a 2. Es el formato en el que el Glucose Service
 * estándar de Bluetooth codifica la concentración de glucosa.
 */
function parseSfloat(raw: number): number {
    let exponent = (raw >> 12) & 0x0F;
    let mantissa = raw & 0x0FFF;
    if (exponent >= 0x8) exponent -= 0x10;
    if (mantissa >= 0x800) mantissa -= 0x1000;
    return mantissa * Math.pow(10, exponent);
}

/**
 * Parsea la característica Glucose Measurement (0x2A18) según la especificación del
 * Bluetooth SIG. Exportada aparte de la clase para poder testearla con bytes fijos
 * sin necesitar una conexión Bluetooth real.
 */
export function parseGlucoseMeasurement(dataView: DataView, deviceName: string): BleGlucoseMeasurement {
    const flags = dataView.getUint8(0);
    const timeOffsetPresent = (flags & 0x01) !== 0;
    const glucosePresent = (flags & 0x02) !== 0;
    const unitIsMmol = (flags & 0x04) !== 0;

    let offset = 1 + 2; // flags (1) + sequence number (2, no lo necesitamos)

    const year = dataView.getUint16(offset, true);
    const month = dataView.getUint8(offset + 2);
    const day = dataView.getUint8(offset + 3);
    const hours = dataView.getUint8(offset + 4);
    const minutes = dataView.getUint8(offset + 5);
    const seconds = dataView.getUint8(offset + 6);
    offset += 7;

    let measuredAt = new Date(year, month - 1, day, hours, minutes, seconds);

    if (timeOffsetPresent) {
        const timeOffsetMinutes = dataView.getInt16(offset, true);
        offset += 2;
        measuredAt = new Date(measuredAt.getTime() + timeOffsetMinutes * 60000);
    }

    if (!glucosePresent) {
        throw new Error('La medición del glucómetro no incluye un valor de glucosa');
    }

    const concentration = parseSfloat(dataView.getUint16(offset, true));

    // El estándar reporta la concentración en kg/L o mol/L, nunca directamente en
    // mg/dL o mmol/L: kg/L -> mg/dL es *100000 (kg/L -> g/L *1000 -> mg/L *1000 ->
    // mg/dL /10); mol/L -> mmol/L es *1000 por definición del prefijo "mili".
    const value = unitIsMmol
        ? Math.round(concentration * 1000 * 10) / 10
        : Math.round(concentration * 100000);

    return { value, unit: unitIsMmol ? 'MMOL_L' : 'MG_DL', measuredAt, deviceName };
}

@Injectable({ providedIn: 'root' })
export class BleGlucoseMeterService {

    isSupported(): boolean {
        return !!navigator.bluetooth;
    }

    async readLatestMeasurement(): Promise<BleGlucoseMeasurement> {
        if (!this.isSupported()) {
            throw new Error('Este navegador no soporta Web Bluetooth');
        }

        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [GLUCOSE_SERVICE] }]
        });

        if (!device.gatt) {
            throw new Error('El dispositivo no expone una conexión GATT');
        }

        const server = await device.gatt.connect();

        try {
            const service = await server.getPrimaryService(GLUCOSE_SERVICE);
            const measurementCharacteristic = await service.getCharacteristic(GLUCOSE_MEASUREMENT_CHARACTERISTIC);
            const racpCharacteristic = await service.getCharacteristic(RECORD_ACCESS_CONTROL_POINT_CHARACTERISTIC);

            const measurement = await this.waitForMeasurement(measurementCharacteristic, device.name ?? 'Glucómetro');

            await racpCharacteristic.writeValue(RACP_REPORT_LAST_RECORD);

            return await measurement;
        } finally {
            device.gatt.disconnect();
        }
    }

    private waitForMeasurement(
        characteristic: BluetoothRemoteGATTCharacteristic,
        deviceName: string
    ): Promise<BleGlucoseMeasurement> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                characteristic.removeEventListener('characteristicvaluechanged', onValueChanged);
                reject(new Error('El glucómetro no respondió a tiempo'));
            }, NOTIFICATION_TIMEOUT_MS);

            const onValueChanged = (): void => {
                const value = characteristic.value;
                if (!value) return;

                clearTimeout(timeout);
                characteristic.removeEventListener('characteristicvaluechanged', onValueChanged);
                try {
                    resolve(parseGlucoseMeasurement(value, deviceName));
                } catch (err) {
                    reject(err);
                }
            };

            characteristic.addEventListener('characteristicvaluechanged', onValueChanged);
            characteristic.startNotifications().catch(reject);
        });
    }
}
