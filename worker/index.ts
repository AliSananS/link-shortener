import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { login, logout, signup, me, getSession } from '@/session';
import { createLink, redirect, removeLink } from '@/links';

const protectedRoutes = ['/api/me', '/api/logout', '/api/create-link', '/remove-link'] as const;

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		const url = new URL(req.url);
		const db = drizzle(env.db, { schema });
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
			}

			// Protected routes
			if (protectedRoutes.includes(path as (typeof protectedRoutes)[number])) {
				const session = await getSession(req, db, env);
				if (!session) {
					return new Response('Unauthorized', { status: 401 });
				}

				switch (path as (typeof protectedRoutes)[number]) {
					case '/api/logout':
						if (method === 'POST') return logout(req, db);
						break;
					case '/api/me':
						if (method === 'GET') return me(req, db, env);
						break;
					case '/api/create-link':
						if (method === 'POST') return createLink(req, db, env, session);
						break;
					case '/remove-link':
						if (method === 'DELETE') {
							return removeLink(req, db, env, session);
						}
				}
			}

			return new Response('Bad request', { status: 400 });
		}

		return redirect(req, db, env);
	},
};

async function serveStaticAssets(req: Request, staticAssets: Env['ASSETS']): Promise<Response> {
	try {
		return await staticAssets.fetch(req);
	} catch {
		return new Response('Not found', { status: 404 });
	}
}
