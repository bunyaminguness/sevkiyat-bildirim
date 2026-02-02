// Enums
export type ReportType = 'Missing' | 'Damaged';
export type ReportStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Closed';
export type ActionType = 'CREATED' | 'UPDATED' | 'SENT' | 'RESENT' | 'ACCEPTED' | 'REJECTED' | 'NOTE_ADDED' | 'CLOSED';

// User
export interface User {
  id: number;
  email: string;
  role: string;
  displayName: string;
  storeCode?: string;
}

// Report
export interface Report {
  id: number;
  reportNo: string;
  storeCode: string;
  type: ReportType;
  status: ReportStatus;
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
}

export interface ReportListItem {
  id: number;
  reportNo: string;
  storeCode: string;
  type: ReportType;
  status: ReportStatus;
  tplNo: string;
  itemCount: number;
  lastActionTime: string;
}

export interface ReportItem {
  id?: number;
  productNo: string;
  productName: string;
  qty: number;
  damageType?: string;
  photoUrl?: string;
}

export interface ReportAction {
  id: number;
  actionType: ActionType;
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

// Requests
export interface CreateReportRequest {
  storeCode: string;
  type: ReportType;
  tplNo: string;
  waybillNo?: string;
  shipmentDate: string;
  notes?: string;
  items: ReportItem[];
}

export interface UpdateReportRequest extends CreateReportRequest {}

export interface RejectReportRequest {
  rejectionReason: string;
  note?: string;
}

// Responses
export interface LoginResponse {
  token: string;
  user: User;
}

export interface SendEmailResponse {
  subject: string;
  body: string;
  sent: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message_tr: string;
  fieldErrors?: Record<string, string>;
}
