export interface DeviceApiKeyResponse {
    id: string;
    label: string;
    createdAt: string;
    lastUsedAt: string | null;
    revoked: boolean;
}

export interface GeneratedDeviceApiKeyResponse {
    id: string;
    rawKey: string;
    label: string;
    createdAt: string;
}
