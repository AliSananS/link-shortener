import { PROTECTED_ENDPOINTS, UI_ENDPOINTS, WORKER_ENDPOINTS } from '@shared/constants';

export type SignupResponseError = 'EMAIL_EXISTS' | 'INVALID_EMAIL' | 'WEAK_PASSWORD' | 'MISSING_CREDENTIALS' | 'TOO_MANY_ATTEMPTS';

export type LoginResponseError = 'EMAIL_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'MISSING_CREDENTIALS' | 'TOO_MANY_ATTEMPTS' | 'USER_DISABLED';

export type CreateLinkResponseError = 'INVALID_SHORT_CODE' | 'MISSING_SHORT_CODE' | 'UNAUTHORIZED' | 'SHORT_CODE_ALREADY_EXISTS';

export type GetLinkResponseError = 'MISSING_SHORT_CODE' | 'INVALID_SHORT_CODE';

export type DeleteLinkResponseError = 'LINK_NOT_FOUND' | 'UNAUTHORIZED';

// Generic API response shape used by both client and server.
export type ApiResponse<T = unknown, E = string> = {
	success: boolean;
	code?: E; // optional machine-readable code (e.g. error union value)
	message?: string; // human-readable message
	data?: T; // successful payload
	error?: string; // optional free-form error string
};

// Minimal public user data returned by `/api/me`
export type UserPublic = {
	email: string;
	name: string;
	createdAt: number;
};

// Create Link types
export const expireEntries = ['never', 'day', 'week', 'year'] as const;

export type Expiry = (typeof expireEntries)[number] | number;

export type CreateLinkApiRequest = {
	shortCode?: string;
	destination: string;
	expiresAt: Expiry;
};

export type GetLinkApiRequest = {
	shortCode: string;
};

export type RemoveLinkApiRequest = {
	shortCode: string;
};

export type Result<T, E = Error | string> = { ok: true; value: T } | { ok: false; error: E };

export type WorkerEndpoint = (typeof WORKER_ENDPOINTS)[number];

export type ProtectedEndpoint = (typeof PROTECTED_ENDPOINTS)[number];

export type UiEndpoint = (typeof UI_ENDPOINTS)[number];
