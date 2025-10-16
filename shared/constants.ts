export const SHORTCODE_LENGTH = 6;

export const WORKER_ENDPOINTS = [
	'/',
	'/dashboard',
	'/api/login',
	'/api/signup',
	'/api/me',
	'/api/logout',
	'/api/create-link',
	'/api/remove-link',
	'/api/get-link',
	'/dashboard',
	'/landing',
	'/login',
] as const;
export const PROTECTED_ENDPOINTS = ['/api/me', '/api/logout', '/api/create-link', '/remove-link'] as const;

export const UI_ENDPOINTS = ['/', '/dashboard', '/landing', '/login'] as const;
