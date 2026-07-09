export interface GlucoseReminderResponse {
    id: string;
    reminderTime: string;
    label: string | null;
    enabled: boolean;
}

export interface CreateGlucoseReminderRequest {
    reminderTime: string;
    label: string | null;
}
