// Types are defined inline below

// Auth DTOs
export interface User {
    id: number;
    email: string;
    role: string;
    displayName: string;
    storeCode?: string;
    profileImageUrl?: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}

// Report DTOs
export interface Report {
    id: number;
    reportNo: string;
    storeCode: string;
    type: string;
    status: string;
    tplNo: string;
    waybillNo?: string;
    shipmentDate: string;
    notes?: string;
    createdById: number;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
    resendCount: number;
    items: ReportItem[];
    actions: ReportAction[];
    lastEmail?: EmailLog;
    recipients: string[];
}

export interface ReportItem {
    id: number;
    productNo: string;
    productName: string;
    qty: number;
    damageType?: string;
    photoUrl?: string;
}

export interface ReportAction {
    id: number;
    actionType: string;
    actorName: string;
    message?: string;
    createdAt: string;
}

export interface EmailLog {
    id: number;
    to: string;
    subject: string;
    body: string;
    sentAt?: string;
}

export interface ReportListItem {
    id: number;
    reportNo: string;
    storeCode: string;
    type: string;
    status: string;
    tplNo: string;
    itemCount: number;
    lastActionTime: string;
    lastEmailSentAt?: string;
    emailState: string; // "NotSent", "Sent", "Failed"
    lastActionType: string;
}

export interface CreateReportRequest {
    storeCode: string;
    type: string;
    tplNo: string;
    waybillNo?: string;
    shipmentDate: string;
    notes?: string;
    items: {
        productNo: string;
        productName: string;
        qty: number;
        damageType?: string;
    }[];
    recipients?: string[];
}

export interface UpdateReportRequest {
    storeCode: string;
    type: string;
    tplNo: string;
    waybillNo?: string;
    shipmentDate: string;
    notes?: string;
    items: {
        productNo: string;
        productName: string;
        qty: number;
        damageType?: string;
    }[];
    recipients?: string[];
}

export interface PreviewEmailResponse {
    subject: string;
    body: string;
}

export interface SendEmailResponse {
    subject: string;
    body: string;
    sent: boolean;
}

export interface RejectReportRequest {
    rejectionReason: string;
    note?: string;
}

export interface ApiError {
    message_tr?: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

class ApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${endpoint}`;
        // ... implementation
        const config: RequestInit = {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message_tr || 'Bir hata oluştu');
            }

            if (response.status === 204) {
                return {} as T;
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Ağ hatası oluştu');
        }
    }

    // Auth
    async login(email: string, password: string): Promise<LoginResponse> {
        return this.request<LoginResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async logout(): Promise<void> {
        await this.request('/api/auth/logout', { method: 'POST' });
    }

    async getCurrentUser(): Promise<User> {
        return this.request<User>('/api/auth/me');
    }

    // Reports
    async getReports(params?: {
        startDate?: string;
        endDate?: string;
        status?: string;
        type?: string;
        search?: string;
        page?: number;
        pageSize?: number;
    }): Promise<PagedResult<ReportListItem>> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.append(key, String(value));
                }
            });
        }
        const query = searchParams.toString();
        return this.request<PagedResult<ReportListItem>>(
            `/api/reports${query ? `?${query}` : ''}`
        );
    }

    async getReport(id: number): Promise<Report> {
        return this.request<Report>(`/api/reports/${id}`);
    }

    async createReport(data: CreateReportRequest): Promise<Report> {
        return this.request<Report>('/api/reports', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateReport(id: number, data: UpdateReportRequest): Promise<Report> {
        return this.request<Report>(`/api/reports/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async previewEmail(data: CreateReportRequest): Promise<PreviewEmailResponse> {
        return this.request<PreviewEmailResponse>('/api/reports/preview-email', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async sendReport(id: number, sendViaSmtp: boolean = false): Promise<SendEmailResponse> {
        return this.request<SendEmailResponse>(`/api/reports/${id}/send`, {
            method: 'POST',
            body: JSON.stringify({ sendViaSmtp }),
        });
    }

    async acceptReport(id: number): Promise<Report> {
        return this.request<Report>(`/api/reports/${id}/accept`, {
            method: 'POST',
        });
    }

    async rejectReport(id: number, data: RejectReportRequest): Promise<Report> {
        return this.request<Report>(`/api/reports/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async reviseAndResend(id: number, sendViaSmtp: boolean = false): Promise<SendEmailResponse> {
        return this.request<SendEmailResponse>(`/api/reports/${id}/revise-resend`, {
            method: 'POST',
            body: JSON.stringify({ sendViaSmtp }),
        });
    }

    async closeReport(id: number): Promise<Report> {
        return this.request<Report>(`/api/reports/${id}/close`, {
            method: 'POST',
        });
    }
}

export const apiClient = new ApiClient();
