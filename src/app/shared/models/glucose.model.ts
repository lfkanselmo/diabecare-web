export type GlucoseUnit = 'MG_DL' | 'MMOL_L';
export type ReadingType = 'FASTING' | 'PRE_MEAL' | 'POST_MEAL' | 'BEDTIME' | 'RANDOM';
export type GlucoseStatus = 'CRITICALLY_LOW' | 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICALLY_HIGH';

export interface GlucoseReadingResponse {
    readingId: string;
    value: number;
    unit: GlucoseUnit;
    readingType: ReadingType;
    status: GlucoseStatus;
    measuredAt: string;
    notes: string | null;
    deviceSource: string | null;
}

export interface RegisterGlucoseRequest {
    value: number;
    unit: GlucoseUnit;
    readingType: ReadingType;
    measuredAt: string;
    notes?: string;
    deviceSource?: string;
}

export interface GlucoseStatsResponse {
    average: number;
    standardDeviation: number;
    coefficientOfVariation: number;
    estimatedHba1c: number;
    timeInRangePercent: number;
    timeBelowRangePercent: number;
    timeAboveRangePercent: number;
    totalReadings: number;
}