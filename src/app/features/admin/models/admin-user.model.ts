export interface AdminUserResponse {
    id: string;
    email: string;
    role: string;
    enabled: boolean;
    suspendedAt: string | null;
    deletedAt: string | null;
    createdAt: string;
}

export interface ChangeUserRoleRequest {
    role: string;
}
