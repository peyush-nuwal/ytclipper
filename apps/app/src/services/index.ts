export { authApi } from './auth-old';
export type {
  AddPasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from './auth-old';
export { extensionMessaging } from './extension-messaging';
export type {
  ExtensionAuthMessage,
  ExtensionResponse,
  ExtensionUser,
} from './extension-messaging';
export {
  getExtensionStatus,
  syncAuthenticatedUser,
  syncAuthState,
  syncLogout,
} from './extension-sync';
export type { ExtensionSyncResult } from './extension-sync';
export { timestampsApi } from './timestamps';
export type {
  CreateTimestampRequest,
  DeleteTimestampResponse,
  GetTimestampsResponse,
  Timestamp,
} from './timestamps';
export { videosApi } from './videos';
export type { GetUserVideosResponse, VideoSummary } from './videos';
