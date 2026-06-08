export type CyclePhase =
    | 'MENSTRUATION'
    | 'FOLLICULAR'
    | 'OVULATION'
    | 'LUTEAL_EARLY'
    | 'LUTEAL_LATE';

export interface MenstrualCycleRequest {
    startDate: string;
    periodLengthDays?: number;
    symptoms?: string;
    notes?: string;
}

export interface CycleHistoryItem {
    cycleId: string;
    startDate: string;
    cycleLengthDays: number | null;
    periodLengthDays: number | null;
    symptoms: string | null;
}

export interface MenstrualCycleStatusResponse {
    currentPhase: CyclePhase;
    currentPhaseLabel: string;
    dayOfCycle: number;
    nextCycleStart: string;
    daysUntilNextCycle: number;
    glucoseGuidance: string;
    averageCycleLength: number;
    history: CycleHistoryItem[];
}