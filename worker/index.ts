import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { login, logout, signup, me, getSession } from '@/session';
import { createLink, getLink, redirect, removeLink } from '@/links';
import { PROTECTED_ENDPOINTS, UI_ENDPOINTS, WORKER_ENDPOINTS } from '@shared/constants';
import type { WorkerEndpoint, ProtectedEndpoint, UiEndpoint, ApiResponse } from '@shared/types';

export default {
	async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(req.url);
		const db = drizzle(env.db, { schema });
		const path = url.pathname;
		const method = req.method;

		// API routes
		if (path.startsWith('/api/')) {
			switch (path as WorkerEndpoint) {
				case '/api/login':
					if (method === 'POST') return login(req, db, env);
					break;
				case '/api/signup':
					if (method === 'POST') return signup(req, db);
					break;
				case '/api/get-link':
					if (method === 'POST') return getLink(req, env);
			}

			// Protected routes
			if (PROTECTED_ENDPOINTS.includes(path as ProtectedEndpoint)) {
				const session = await getSession(req, db, env);
				if (!session) {
					return new Response(
						JSON.stringify({ success: false, error: 'Unauthorized', message: 'Login or signup required.' } satisfies ApiResponse),
						{ status: 401 }
					);
				}

				switch (path as ProtectedEndpoint) {
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
						if (method === 'DELETE') return removeLink(req, db, env, session);
				}
			}

			return new Response('Bad request', { status: 400 });
		}
		// Render landing page if not logged in
		if (path === '/' && method === 'GET') {
			const session = await getSession(req, db, env);
			if (!session) {
				const landingUrl = url;
				landingUrl.pathname = '/landing';
				return env.ASSETS.fetch(landingUrl);
			}
		}
		// Serve static assets
		if (UI_ENDPOINTS.includes(path as UiEndpoint) && method === 'GET') return serveStaticAssets(req, env.ASSETS);

		// Redirect short links
		return redirect(req, db, env, ctx);
	},
};

async function serveStaticAssets(req: Request, staticAssets: Env['ASSETS']): Promise<Response> {
	try {
		return await staticAssets.fetch(req);
	} catch {
		return new Response('Not found', { status: 404 });
	}
}
