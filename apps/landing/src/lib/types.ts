export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

export interface ErrorObject {
  code: string; // e.g., "USER_NOT_FOUND"
  message: string; // user-friendly error message
  details?: any; // optional: field errors, invalid values, etc.
}

export interface ErrorResponse {
  success: false;
  error: ErrorObject;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Specific data types for waitlist responses
export interface WaitlistEntryData {
  id: string;
  remainingRequests?: number;
}

export interface WaitlistCountData {
  count: number;
  remainingRequests?: number;
}

export interface WaitlistAdminEntryData {
  id: string;
  email: string;
  name?: string;
  source?: string;
  createdAt: string;
  ip?: string;
  userAgent?: string;
}

export interface WaitlistAdminEntriesData {
  entries: WaitlistAdminEntryData[];
  total: number;
}

export interface WaitlistAdminStatsData {
  totalUsers: number;
}

export interface WaitlistAdminHelpData {
  availableActions: string[];
  usage: Record<string, string>;
}

// Type guards
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(
  response: ApiResponse
): response is ErrorResponse {
  return response.success === false;
}
