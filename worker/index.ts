import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { users, sessions } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		const db = drizzle(env.db);
		const url = new URL(req.url);
		const path = url.pathname;
		const method = req.method;

		if (path === '/signup' && method === 'POST') return signup(req, db);
		if (path === '/login' && method === 'POST') return login(req, db, env);
		if (path === '/logout' && method === 'POST') return logout(req, db, env);
		if (path === '/me' && method === 'GET') return me(req, db, env);

		return new Response('not found', { status: 404 });
	},
};

async function signup(req: Request, db: DrizzleD1Database) {
	const { email, password } = await req.json();
	if (!email || !password) return new Response('Missing fields', { status: 400 });

	const hash = await bcrypt.hash(password, 10);
	await db.insert(users).values({
		id: nanoid(),
		email,
		passwordHash: hash,
		createdAt: Date.now(),
	});

	return new Response('User created');
}

async function login(req: Request, db: DrizzleD1Database, env: Env) {
	const body = await req.json();
	const { email, password } = body;

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

	const encrypted = await encryptSession(sessionId, process.env.SESSION_SECRET);

	return new Response('Logged in', {
		headers: {
			'Set-Cookie': `session=${encrypted}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
		},
	});
}

async function logout(req: Request, db: DrizzleD1Database, env: Env) {
	const cookie = req.headers.get('Cookie');
	if (!cookie) return new Response('No session', { status: 401 });

	const sessionId = await decryptSession(getCookie(cookie, 'session'), process.env.SESSION_SECRET);
	if (sessionId) await db.delete(sessions).where(eq(sessions.id, sessionId));

	return new Response('Logged out', {
		headers: { 'Set-Cookie': 'session=; Path=/; Max-Age=0;' },
	});
}

async function me(req: Request, db: DrizzleD1Database, env: Env) {
	const cookie = req.headers.get('Cookie');
	if (!cookie) return new Response('Not logged in', { status: 401 });

	const sessionEnc = getCookie(cookie, 'session');
	const sessionId = await decryptSession(sessionEnc, process.env.SESSION_SECRET);
	const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });

	if (!session || session.expiresAt < Date.now()) return new Response('Invalid session', { status: 401 });

	const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
	if (!user) return new Response('User not found', { status: 404 });

	return Response.json({ email: user.email });
}

// --- Session Helpers ---

function getCookie(cookie: string, name: string) {
	return (
		cookie
			.split(';')
			.find((c) => c.trim().startsWith(name + '='))
			?.split('=')[1] || null
	);
}

async function encryptSession(sessionId: string, secret: string) {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'AES-GCM', false, ['encrypt']);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(sessionId));
	const combined = new Uint8Array([...iv, ...new Uint8Array(enc)]);
	return btoa(String.fromCharCode(...combined));
}

async function decryptSession(encoded, secret) {
	if (!encoded) return null;
	try {
		const data = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
		const iv = data.slice(0, 12);
		const enc = data.slice(12);
		const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'AES-GCM', false, ['decrypt']);
		const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, enc);
		return new TextDecoder().decode(dec);
	} catch {
		return null;
	}
}
