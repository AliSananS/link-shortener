import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { login, logout, signup } from './login';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { decryptSession, getCookie } from './session';

const { sessions } = schema;

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		const db = drizzle(env.db, { schema });
		const url = new URL(req.url);
		const path = url.pathname;
		const method = req.method;

		// API routes
		if (path.startsWith('/api/')) {
			switch (path) {
				case '/api/signup':
					if (method === 'POST') return signup(req, db);
					break;
				case '/api/login':
					if (method === 'POST') return login(req, db, env);
					break;
				case '/api/logout':
					if (method === 'POST') return logout(req, db);
					break;
				case '/api/me':
					if (method === 'GET') return dash(req, db, env);
					break;
			}
			return new Response('Method not allowed', { status: 405 });
		}

		// Try to serve static assets
		try {
			return await env.ASSETS.fetch(req);
		} catch {
			return new Response('Not found', { status: 404 });
		}
	},
};

async function dash(req: Request, db: any, env: Env): Promise<Response> {
	const cookie = req.headers.get('Cookie');
	if (!cookie) return new Response('Not logged in', { status: 401 });

	const sessionEnc = getCookie(cookie, 'session');
	const sessionId = await decryptSession(sessionEnc, env.SESSION_SECRET);
	if (!sessionId) return new Response('Invalid session', { status: 401 });

	const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
	if (!session || session.expiresAt < Date.now()) {
		return new Response('Session expired', { status: 401 });
	}

	const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
	if (!user) return new Response('User not found', { status: 404 });

	return Response.json({
		email: user.email,
		name: user.name,
		createdAt: user.createdAt,
	});
}
