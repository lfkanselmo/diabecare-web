export interface ApiError {
    timestamp: string;
    status: number;
    error: string;
    code: string;
    message: string;
    path: string;
    fieldErrors?: FieldError[];
}

export interface FieldError {
    field: string;
    message: string;
}