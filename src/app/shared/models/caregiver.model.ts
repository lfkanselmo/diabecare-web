export interface CaregiverInviteResponse {
    code: string;
    expiresAt: string;
}

export interface CaregiverLinkResponse {
    linkId: string;
    caregiverUserId: string;
    caregiverName: string;
    caregiverEmail: string;
    linkedAt: string;
}

export interface PatientAccessResponse {
    patientId: string;
    patientFullName: string;
    linkedAt: string;
}

export interface RedeemCaregiverInviteResponse {
    patientId: string;
    patientFullName: string;
}
