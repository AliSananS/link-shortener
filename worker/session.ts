import { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { LoginRequest, SignupRequest } from '@/types';
import type { SignupResponseError, LoginResponseError, ApiResponse, UserPublic } from '@shared/types';
import { env } from 'cloudflare:workers';

const { users, sessions } = schema;

type dbType = DrizzleD1Database<typeof schema> & {
	$client: D1Database;
};

export function getCookie(cookie: string, name: string): string | null {
	return (
		cookie
			.split(';')
			.find((c) => c.trim().startsWith(name + '='))
			?.split('=')[1] || null
	);
}

export async function encryptSession(sessionId: string, secret: string): Promise<string> {
	const key = await getKey(secret);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(sessionId));
	const combined = new Uint8Array([...iv, ...new Uint8Array(enc)]);
	return btoa(String.fromCharCode(...combined));
}

export async function decryptSession(encoded: string | null, secret: string): Promise<string | null> {
	if (!encoded) return null;
	try {
		const data = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
		const iv = data.slice(0, 12);
		const enc = data.slice(12);
		const key = await getKey(secret);
		const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, enc);
		return new TextDecoder().decode(dec);
	} catch {
		return null;
	}
}

async function getKey(secret: string): Promise<CryptoKey> {
	const raw = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0));
	return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function signup(req: Request, db: dbType): Promise<Response> {
	const { email, password, name } = (await req.json()) satisfies SignupRequest;
	if (!email || !password || !name) {
		const body: ApiResponse<null, SignupResponseError> = {
			success: false,
			code: 'MISSING_CREDENTIALS',
			error: 'Missing fields',
		};
		return Response.json(body, { status: 400 });
	}

	if (!validateEmail(email)) {
		const body: ApiResponse<null, SignupResponseError> = {
			success: false,
			code: 'INVALID_EMAIL',
			error: 'Invalid email format',
		};
		return Response.json(body, { status: 400 });
	}

	const hash = await bcrypt.hash(password, 10);

	const user = await db.query.users.findFirst({ where: eq(users.email, email) });
	if (user !== undefined) {
		const body: ApiResponse<null, SignupResponseError> = {
			success: false,
			code: 'EMAIL_EXISTS',
			error: 'User already exists',
		};
		return Response.json(body, { status: 409 });
	}

	const userId = nanoid();
	await db.insert(users).values({
		id: userId,
		name,
		email,
		passwordHash: hash,
		createdAt: Date.now(),
	});

	const sessionId = nanoid();
	await db.insert(sessions).values({
		id: sessionId,
		userId: userId,
		createdAt: Date.now(),
		expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	const encrypted = await encryptSession(sessionId, env.SESSION_SECRET);

	const body: ApiResponse<null> = {
		success: true,
		message: 'User created successfully',
	};

	return Response.json(body, {
		status: 201,
		headers: {
			'Set-Cookie': `session=${encrypted}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
		},
	});
}

export async function login(req: Request, db: dbType, env: Env): Promise<Response> {
	const body = (await req.json()) satisfies LoginRequest;
	const { email, password } = body;

	if (!email || !password) {
		const resBody: ApiResponse<null, LoginResponseError> = {
			success: false,
			code: 'MISSING_CREDENTIALS',
			error: 'Missing credentials',
		};
		return Response.json(resBody, { status: 400 });
	}

	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
	});
	if (!user) {
		const resBody: ApiResponse<null, LoginResponseError> = {
			success: false,
			code: 'EMAIL_NOT_FOUND',
			error: 'Invalid email or password',
		};
		return Response.json(resBody, { status: 401 });
	}

	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) {
		const resBody: ApiResponse<null, LoginResponseError> = {
			success: false,
			code: 'INVALID_CREDENTIALS',
			error: 'Invalid email or password',
		};
		return Response.json(resBody, { status: 401 });
	}

	const sessionId = nanoid();
	await db.insert(sessions).values({
		id: sessionId,
		userId: user.id,
		createdAt: Date.now(),
		expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	const encrypted = await encryptSession(sessionId, env.SESSION_SECRET);

	const resBody: ApiResponse<null> = {
		success: true,
		message: 'Logged in successfully',
	};

	return Response.json(resBody, {
		headers: {
			'Set-Cookie': `session=${encrypted}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
		},
	});
}

export async function logout(req: Request, db: dbType): Promise<Response> {
	const cookie = req.headers.get('Cookie');
	if (!cookie) {
		const resBody: ApiResponse<null, LoginResponseError> = {
			success: false,
			code: 'MISSING_CREDENTIALS',
			error: 'No session found',
		};
		return Response.json(resBody, { status: 401 });
	}

	const sessionId = await decryptSession(getCookie(cookie, 'session'), env.SESSION_SECRET);
	if (sessionId) await db.delete(sessions).where(eq(sessions.id, sessionId));

	const resBody: ApiResponse<null> = {
		success: true,
		message: 'Logged out successfully',
	};

	return Response.json(resBody, {
		headers: { 'Set-Cookie': 'session=; Path=/; Max-Age=0;' },
	});
}

export async function me(req: Request, db: any, env: Env): Promise<Response> {
	const cookie = req.headers.get('Cookie');
	if (!cookie) {
		const body: ApiResponse<null> = { success: false, error: 'Not logged in' };
		return Response.json(body, { status: 401 });
	}

	const sessionEnc = getCookie(cookie, 'session');
	const sessionId = await decryptSession(sessionEnc, env.SESSION_SECRET);
	if (!sessionId) {
		const body: ApiResponse<null> = { success: false, error: 'Invalid session' };
		return Response.json(body, { status: 401 });
	}

	const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
	if (!session || session.expiresAt < Date.now()) {
		const body: ApiResponse<null> = { success: false, error: 'Session expired' };
		return Response.json(body, { status: 401 });
	}

	const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
	if (!user) {
		const body: ApiResponse<null> = { success: false, error: 'User not found' };
		return Response.json(body, { status: 404 });
	}

	const payload: UserPublic = {
		email: user.email,
		name: user.name,
		createdAt: user.createdAt,
	};

	const body: ApiResponse<UserPublic> = { success: true, data: payload };

	return Response.json(body);
}

function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
