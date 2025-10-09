import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { login, logout, signup, me } from './session';

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
					if (method === 'GET') return me(req, db, env);
					break;
			}
			return new Response('Method not allowed', { status: 405 });
		}

		if (env.SERVER === 'development') {
			console.log('Dev mode: proxying dev server');
			try {
				return await fetch('http://localhost:4000' + path, req);
			} catch (err) {
				return new Response('Dev server not running', { status: 500 });
			}
		}

		// Try to serve static assets
		try {
			return await env.ASSETS.fetch(req);
		} catch {
			return new Response('Not found', { status: 404 });
		}
	},
};
