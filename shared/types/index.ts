export type SignupResponseError = 'EMAIL_EXISTS' | 'INVALID_EMAIL' | 'WEAK_PASSWORD' | 'MISSING_CREDENTIALS' | 'TOO_MANY_ATTEMPTS';

export type LoginResponseError = 'EMAIL_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'MISSING_CREDENTIALS' | 'TOO_MANY_ATTEMPTS' | 'USER_DISABLED';

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

export type CreateLinkRequest = {
	shortCode: string;
	destination: string;
	expiresAt: Expiry;
};

export type RemoveLinkRequest = {
	shortCode: string;
};

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
