import { links, sessions } from '@/db/schema';
import { Database } from '@/types';
import { ApiResponse, CreateLinkRequest, RemoveLinkRequest, Result } from '@shared/types';
import { InferSelectModel } from 'drizzle-orm';

export async function createLink(req: Request, db: Database, env: Env, session: InferSelectModel<typeof sessions>): Promise<Response> {
	const date = Date.now();
	const day = date * 1000 * 60 * 60 * 24;
	const week = day * 7;
	const year = day * 365;

	const expiryMap = {
		day: day,
		week: week,
		year: year,
	};

	const kv = env.kv;

	const { shortCode, destination, expiresAt } = (await req.json()) as CreateLinkRequest;

	const expiry: number | false = typeof expiresAt === 'number' ? expiresAt : expiresAt === 'never' ? false : expiryMap[expiresAt];

	if (!shortCode || !destination) {
		return new Response(JSON.stringify({ success: false, error: 'Missing shortCode or destination' } as ApiResponse), { status: 400 });
	}

	if (await kv.get(shortCode)) {
		return new Response(JSON.stringify({ success: false, error: 'Short code already exists' } as ApiResponse), { status: 400 });
	}

	await kv
		.put(shortCode, destination)
		.then(async () => {
			await db.insert(links).values({
				shortCode,
				userId: session.userId,
				expiresAt: expiry ? Date.now() + expiry : null,
			});
		})
		.catch(() => {
			return new Response(JSON.stringify({ success: false, error: 'Failed to create link' } as ApiResponse), { status: 500 });
		});
	return new Response(JSON.stringify({ success: true, value: shortCode } as ApiResponse), { status: 201 });
}

export async function removeLink(req: Request, db: Database, env: Env, session: InferSelectModel<typeof sessions>): Promise<Response> {
	const { shortCode } = (await req.json()) as RemoveLinkRequest;
	if (!shortCode) {
		return new Response(JSON.stringify({ success: false, error: 'Missing shortCode' } as ApiResponse), { status: 400 });
	}
	const kv = env.kv;

	if (!(await kv.get(shortCode))) {
		return new Response(JSON.stringify({ success: false, error: 'Link not found' } as ApiResponse), { status: 404 });
	}

	await kv.delete(shortCode);
	return new Response(JSON.stringify({ success: true } as ApiResponse), { status: 200 });
}

export async function redirect(req: Request, db: Database, env: Env): Promise<Response> {
	const url = new URL(req.url);
	const path = url.pathname.slice(1); // remove leading "/"
	const kv = env.kv;
	const destination = await kv.get(path);
	if (destination) {
		return Response.redirect(destination, 301);
	}
	return new Response('Not found', { status: 404 });
}

export async function getLink(shortCode: string, env: Env): Promise<Response> {
	const kv = env.kv;
	if (await kv.get(shortCode)) {
		return new Response(JSON.stringify({ success: true, value: shortCode } as ApiResponse), { status: 200 });
	}
	return new Response(JSON.stringify({ success: false, error: 'Link not found' } as ApiResponse), { status: 404 });
}
