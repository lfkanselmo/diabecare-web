export type AlertSeverity = 'SUCCESS' | 'INFO' | 'WARNING' | 'DANGER';
export type AlertType =
    | 'GLUCOSE_OUT_OF_RANGE'
    | 'GLUCOSE_AVERAGE_HIGH'
    | 'NO_GLUCOSE_RECORDED'
    | 'CALORIE_GOAL_EXCEEDED'
    | 'POSITIVE_STREAK';

export interface AlertResponse {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
}