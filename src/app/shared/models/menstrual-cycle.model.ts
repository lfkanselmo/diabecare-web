export type CyclePhase =
    | 'MENSTRUATION'
    | 'FOLLICULAR'
    | 'OVULATION'
    | 'LUTEAL_EARLY'
    | 'LUTEAL_LATE';

export type FlowIntensity =
    | 'NONE'
    | 'SPOTTING'
    | 'LIGHT'
    | 'MODERATE'
    | 'HEAVY'
    | 'VERY_HEAVY';

export type SymptomSeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export type CycleSymptom =
    | 'CRAMPS' | 'HEADACHE' | 'MIGRAINE' | 'FATIGUE' | 'MOOD_CHANGES'
    | 'ANXIETY' | 'IRRITABILITY' | 'SADNESS' | 'BLOATING' | 'CRAVINGS'
    | 'APPETITE_INCREASE' | 'APPETITE_DECREASE' | 'BREAST_TENDERNESS'
    | 'SLEEP_DIFFICULTY' | 'BACK_PAIN' | 'JOINT_PAIN' | 'NAUSEA'
    | 'DIARRHEA' | 'CONSTIPATION' | 'ACNE' | 'SPOTTING' | 'HOT_FLASHES'
    | 'DIZZINESS' | 'LOW_LIBIDO' | 'HIGH_LIBIDO' | 'BRAIN_FOG' | 'CLOTS';

export interface MenstrualCycleRequest {
    startDate: string;
    notes?: string;
}

export interface FinishPeriodRequest {
    endDate: string;
}

export interface SymptomInput {
    symptom: CycleSymptom;
    severity: SymptomSeverity;
}

export interface RegisterCycleDayEntryRequest {
    entryDate: string;
    flowIntensity: FlowIntensity;
    notes?: string;
    symptoms?: SymptomInput[];
}

export interface SymptomResponse {
    symptom: CycleSymptom;
    symptomLabel: string;
    severity: SymptomSeverity;
}

export interface CycleDayEntryResponse {
    dayEntryId: string;
    entryDate: string;
    flowIntensity: FlowIntensity;
    flowIntensityLabel: string;
    notes: string | null;
    symptoms: SymptomResponse[];
}

export interface CycleHistoryItem {
    cycleId: string;
    startDate: string;
    endDate: string | null;
    actualPeriodLengthDays: number | null;
}

export interface MenstrualCycleStatusResponse {
    currentPhase: CyclePhase;
    currentPhaseLabel: string;
    dayOfCycle: number;
    isOngoing: boolean;
    isOpenTooLong: boolean;
    isProjectionStale: boolean;
    periodStartDate: string;
    nextCycleStart: string;
    daysUntilNextCycle: number;
    glucoseGuidance: string;
    averageCycleLength: number | null;
    averagePeriodLength: number | null;
    todayEntry: CycleDayEntryResponse | null;
    history: CycleHistoryItem[];
}

export interface CyclePhaseDayResponse {
    date: string;
    phase: CyclePhase;
}