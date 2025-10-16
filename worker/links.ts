import { analytics, links, sessions } from '@/db/schema';
import { Database } from '@/types';
import { ApiResponse, CreateLinkApiRequest, GetLinkApiRequest, RemoveLinkApiRequest, Result } from '@shared/types';
import { eq, InferSelectModel } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { SHORTCODE_LENGTH } from '@shared/constants';
import { shortCodeSchema } from '@shared/schemas';
import z from 'zod';

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

	const { shortCode = nanoid(SHORTCODE_LENGTH), destination, expiresAt } = (await req.json()) as CreateLinkApiRequest;

	if (!shortCode || !destination || !expiresAt)
		return new Response(JSON.stringify({ success: false, error: 'Missing properties' } satisfies ApiResponse), { status: 400 });

	try {
		shortCodeSchema.parse(shortCode);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return new Response(
				JSON.stringify({ success: false, code: 'INVALID_SHORT_CODE', error: 'Invalid short code 🤨' } satisfies ApiResponse),
				{ status: 409 }
			);
		}
	}

	try {
		z.url().parse(destination);
	} catch (error) {
		return new Response(JSON.stringify({ success: false, error: 'Invalid URL' } satisfies ApiResponse), { status: 400 });
	}

	const expiry: number | false = typeof expiresAt === 'number' ? expiresAt : expiresAt === 'never' ? false : expiryMap[expiresAt];

	if (await kv.get(shortCode)) {
		return new Response(JSON.stringify({ success: false, error: 'Short code already exists' } satisfies ApiResponse), { status: 400 });
	}

	await kv
		.put(shortCode, destination, { expiration: expiry || undefined })
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
	return new Response(JSON.stringify({ success: true, message: shortCode } satisfies ApiResponse), { status: 201 });
}

export async function removeLink(req: Request, db: Database, env: Env, session: InferSelectModel<typeof sessions>): Promise<Response> {
	const { shortCode } = (await req.json()) as RemoveLinkApiRequest;
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

export async function redirect(req: Request, db: Database, env: Env, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(req.url);
	const path = url.pathname.slice(1); // remove leading "/"
	const ipAddress = req.headers.get('CF-Connecting-IP') || req.headers.get('CF-Connecting-IPv6');
	const location = req.headers.get('CF-IPCountry');
	const userAgent = req.headers.get('User-Agent');
	console.log('location:', location);

	if (path.length < 1)
		return new Response(`<h1>Invalid Link</h1>`, {
			status: 404,
			headers: {
				'Content-Type': 'text/html',
			},
		});

	const kv = env.kv;
	const destination = await kv.get(path);

	const task = new Promise<void>(async (resolve, reject) => {
		try {
			const link = await db.query.links.findFirst({ where: eq(links.shortCode, path) });

			if (!link) {
				resolve();
				return;
			}

			if (link.expiresAt && link.expiresAt < Date.now()) {
				await db.delete(links).where(eq(links.id, link.id));
				await kv.delete(path);
				resolve();
				return;
			}

			// Update link visit count using the current value + 1
			await db
				.update(links)
				.set({ visitsCount: (link.visitsCount || 0) + 1 })
				.where(eq(links.id, link.id));

			// Update analytics
			await db.insert(analytics).values({
				linkId: link.id,
				timestamp: Date.now(),
				ipAddress,
				userAgent,
				location,
			});
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	// Asynchronously handle deletion without `awaiting`
	if (destination) {
		ctx.waitUntil(task);
		return Response.redirect(destination, 301);
	}

	return new Response(`<h1>Link not found or expired</h1>`, {
		status: 404,
		headers: {
			'Content-Type': 'text/html',
		},
	});
}

export async function getLink(req: Request, env: Env): Promise<Response> {
	const kv = env.kv;
	const data = (await req.json()) satisfies GetLinkApiRequest;

	if (!data) return new Response(JSON.stringify({ success: false, message: 'shortCode missing' } satisfies ApiResponse));

	const { shortCode } = data;

	try {
		shortCodeSchema.parse(shortCode);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return new Response(
				JSON.stringify({ success: false, code: 'INVALID_SHORT_CODE', error: 'Invalid short code 🤨' } satisfies ApiResponse),
				{ status: 409 }
			);
		}
	}

	console.log('ShortCode:', shortCode);
	if (await kv.get(shortCode)) {
		return new Response(JSON.stringify({ success: true, message: shortCode, code: 'FOUND' } satisfies ApiResponse), { status: 200 });
	}
	return new Response(JSON.stringify({ success: true, message: 'not found', code: 'NOT_FOUND' } satisfies ApiResponse), { status: 404 });
}
