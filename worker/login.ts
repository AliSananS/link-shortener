import { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { LoginRequest, SignupRequest } from '@/types';
import { encryptSession, decryptSession, getCookie } from './session';

const { users, sessions } = schema;

type dbType = DrizzleD1Database<typeof schema> & {
	$client: D1Database;
};

export async function signup(req: Request, db: dbType): Promise<Response> {
	const { email, password, name } = (await req.json()) satisfies SignupRequest;
	if (!email || !password || !name) return new Response('Missing fields', { status: 400 });

	if (!validateEmail(email)) {
		return new Response('Invalid email format', { status: 400 });
	}

	const hash = await bcrypt.hash(password, 10);

	const user = await db.query.users.findFirst({ where: eq(users.email, email) });
	if (user !== undefined) {
		return new Response('User exists', { status: 409 });
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

	return new Response('User created', {
		status: 201,
		headers: {
			'Set-Cookie': `session=${encrypted}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
		},
	});
}

export async function login(req: Request, db: dbType, env: Env): Promise<Response> {
	const body = (await req.json()) satisfies LoginRequest;
	const { email, password } = body;

	if (!email || !password) return new Response('Missing credentials', { status: 400 });

	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
	});
	if (!user) return new Response('Invalid email or password', { status: 401 });

	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) return new Response('Invalid email or password', { status: 401 });

	const sessionId = nanoid();
	await db.insert(sessions).values({
		id: sessionId,
		userId: user.id,
		createdAt: Date.now(),
		expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	const encrypted = await encryptSession(sessionId, env.SESSION_SECRET);

	return new Response('Logged in', {
		headers: {
			'Set-Cookie': `session=${encrypted}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
		},
	});
}

export async function logout(req: Request, db: dbType): Promise<Response> {
	const cookie = req.headers.get('Cookie');
	if (!cookie) return new Response('No session', { status: 401 });

	const sessionId = await decryptSession(getCookie(cookie, 'session'), process.env.SESSION_SECRET);
	if (sessionId) await db.delete(sessions).where(eq(sessions.id, sessionId));

	return new Response('Logged out', {
		headers: { 'Set-Cookie': 'session=; Path=/; Max-Age=0;' },
	});
}

function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
