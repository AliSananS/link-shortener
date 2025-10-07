import { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { LoginRequest, SignupRequest } from '@/types';
import { encryptSession, decryptSession, getCookie } from './session';
import type { SignupResponseError, LoginResponseError, ApiResponse } from '@shared/types';

const { users, sessions } = schema;

type dbType = DrizzleD1Database<typeof schema> & {
	$client: D1Database;
};

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

	const encrypted = await encryptSession(sessionId, process.env.SESSION_SECRET);

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
	console.log('body:', body);

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

	const sessionId = await decryptSession(getCookie(cookie, 'session'), process.env.SESSION_SECRET);
	if (sessionId) await db.delete(sessions).where(eq(sessions.id, sessionId));

	const resBody: ApiResponse<null> = {
		success: true,
		message: 'Logged out successfully',
	};

	return Response.json(resBody, {
		headers: { 'Set-Cookie': 'session=; Path=/; Max-Age=0;' },
	});
}

function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
