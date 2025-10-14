import { links, sessions } from '@/db/schema';
import { Database } from '@/types';
import { ApiResponse, CreateLinkRequest, GetLinkRequest, RemoveLinkRequest, Result } from '@shared/types';
import { eq, InferSelectModel } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { SHORTCODE_LENGTH } from '@shared/constants';

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

	const { shortCode = nanoid(SHORTCODE_LENGTH), destination, expiresAt } = (await req.json()) as CreateLinkRequest;

	const expiry: number | false = typeof expiresAt === 'number' ? expiresAt : expiresAt === 'never' ? false : expiryMap[expiresAt];

	if (!destination) {
		return new Response(JSON.stringify({ success: false, error: 'Missing destination' } satisfies ApiResponse), { status: 400 });
	}

	if (await kv.get(shortCode)) {
		return new Response(JSON.stringify({ success: false, error: 'Short code already exists' } satisfies ApiResponse), { status: 400 });
	}

	await kv
		.put(shortCode, destination, { expiration: expiry || undefined, metadata: { createdAt: Date.now() } })
		.then(async () => {
			await db.insert(links).values({
				shortCode,
				userId: session.userId,
				expiresAt: expiry ? Date.now() + expiry : null,
				createdAt: Date.now(),
			});
		})
		.catch(() => {
			return new Response(JSON.stringify({ success: false, error: 'Failed to create link' } satisfies ApiResponse), { status: 500 });
		});
	console.log('Created:', { shortCode, destination, expiresAt, expiry });
	return new Response(JSON.stringify({ success: true, message: shortCode } satisfies ApiResponse), { status: 201 });
}

export async function removeLink(req: Request, db: Database, env: Env, session: InferSelectModel<typeof sessions>): Promise<Response> {
	const { shortCode } = (await req.json()) as RemoveLinkRequest;
	if (!shortCode) {
		return new Response(JSON.stringify({ success: false, error: 'Missing shortCode' } satisfies ApiResponse), { status: 400 });
	}
	const kv = env.kv;

	if (!(await kv.get(shortCode))) {
		return new Response(JSON.stringify({ success: false, error: 'Link not found' } satisfies ApiResponse), { status: 404 });
	}

	await kv.delete(shortCode);
	return new Response(JSON.stringify({ success: true } satisfies ApiResponse), { status: 200 });
}

export async function redirect(req: Request, db: Database, env: Env): Promise<Response> {
	const url = new URL(req.url);
	const path = url.pathname.slice(1); // remove leading "/"

	if (path.length < 1)
		return new Response(`<h1>Invalid Link</h1>`, {
			status: 404,
			headers: {
				'Content-Type': 'text/html',
			},
		});

	const kv = env.kv;
	const destination = await kv.get(path);

	if (destination) {
		const expiry = db
			.select()
			.from(links)
			.where(eq(links.shortCode, path))
			.then((data) => {
				if (data[0].expiresAt && data[0].expiresAt < Date.now()) {
					db.delete(links).where(eq(links.shortCode, path));
					kv.delete(path);
				}
			});
		return Response.redirect(destination, 301);
	}

	if (!destination)
		return new Response(`<h1>Link not found or expired</h1>`, {
			status: 404,
			headers: {
				'Content-Type': 'text/html',
			},
		});
	return new Response('Link not found', { status: 404 });
}

export async function getLink(req: Request, env: Env): Promise<Response> {
	const kv = env.kv;
	const { shortCode } = (await req.json()) as GetLinkRequest;

	if (!shortCode) return new Response(JSON.stringify({ success: false, message: 'shortCode missing' } satisfies ApiResponse));
	if (await kv.get(shortCode)) {
		return new Response(JSON.stringify({ success: true, message: shortCode } satisfies ApiResponse), { status: 200 });
	}
	return new Response(JSON.stringify({ success: false, error: 'Link not found' } satisfies ApiResponse), { status: 404 });
}
