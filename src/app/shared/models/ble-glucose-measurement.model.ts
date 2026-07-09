export interface BleGlucoseMeasurement {
    value: number;
    unit: 'MG_DL' | 'MMOL_L';
    measuredAt: Date;
    deviceName: string;
}
